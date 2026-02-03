'use client';

import { VacancyWithPriority, CompanyGroup } from '@/types/dashboard';
import { PriorityBadge } from './priority-badge';
import { Edit2, Building2 } from 'lucide-react';
import { useState } from 'react';
import { PriorityModal } from './priority-modal';

interface CompactViewProps {
  companyGroups: CompanyGroup[];
  isAdmin: boolean;
}

export function CompactView({ companyGroups, isAdmin }: CompactViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<VacancyWithPriority | null>(null);

  const handleEdit = (vacancy: VacancyWithPriority) => {
    setSelectedVacancy(vacancy);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {companyGroups.map((group) => (
          <div
            key={group.company.id}
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
                </div>
                {group.companyPriority && (
                  <PriorityBadge priority={group.companyPriority} />
                )}
              </div>
            </div>

            {/* Vacancies List */}
            <div className="divide-y divide-gray-100">
              {group.vacancies.map((vacancy) => (
                <div
                  key={vacancy.job.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {vacancy.job.title}
                        </h4>
                        <PriorityBadge priority={vacancy.displayPriority} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>
                          <span className="font-medium">Strategie:</span>{' '}
                          {vacancy.priority?.strategy_score || '-'}
                        </span>
                        <span>
                          <span className="font-medium">Hiring:</span>{' '}
                          {vacancy.priority?.hiring_chance || '-'}
                        </span>
                        <span>
                          <span className="font-medium">Pijn:</span>{' '}
                          {vacancy.priority?.client_pain ? (
                            <span className="text-red-600 font-medium">Ja</span>
                          ) : (
                            'Nee'
                          )}
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
              ))}
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

