'use client';

import { VacancyWithPriority } from '@/types/dashboard';
import { PriorityBadge } from './priority-badge';
import { Edit2 } from 'lucide-react';
import { useState } from 'react';
import { PriorityModal } from './priority-modal';

interface VacancyRowProps {
  vacancy: VacancyWithPriority;
  isAdmin: boolean;
}

export function VacancyRow({ vacancy, isAdmin }: VacancyRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Mobile card view */}
      <tr className="sm:hidden border-b border-gray-200 hover:bg-orange-50/50 transition-colors">
        <td colSpan={isAdmin ? 6 : 5} className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-gray-900 text-sm flex-1">{vacancy.job.title}</h3>
              <PriorityBadge priority={vacancy.displayPriority} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block mb-1">Strategie</span>
                <span className="text-gray-900 font-medium">
                  {vacancy.priority?.strategy_score || <span className="text-gray-400">-</span>}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Hiring</span>
                <span className="text-gray-900 font-medium">
                  {vacancy.priority?.hiring_chance || <span className="text-gray-400">-</span>}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Pijn</span>
                {vacancy.priority?.client_pain ? (
                  <span className="inline-flex items-center gap-1 text-red-700 font-semibold">
                    <span className="h-1.5 w-1.5 bg-red-600 rounded-full" aria-hidden="true"></span>
                    Ja
                  </span>
                ) : (
                  <span className="text-gray-500">Nee</span>
                )}
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
        <td className="p-3 font-medium text-gray-900 truncate text-sm" title={vacancy.job.title}>
          <span className="group-hover:text-orange-600 transition-colors">
            {vacancy.job.title}
          </span>
        </td>
        <td className="p-3 text-xs text-gray-700 whitespace-nowrap">
          <span aria-label={`Strategie score: ${vacancy.priority?.strategy_score || 'Niet ingesteld'}`}>
            {vacancy.priority?.strategy_score || (
              <span className="text-gray-400" aria-hidden="true">-</span>
            )}
          </span>
        </td>
        <td className="p-3 text-xs text-gray-700 whitespace-nowrap">
          <span aria-label={`Hiring chance: ${vacancy.priority?.hiring_chance || 'Niet ingesteld'}`}>
            {vacancy.priority?.hiring_chance || (
              <span className="text-gray-400" aria-hidden="true">-</span>
            )}
          </span>
        </td>
        <td className="p-3 text-xs whitespace-nowrap">
          {vacancy.priority?.client_pain ? (
            <span className="inline-flex items-center gap-1 text-red-700 font-semibold" aria-label="Client pain: Ja">
              <span className="h-1.5 w-1.5 bg-red-600 rounded-full" aria-hidden="true"></span>
              Ja
            </span>
          ) : (
            <span className="text-gray-500" aria-label="Client pain: Nee">Nee</span>
          )}
        </td>
        <td className="p-3">
          <PriorityBadge priority={vacancy.displayPriority} />
        </td>
        {isAdmin && (
          <td className="p-3">
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
