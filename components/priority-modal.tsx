'use client';

import { useState, useEffect } from 'react';
import { VacancyWithPriority } from '@/types/dashboard';
import { PriorityFormData } from '@/types/dashboard';
import { upsertPriority } from '@/lib/supabase/queries';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { PriorityBadge } from './priority-badge';
import { calculatePriority, getDisplayPriority } from '@/lib/utils';

interface PriorityModalProps {
  vacancy: VacancyWithPriority;
  isOpen: boolean;
  onClose: () => void;
}

export function PriorityModal({ vacancy, isOpen, onClose }: PriorityModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<PriorityFormData>({
    strategy_score: vacancy.priority?.strategy_score || null,
    hiring_chance: vacancy.priority?.hiring_chance || null,
    client_pain: vacancy.priority?.client_pain || false,
    manual_override: vacancy.priority?.manual_override || null,
    notes: vacancy.priority?.notes || null,
  });
  const [saving, setSaving] = useState(false);

  const calculatedPriority = calculatePriority(
    formData.strategy_score,
    formData.hiring_chance,
    formData.client_pain
  );

  const displayPriority = getDisplayPriority(
    calculatedPriority,
    formData.manual_override
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await upsertPriority(
        vacancy.job.id,
        vacancy.company.id,
        formData
      );
      await queryClient.invalidateQueries({ queryKey: ['priorities'] });
      onClose();
    } catch (error) {
      console.error('Error saving priority:', error);
      alert('Er is een fout opgetreden bij het opslaan');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{vacancy.job.title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Strategie Score */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Strategie Score
            </label>
            <select
              value={formData.strategy_score || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  strategy_score: e.target.value as any || null,
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Selecteer...</option>
              <option value="Key Account">Key Account</option>
              <option value="Longterm">Longterm</option>
              <option value="Ad-hoc">Ad-hoc</option>
            </select>
          </div>

          {/* Hiring Chance */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Hiring Chance
            </label>
            <select
              value={formData.hiring_chance || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hiring_chance: e.target.value as any || null,
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Selecteer...</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Client Pain */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.client_pain}
                onChange={(e) =>
                  setFormData({ ...formData, client_pain: e.target.checked })
                }
                className="rounded border-input"
              />
              <span className="text-sm font-medium">Client Pain (Onrust/Escalatie)</span>
            </label>
          </div>

          {/* Calculated Priority Preview */}
          <div className="p-4 bg-muted rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Berekende Prioriteit:</span>
              <PriorityBadge priority={calculatedPriority} />
            </div>
          </div>

          {/* Manual Override */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Handmatige Override (optioneel)
            </label>
            <select
              value={formData.manual_override || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  manual_override: e.target.value as any || null,
                })
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="">Geen override</option>
              <option value="Red">Red</option>
              <option value="Orange">Orange</option>
              <option value="Green">Green</option>
            </select>
          </div>

          {/* Final Display Priority */}
          <div className="p-4 bg-primary/10 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Weergave Prioriteit:</span>
              <PriorityBadge priority={displayPriority} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Notities
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value || null })
              }
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="Optionele notities..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md border border-input hover:bg-muted"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

