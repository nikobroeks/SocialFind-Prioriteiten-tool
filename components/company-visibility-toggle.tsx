'use client';

import { useState, useMemo } from 'react';
import { Eye, EyeOff, Settings, Check } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Job {
  id: number;
  title: string;
  company_id: number;
  [key: string]: unknown;
}

interface CompanyVisibilityToggleProps {
  companyName: string;
  companyId: number;
  jobs: Job[];
  isAdmin: boolean;
}

export function CompanyVisibilityToggle({ 
  companyName, 
  companyId, 
  jobs,
  isAdmin 
}: CompanyVisibilityToggleProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  // Fetch visibility settings
  const { data: visibilityData } = useQuery({
    queryKey: ['job-visibility'],
    queryFn: async () => {
      const response = await fetch('/api/job-visibility');
      if (!response.ok) throw new Error('Failed to fetch visibility');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const visibility = visibilityData?.visibility || [];
  
  // Get visibility for each job
  // IMPORTANT: Only check visibility for jobs that belong to THIS company
  const getJobVisibility = (jobId: number): boolean => {
    const jobVisibility = visibility.find(
      (v: any) => v.recruitee_job_id === jobId && 
                  (v.recruitee_company_id === companyId || v.company_name === companyName)
    );
    // Default to visible if no setting exists
    return jobVisibility ? jobVisibility.is_visible : true;
  };
  
  // Filter jobs to ensure they all belong to this company
  // IMPORTANT: This should include ALL jobs for this company, regardless of visibility status
  // The visibility is just a UI indicator - ALL jobs should always be shown in the modal
  const companyJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      const jobCompanyId = job.company_id;
      const jobCompanyName = ((job.company as any)?.name || (job as any).company_name || '').trim().toLowerCase();
      const targetCompanyName = companyName.trim().toLowerCase();
      
      // Match by both ID and name for strict filtering
      const matchesById = jobCompanyId === companyId;
      const matchesByName = jobCompanyName === targetCompanyName && jobCompanyName !== '';
      
      // Only include if matches by ID OR (matches by name AND ID matches)
      // This ensures we don't accidentally include jobs from other companies with similar names
      return matchesById || (matchesByName && jobCompanyId === companyId);
    });
    
    // CRITICAL: Always return ALL jobs for this company, including hidden ones
    // The visibility status is checked separately via getJobVisibility() and shown as UI state
    // Jobs should NEVER be filtered out based on visibility - they should always be visible in the modal
    return filtered;
  }, [jobs, companyId, companyName]);

  // Count visible/hidden jobs (using filtered company jobs)
  const visibleJobsCount = companyJobs.filter(job => getJobVisibility(job.id)).length;
  const hiddenJobsCount = companyJobs.length - visibleJobsCount;

  const handleToggleJob = async (jobId: number, isVisible: boolean) => {
    if (!isAdmin) return;
    
    setIsUpdating(jobId);
    try {
      const response = await fetch('/api/job-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          companyId,
          companyName,
          isVisible,
        }),
      });

      if (!response.ok) throw new Error('Failed to update visibility');

      // Invalidate job-visibility to refresh the visibility settings
      // This will update the visibility state but keep the modal open
      // and keep showing all jobs (including hidden ones)
      await queryClient.invalidateQueries({ queryKey: ['job-visibility'] });
      
      // IMPORTANT: Do NOT invalidate recruiteeJobs - this would cause the parent
      // to re-render and potentially pass different jobs. We want to keep the
      // same jobs list so all jobs (including hidden) remain visible in the modal.
      
      // Also do NOT close the modal - keep it open so user can see the change
      // and potentially toggle other jobs
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('Fout bij bijwerken van zichtbaarheid');
    } finally {
      setIsUpdating(null);
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
        title="Vacature zichtbaarheid beheren"
      >
        <Settings className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Zichtbaarheid</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Floating Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[80vh] flex flex-col pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Vacature Zichtbaarheid
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {companyName}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900">{companyJobs.length}</span> totaal
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-green-600" />
                    <span className="font-semibold text-gray-900">{visibleJobsCount}</span> zichtbaar
                  </span>
                  <span className="flex items-center gap-1">
                    <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-900">{hiddenJobsCount}</span> verborgen
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-2">
                  {companyJobs.map((job) => {
                    const isVisible = getJobVisibility(job.id);
                    const isUpdatingThisJob = isUpdating === job.id;
                    
                    return (
                      <div
                        key={job.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                          isVisible
                            ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            : 'border-gray-200 bg-gray-50 opacity-75 hover:bg-gray-100'
                        }`}
                      >
                        <label
                          htmlFor={`job-${job.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium line-clamp-2 ${
                              isVisible ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {job.title || `Vacature #${job.id}`}
                            </p>
                            {!isVisible && (
                              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                                Verborgen
                              </span>
                            )}
                          </div>
                        </label>
                        <button
                          onClick={() => handleToggleJob(job.id, !isVisible)}
                          disabled={isUpdatingThisJob}
                          className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all disabled:opacity-50 ${
                            isVisible
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-sm'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
                          title={isVisible ? 'Verbergen' : 'Tonen'}
                        >
                          {isUpdatingThisJob ? (
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : isVisible ? (
                            <Eye className="h-5 w-5" />
                          ) : (
                            <EyeOff className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                  
                  {companyJobs.length === 0 && (
                    <div className="text-center py-8">
                      <EyeOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        Geen vacatures gevonden voor {companyName}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

