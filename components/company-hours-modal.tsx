'use client';

import { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';

interface CompanyHoursModalProps {
  companyId: number;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function CompanyHoursModal({
  companyId,
  companyName,
  isOpen,
  onClose,
  onSave,
}: CompanyHoursModalProps) {
  const [totalHours, setTotalHours] = useState<string>('');
  const [spentHours, setSpentHours] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing hours when modal opens
  useEffect(() => {
    if (isOpen && companyId && companyName) {
      loadHours();
    }
  }, [isOpen, companyId, companyName]);

  const loadHours = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/company-hours?companyId=${companyId}&companyName=${encodeURIComponent(companyName)}`
      );
      if (!response.ok) throw new Error('Failed to load hours');
      
      const data = await response.json();
      if (data.hours) {
        setTotalHours(data.hours.total_hours?.toString() || '0');
        setSpentHours(data.hours.spent_hours?.toString() || '0');
      } else {
        setTotalHours('0');
        setSpentHours('0');
      }
    } catch (err: any) {
      console.error('Error loading hours:', err);
      setError('Fout bij laden van uren');
      setTotalHours('0');
      setSpentHours('0');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    
    const total = parseFloat(totalHours);
    const spent = parseFloat(spentHours);

    if (isNaN(total) || isNaN(spent)) {
      setError('Voer geldige getallen in');
      return;
    }

    if (total < 0 || spent < 0) {
      setError('Uren kunnen niet negatief zijn');
      return;
    }

    if (spent > total) {
      setError('Bestede uren kunnen niet meer zijn dan totaal uren');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/company-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          companyName,
          totalHours: total,
          spentHours: spent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save hours');
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving hours:', err);
      setError(err.message || 'Fout bij opslaan van uren');
    } finally {
      setIsSaving(false);
    }
  };

  const remainingHours = parseFloat(totalHours) - parseFloat(spentHours);
  const isValid = !isNaN(parseFloat(totalHours)) && !isNaN(parseFloat(spentHours)) && 
                  parseFloat(totalHours) >= 0 && parseFloat(spentHours) >= 0 &&
                  parseFloat(spentHours) <= parseFloat(totalHours);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Uren beheren
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {companyName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-500">Laden...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="totalHours" className="block text-sm font-medium text-gray-700 mb-2">
                    Totaal uren
                  </label>
                  <input
                    id="totalHours"
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalHours}
                    onChange={(e) => setTotalHours(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="spentHours" className="block text-sm font-medium text-gray-700 mb-2">
                    Bestede uren
                  </label>
                  <input
                    id="spentHours"
                    type="number"
                    step="0.01"
                    min="0"
                    max={totalHours || undefined}
                    value={spentHours}
                    onChange={(e) => setSpentHours(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                {isValid && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Resterende uren:</span>
                      <span className={`text-lg font-bold ${
                        remainingHours < 0 ? 'text-red-600' : 
                        remainingHours < parseFloat(totalHours) * 0.2 ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>
                        {remainingHours.toFixed(2)}
                      </span>
                    </div>
                    {parseFloat(totalHours) > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              parseFloat(spentHours) / parseFloat(totalHours) > 0.8 ? 'bg-red-500' :
                              parseFloat(spentHours) / parseFloat(totalHours) > 0.5 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (parseFloat(spentHours) / parseFloat(totalHours)) * 100)}%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {((parseFloat(spentHours) / parseFloat(totalHours)) * 100).toFixed(1)}% gebruikt
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSaving}
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || isSaving || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-700 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

