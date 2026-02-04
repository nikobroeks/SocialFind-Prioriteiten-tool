'use client';

import { useState, useEffect, useRef } from 'react';
import { VacancyWithPriority } from '@/types/dashboard';
import { PriorityFormData } from '@/types/dashboard';
import { X } from 'lucide-react';
import { PriorityBadge } from './priority-badge';
import { calculatePriority, getDisplayPriority } from '@/lib/utils';
import { usePriorityMutation } from '@/hooks/use-priority-mutation';

interface PriorityModalProps {
  vacancy: VacancyWithPriority;
  isOpen: boolean;
  onClose: () => void;
}

export function PriorityModal({ vacancy, isOpen, onClose }: PriorityModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<PriorityFormData>({
    strategy_score: vacancy.priority?.strategy_score || null,
    hiring_chance: vacancy.priority?.hiring_chance || null,
    client_pain: vacancy.priority?.client_pain || false,
    manual_override: vacancy.priority?.manual_override || null,
    notes: vacancy.priority?.notes || null,
  });

  const mutation = usePriorityMutation({
    jobId: vacancy.job.id,
    companyId: vacancy.company.id,
    onSuccess: () => {
      onClose();
    },
  });

  const calculatedPriority = calculatePriority(
    formData.strategy_score,
    formData.hiring_chance,
    formData.client_pain
  );

  const displayPriority = getDisplayPriority(
    calculatedPriority,
    formData.manual_override
  );

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, select, textarea') as HTMLElement;
      firstInput?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation - ESC to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
          <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-gray-900">
            {vacancy.job.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            aria-label="Sluit dialoog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Strategie Score */}
          <div>
            <label htmlFor="strategy-score" className="block text-sm font-medium mb-2 text-gray-700">
              Strategie Score
            </label>
            <select
              id="strategy-score"
              value={formData.strategy_score || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  strategy_score: e.target.value as any || null,
                })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              aria-required="false"
            >
              <option value="">Selecteer...</option>
              <option value="Key Account">Key Account</option>
              <option value="Longterm">Longterm</option>
              <option value="Ad-hoc">Ad-hoc</option>
            </select>
          </div>

          {/* Hiring Chance */}
          <div>
            <label htmlFor="hiring-chance" className="block text-sm font-medium mb-2 text-gray-700">
              Hiring Chance
            </label>
            <select
              id="hiring-chance"
              value={formData.hiring_chance || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hiring_chance: e.target.value as any || null,
                })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              aria-required="false"
            >
              <option value="">Selecteer...</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Client Pain */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.client_pain}
                onChange={(e) =>
                  setFormData({ ...formData, client_pain: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 focus:ring-2"
                aria-label="Client Pain (Onrust/Escalatie)"
              />
              <span className="text-sm font-medium text-gray-700">Client Pain (Onrust/Escalatie)</span>
            </label>
          </div>

          {/* Calculated Priority Preview */}
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm font-medium text-gray-700">Berekende Prioriteit:</span>
              <PriorityBadge priority={calculatedPriority} />
            </div>
          </div>

          {/* Manual Override */}
          <div>
            <label htmlFor="manual-override" className="block text-sm font-medium mb-2 text-gray-700">
              Handmatige Override (optioneel)
            </label>
            <select
              id="manual-override"
              value={formData.manual_override || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  manual_override: e.target.value as any || null,
                })
              }
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              aria-required="false"
            >
              <option value="">Geen override</option>
              <option value="Red">Red</option>
              <option value="Orange">Orange</option>
              <option value="Green">Green</option>
            </select>
          </div>

          {/* Final Display Priority */}
          <div className="p-4 bg-orange-50 rounded-md border border-orange-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm font-semibold text-gray-900">Weergave Prioriteit:</span>
              <PriorityBadge priority={displayPriority} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2 text-gray-700">
              Notities
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value || null })
              }
              rows={4}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Optionele notities..."
              aria-required="false"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              aria-busy={mutation.isPending}
            >
              {mutation.isPending ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

