'use client';

import { VacancyWithPriority } from '@/types/dashboard';
import { PriorityBadge } from './priority-badge';
import { Edit2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { PriorityModal } from './priority-modal';
import { TalentPoolModal } from './talent-pool-modal';

interface VacancyRowProps {
  vacancy: VacancyWithPriority;
  isAdmin: boolean;
}

export function VacancyRow({ vacancy, isAdmin }: VacancyRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTalentPoolModalOpen, setIsTalentPoolModalOpen] = useState(false);
  const isRedPriority = vacancy.displayPriority === 'Red';

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
            <div className="flex flex-col gap-2">
              {isRedPriority && (
                <button
                  onClick={() => setIsTalentPoolModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded transition-colors border border-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                  aria-label={`Zoek kandidaten voor ${vacancy.job.title}`}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Zoek Kandidaten
                </button>
              )}
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
          <span aria-label={`Klant pijn: ${vacancy.priority?.client_pain_level || 'Niet ingesteld'}`}>
            {vacancy.priority?.client_pain_level || (
              <span className="text-gray-400" aria-hidden="true">-</span>
            )}
          </span>
        </td>
        <td className="p-3 text-xs text-gray-700 whitespace-nowrap">
          <span aria-label={`Tijdkritiek: ${vacancy.priority?.time_criticality || 'Niet ingesteld'}`}>
            {vacancy.priority?.time_criticality || (
              <span className="text-gray-400" aria-hidden="true">-</span>
            )}
          </span>
        </td>
        <td className="p-3 text-xs text-gray-700 whitespace-nowrap">
          <span aria-label={`Strategische waarde: ${vacancy.priority?.strategic_value || 'Niet ingesteld'}`}>
            {vacancy.priority?.strategic_value || (
              <span className="text-gray-400" aria-hidden="true">-</span>
            )}
          </span>
        </td>
        <td className="p-3 text-xs text-gray-700 whitespace-nowrap">
          <span aria-label={`Accountgezondheid: ${vacancy.priority?.account_health || 'Niet ingesteld'}`}>
            {vacancy.priority?.account_health || (
              <span className="text-gray-400" aria-hidden="true">-</span>
            )}
          </span>
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={vacancy.displayPriority} />
            {isRedPriority && (
              <button
                onClick={() => setIsTalentPoolModalOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                aria-label={`Zoek kandidaten voor ${vacancy.job.title}`}
                title="Zoek kandidaten in talent pool"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Zoek
              </button>
            )}
          </div>
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
      {/* Render modals outside table structure using portal */}
      {typeof window !== 'undefined' && isModalOpen && createPortal(
        <PriorityModal
          vacancy={vacancy}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />,
        document.body
      )}
      {typeof window !== 'undefined' && isTalentPoolModalOpen && createPortal(
        <TalentPoolModal
          vacancy={vacancy}
          isOpen={isTalentPoolModalOpen}
          onClose={() => setIsTalentPoolModalOpen(false)}
        />,
        document.body
      )}
    </>
  );
}
