'use client';

import { VacancyWithPriority } from '@/types/dashboard';
import { PriorityBadge } from './priority-badge';
import { Edit2 } from 'lucide-react';
import { useState } from 'react';
import { PriorityModal } from './priority-modal';
import { PriorityColor } from '@/types/dashboard';

interface KanbanViewProps {
  vacancies: VacancyWithPriority[];
  isAdmin: boolean;
}

export function KanbanView({ vacancies, isAdmin }: KanbanViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<VacancyWithPriority | null>(null);

  const columns: { priority: PriorityColor; label: string; color: string }[] = [
    { priority: 'Red', label: 'Hoog Prioriteit', color: 'border-red-200 bg-red-50/30' },
    { priority: 'Orange', label: 'Medium Prioriteit', color: 'border-orange-200 bg-orange-50/30' },
    { priority: 'Green', label: 'Laag Prioriteit', color: 'border-green-200 bg-green-50/30' },
  ];

  const handleEdit = (vacancy: VacancyWithPriority) => {
    setSelectedVacancy(vacancy);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(({ priority, label, color }) => {
          const columnVacancies = vacancies.filter(v => v.displayPriority === priority);
          
          return (
            <div
              key={priority}
              className={`rounded-xl border-2 ${color} min-h-[400px] flex flex-col`}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-current/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={priority} />
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-white/80 px-2 py-1 rounded-full">
                    {columnVacancies.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {columnVacancies.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Geen vacatures
                  </div>
                ) : (
                  columnVacancies.map((vacancy) => (
                    <div
                      key={vacancy.job.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                        {vacancy.job.title}
                      </h3>
                      
                      <div className="space-y-2 text-xs text-gray-600 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Strategie:</span>
                          <span className="font-medium">
                            {vacancy.priority?.strategy_score || '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Hiring:</span>
                          <span className="font-medium">
                            {vacancy.priority?.hiring_chance || '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Pijn:</span>
                          <span className="font-medium">
                            {vacancy.priority?.client_pain ? (
                              <span className="text-red-600">Ja</span>
                            ) : (
                              'Nee'
                            )}
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => handleEdit(vacancy)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors border border-orange-200"
                        >
                          <Edit2 className="h-3 w-3" />
                          Bewerken
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
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

