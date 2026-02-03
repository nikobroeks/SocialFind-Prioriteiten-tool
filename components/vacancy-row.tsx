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
      <tr className="border-b hover:bg-muted/50">
        <td className="p-2 font-medium">{vacancy.job.title}</td>
        <td className="p-2">
          {vacancy.priority?.strategy_score || '-'}
        </td>
        <td className="p-2">
          {vacancy.priority?.hiring_chance || '-'}
        </td>
        <td className="p-2">
          {vacancy.priority?.client_pain ? 'Ja' : 'Nee'}
        </td>
        <td className="p-2">
          <PriorityBadge priority={vacancy.displayPriority} />
        </td>
        {isAdmin && (
          <td className="p-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Edit2 className="h-4 w-4" />
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

