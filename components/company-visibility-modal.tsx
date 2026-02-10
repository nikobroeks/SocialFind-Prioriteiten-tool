'use client';

import { useState } from 'react';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Company {
  id: number;
  name: string;
}

interface CompanyVisibilityModalProps {
  companies: Company[];
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyVisibilityModal({ 
  companies, 
  isAdmin, 
  isOpen, 
  onClose 
}: CompanyVisibilityModalProps) {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  // Fetch visibility settings
  const { data: visibilityData } = useQuery({
    queryKey: ['company-visibility'],
    queryFn: async () => {
      const response = await fetch('/api/company-visibility');
      if (!response.ok) throw new Error('Failed to fetch visibility');
      return response.json();
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const visibility = visibilityData?.visibility || [];
  
  // Get visibility for each company
  const getCompanyVisibility = (companyId: number, companyName: string): boolean => {
    const companyVis = visibility.find(
      (v: any) => v.recruitee_company_id === companyId && v.company_name === companyName
    );
    // Default to visible if no setting exists
    return companyVis ? companyVis.is_visible : true;
  };
  
  // Count visible/hidden companies
  const visibleCompaniesCount = companies.filter(company => 
    getCompanyVisibility(company.id, company.name)
  ).length;
  const hiddenCompaniesCount = companies.length - visibleCompaniesCount;

  const handleToggleCompany = async (companyId: number, companyName: string, isVisible: boolean) => {
    if (!isAdmin) return;
    
    setIsUpdating(companyId);
    try {
      const response = await fetch('/api/company-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          companyName,
          isVisible,
        }),
      });

      if (!response.ok) throw new Error('Failed to update visibility');

      // Invalidate company-visibility to refresh the visibility settings
      await queryClient.invalidateQueries({ queryKey: ['company-visibility'] });
      
      // Also invalidate recruiteeJobs to refresh the dashboard
      await queryClient.invalidateQueries({ queryKey: ['recruiteeJobs'] });
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('Fout bij bijwerken van zichtbaarheid');
    } finally {
      setIsUpdating(null);
    }
  };

  if (!isOpen || !isAdmin) return null;

  // Sort companies: visible first, then by name
  const sortedCompanies = [...companies].sort((a, b) => {
    const aVisible = getCompanyVisibility(a.id, a.name);
    const bVisible = getCompanyVisibility(b.id, b.name);
    if (aVisible !== bVisible) {
      return aVisible ? -1 : 1; // Visible first
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Floating Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Bedrijf Zichtbaarheid
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Beheer de zichtbaarheid van bedrijven
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-gray-900">{companies.length}</span> totaal
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-green-600" />
                <span className="font-semibold text-gray-900">{visibleCompaniesCount}</span> zichtbaar
              </span>
              <span className="flex items-center gap-1">
                <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-semibold text-gray-900">{hiddenCompaniesCount}</span> verborgen
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              {sortedCompanies.map((company) => {
                const isVisible = getCompanyVisibility(company.id, company.name);
                const isUpdatingThisCompany = isUpdating === company.id;
                
                return (
                  <div
                    key={`${company.id}-${company.name}`}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                      isVisible
                        ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        : 'border-gray-200 bg-gray-50 opacity-75 hover:bg-gray-100'
                    }`}
                  >
                    <label
                      htmlFor={`company-${company.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className={`h-4 w-4 flex-shrink-0 ${
                          isVisible ? 'text-gray-700' : 'text-gray-400'
                        }`} />
                        <p className={`text-sm font-medium line-clamp-2 ${
                          isVisible ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {company.name}
                        </p>
                        {!isVisible && (
                          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                            Verborgen
                          </span>
                        )}
                      </div>
                    </label>
                    <button
                      onClick={() => handleToggleCompany(company.id, company.name, !isVisible)}
                      disabled={isUpdatingThisCompany}
                      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all disabled:opacity-50 ${
                        isVisible
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-sm'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                      title={isVisible ? 'Verbergen' : 'Tonen'}
                    >
                      {isUpdatingThisCompany ? (
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
              
              {companies.length === 0 && (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Geen bedrijven gevonden
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

