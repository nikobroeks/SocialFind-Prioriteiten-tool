'use client';

import { VacancyWithPriority, CompanyGroup } from '@/types/dashboard';
import { PriorityBadge } from './priority-badge';
import { Edit2, Building2, Users, Search, Inbox } from 'lucide-react';
import { useState } from 'react';
import { PriorityModal } from './priority-modal';

interface CompactViewProps {
  companyGroups: CompanyGroup[];
  isAdmin: boolean;
  companyHires?: Record<string, number>;
  searchQuery?: string;
  applicantsPerVacancy?: Record<string, number>;
}

export function CompactView({ companyGroups, isAdmin, companyHires = {}, searchQuery = '', applicantsPerVacancy = {} }: CompactViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<VacancyWithPriority | null>(null);

  const handleEdit = (vacancy: VacancyWithPriority) => {
    setSelectedVacancy(vacancy);
    setIsModalOpen(true);
  };

  if (companyGroups.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {searchQuery ? 'Geen resultaten gevonden' : 'Geen bedrijven beschikbaar'}
        </p>
        <p className="text-sm text-gray-500">
          {searchQuery 
            ? `Geen bedrijven of vacatures gevonden voor "${searchQuery}"`
            : 'Er zijn momenteel geen bedrijven om weer te geven.'
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {companyGroups.map((group, index) => (
          <div
            key={`compact-company-${index}-${group.company.id}`}
            className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Company Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-500" />
                  <h3 className="font-semibold text-gray-900">{group.company.name}</h3>
                  <span className="text-xs text-gray-500">
                    ({group.vacancies.length} vacatures)
                  </span>
                  {(() => {
                    // Helper to normalize company names for matching
                    const normalizeCompanyName = (name: string): string => {
                      return name
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, ' ')
                        .replace(/\./g, '')
                        .replace(/,/g, '')
                        .replace(/-/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    };
                    
                    // Find hires count with fuzzy matching
                    const getCompanyHires = (companyName: string): number => {
                      const normalized = normalizeCompanyName(companyName);
                      // Try exact match first
                      if (companyHires[companyName] !== undefined) {
                        return companyHires[companyName];
                      }
                      // Try normalized match
                      const normalizedEntries = Object.entries(companyHires).find(([name]) => 
                        normalizeCompanyName(name) === normalized
                      );
                      if (normalizedEntries) {
                        return normalizedEntries[1];
                      }
                      // Try partial match
                      const partialMatch = Object.entries(companyHires).find(([name]) => 
                        normalized.includes(normalizeCompanyName(name)) || 
                        normalizeCompanyName(name).includes(normalized)
                      );
                      return partialMatch ? partialMatch[1] : 0;
                    };
                    
                    const hiresCount = getCompanyHires(group.company.name);
                    return hiresCount > 0 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 border border-green-200 rounded-full">
                        <Users className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">{hiresCount}</span>
                        <span className="text-xs text-green-600">hires</span>
                      </div>
                    );
                  })()}
                </div>
                {group.companyPriority && (
                  <PriorityBadge priority={group.companyPriority} />
                )}
              </div>
            </div>

            {/* Vacancies List */}
            <div className="divide-y divide-gray-100">
              {group.vacancies.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Inbox className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">
                    {searchQuery ? 'Geen vacatures gevonden voor deze zoekopdracht' : 'Geen vacatures beschikbaar'}
                  </p>
                </div>
              ) : (
                group.vacancies.map((vacancy) => {
                  const applicantCount = applicantsPerVacancy[vacancy.job.id.toString()] || 0;
                  return (
                <div
                  key={vacancy.job.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {vacancy.job.title}
                        </h4>
                        {applicantCount > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full">
                            <Users className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-semibold text-blue-700">{applicantCount}</span>
                            <span className="text-xs text-blue-600">sollicitanten</span>
                          </div>
                        )}
                        <PriorityBadge priority={vacancy.displayPriority} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>
                          <span className="font-medium">Klant pijn:</span>{' '}
                          {vacancy.priority?.client_pain_level || '-'}
                        </span>
                        <span>
                          <span className="font-medium">Tijdkritiek:</span>{' '}
                          {vacancy.priority?.time_criticality || '-'}
                        </span>
                        <span>
                          <span className="font-medium">Strategie:</span>{' '}
                          {vacancy.priority?.strategic_value || '-'}
                        </span>
                        <span>
                          <span className="font-medium">Account:</span>{' '}
                          {vacancy.priority?.account_health || '-'}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleEdit(vacancy)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
                      >
                        <Edit2 className="h-3 w-3" />
                        Bewerken
                      </button>
                    )}
                  </div>
                </div>
                );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && selectedVacancy && (
        <PriorityModal
          vacancy={selectedVacancy}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedVacancy(null);
          }}
        />
      )}
    </>
  );
}

