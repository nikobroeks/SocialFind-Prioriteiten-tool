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
      <tr className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors group">
        <td className="p-3 font-medium text-gray-900 truncate text-sm" title={vacancy.job.title}>
          <span className="group-hover:text-orange-600 transition-colors">
            {vacancy.job.title}
          </span>
        </td>
        <td className="p-3 text-xs text-gray-700 whitespace-nowrap">
          {vacancy.priority?.strategy_score || (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="p-3 text-xs text-gray-700 whitespace-nowrap">
          {vacancy.priority?.hiring_chance || (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="p-3 text-xs whitespace-nowrap">
          {vacancy.priority?.client_pain ? (
            <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
              <span className="h-1.5 w-1.5 bg-red-500 rounded-full"></span>
              Ja
            </span>
          ) : (
            <span className="text-gray-400">Nee</span>
          )}
        </td>
        <td className="p-3">
          <PriorityBadge priority={vacancy.displayPriority} />
        </td>
        {isAdmin && (
          <td className="p-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors whitespace-nowrap"
            >
              <Edit2 className="h-3.5 w-3.5" />
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

