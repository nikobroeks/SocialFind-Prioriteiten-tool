'use client';

import { VacancyWithPriority } from '@/types/dashboard';
import { PriorityBadge } from './priority-badge';
import { Edit2, Users } from 'lucide-react';
import { useState } from 'react';
import { PriorityModal } from './priority-modal';

interface VacancyRowProps {
  vacancy: VacancyWithPriority;
  isAdmin: boolean;
  applicantCount?: number;
}

export function VacancyRow({ vacancy, isAdmin, applicantCount = 0 }: VacancyRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Mobile card view */}
      <tr className="sm:hidden border-b border-gray-200 hover:bg-orange-50/50 transition-colors">
        <td colSpan={isAdmin ? 7 : 6} className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm">{vacancy.job.title}</h3>
                {applicantCount > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full">
                      <Users className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700">{applicantCount}</span>
                      <span className="text-xs text-blue-600">sollicitanten</span>
                    </div>
                  </div>
                )}
              </div>
              <PriorityBadge priority={vacancy.displayPriority} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block mb-1">Sollicitanten</span>
                <span className="text-gray-900 font-medium flex items-center gap-1">
                  <Users className="h-3 w-3 text-blue-600" />
                  {applicantCount}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Klant pijn</span>
                <span className="text-gray-900 font-medium">
                  {vacancy.priority?.client_pain_level || <span className="text-gray-400">-</span>}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Tijdkritiek</span>
                <span className="text-gray-900 font-medium">
                  {vacancy.priority?.time_criticality || <span className="text-gray-400">-</span>}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Strategie</span>
                <span className="text-gray-900 font-medium">
                  {vacancy.priority?.strategic_value || <span className="text-gray-400">-</span>}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Account</span>
                <span className="text-gray-900 font-medium">
                  {vacancy.priority?.account_health || <span className="text-gray-400">-</span>}
                </span>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                aria-label={`Bewerk prioriteit voor ${vacancy.job.title}`}
              >
                <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                Bewerken
              </button>
            )}
          </div>
        </td>
      </tr>
      
      {/* Desktop table view */}
      <tr className="hidden sm:table-row border-b border-gray-100 hover:bg-orange-50/50 transition-colors group">
        <td className="p-2 font-medium text-gray-900 text-sm align-top">
          <span className="group-hover:text-orange-600 transition-colors break-words">
            {vacancy.job.title}
          </span>
        </td>
        <td className="p-2 pr-4 text-xs text-gray-700 whitespace-nowrap text-center align-top">
          <div className="flex items-center justify-center gap-1">
            <Users className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
            <span className="font-semibold text-gray-900">{applicantCount}</span>
          </div>
        </td>
        <td className="p-2 pl-4 text-xs text-gray-700 align-top">
          <span className="break-words" aria-label={`Klant pijn: ${vacancy.priority?.client_pain_level || 'Niet ingesteld'}`}>
            {vacancy.priority?.client_pain_level || (
              <span className="text-gray-400" aria-hidden="true">-</span>
            )}
          </span>
        </td>
        <td className="p-2 text-xs text-gray-700 align-top">
          <span className="break-words" aria-label={`Tijdkritiek: ${vacancy.priority?.time_criticality || 'Niet ingesteld'}`}>
            {vacancy.priority?.time_criticality || (
              <span className="text-gray-400" aria-hidden="true">-</span>
            )}
          </span>
        </td>
        <td className="p-2 text-xs text-gray-700 align-top">
          <span className="break-words" aria-label={`Strategische waarde: ${vacancy.priority?.strategic_value || 'Niet ingesteld'}`}>
            {vacancy.priority?.strategic_value || (
              <span className="text-gray-400" aria-hidden="true">-</span>
            )}
          </span>
        </td>
        <td className="p-2 text-xs text-gray-700 align-top">
          <span className="break-words" aria-label={`Accountgezondheid: ${vacancy.priority?.account_health || 'Niet ingesteld'}`}>
            {vacancy.priority?.account_health || (
              <span className="text-gray-400" aria-hidden="true">-</span>
            )}
          </span>
        </td>
        <td className="p-2 align-top">
          <PriorityBadge priority={vacancy.displayPriority} />
        </td>
        {isAdmin && (
          <td className="p-2 align-top">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label={`Bewerk prioriteit voor ${vacancy.job.title}`}
            >
              <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
              Bewerken
            </button>
          </td>
        )}
      </tr>
      {isModalOpen && (
        <PriorityModal
          vacancy={vacancy}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
