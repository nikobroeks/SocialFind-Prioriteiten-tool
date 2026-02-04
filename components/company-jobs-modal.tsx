'use client';

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Save } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllJobVisibility, bulkUpdateJobVisibility, type JobVisibility } from '@/lib/supabase/job-visibility';
import { RecruiteeJob } from '@/types/recruitee';

interface CompanyJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  companyId: number;
  jobs: RecruiteeJob[];
}

export function CompanyJobsModal({
  isOpen,
  onClose,
  companyName,
  companyId,
  jobs,
}: CompanyJobsModalProps) {
  const queryClient = useQueryClient();
  const [localVisibility, setLocalVisibility] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Fetch current visibility settings
  const { data: visibilitySettings = [] } = useQuery({
    queryKey: ['job-visibility'],
    queryFn: getAllJobVisibility,
    enabled: isOpen,
  });

  // Initialize local state from visibility settings
  useEffect(() => {
    if (visibilitySettings.length > 0 && jobs.length > 0) {
      const visibilityMap: Record<number, boolean> = {};
      jobs.forEach(job => {
        const setting = visibilitySettings.find(
          v => v.recruitee_job_id === job.id && v.recruitee_company_id === companyId
        );
        // Default to true if no setting exists
        visibilityMap[job.id] = setting?.is_visible ?? true;
      });
      setLocalVisibility(visibilityMap);
    } else if (jobs.length > 0) {
      // If no settings exist, default all to visible
      const visibilityMap: Record<number, boolean> = {};
      jobs.forEach(job => {
        visibilityMap[job.id] = true;
      });
      setLocalVisibility(visibilityMap);
    }
  }, [visibilitySettings, jobs, companyId]);

  const toggleJobVisibility = (jobId: number) => {
    setLocalVisibility(prev => ({
      ...prev,
      [jobId]: !prev[jobId],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(localVisibility).map(([jobId, isVisible]) => ({
        jobId: parseInt(jobId),
        companyId,
        isVisible,
      }));

      await bulkUpdateJobVisibility(updates, companyName);
      
      // Invalidate queries to refresh dashboard
      await queryClient.invalidateQueries({ queryKey: ['job-visibility'] });
      await queryClient.invalidateQueries({ queryKey: ['recruiteeJobs'] });
      
      onClose();
    } catch (error) {
      console.error('Error saving job visibility:', error);
      alert('Er is een fout opgetreden bij het opslaan');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const visibleCount = Object.values(localVisibility).filter(v => v).length;
  const hiddenCount = Object.values(localVisibility).filter(v => !v).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Jobs Beheren</h2>
            <p className="text-sm text-gray-600 mt-1">{companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-gray-700">
                <span className="font-semibold">{visibleCount}</span> zichtbaar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">
                <span className="font-semibold">{hiddenCount}</span> verborgen
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">
                <span className="font-semibold">{jobs.length}</span> totaal
              </span>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {jobs.map((job) => {
              const isVisible = localVisibility[job.id] ?? true;
              return (
                <div
                  key={job.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    isVisible
                      ? 'bg-white border-gray-200 hover:border-green-300'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{job.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Job ID: {job.id} • Status: {job.status || 'published'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleJobVisibility(job.id)}
                    className={`ml-4 p-2 rounded-lg transition-colors ${
                      isVisible
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={isVisible ? 'Verberg job' : 'Toon job'}
                  >
                    {isVisible ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}

