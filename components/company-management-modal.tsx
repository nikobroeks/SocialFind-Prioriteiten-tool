'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Building2, Check, Search } from 'lucide-react';
import { useNotifications } from '@/contexts/notifications-context';
import { VacancyWithPriority } from '@/types/dashboard';

interface CompanyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  allVacancies: VacancyWithPriority[];
  allCompanies: Array<{ id: number; name: string }>;
  isAdmin: boolean;
}

export function CompanyManagementModal({ 
  isOpen, 
  onClose, 
  allVacancies,
  allCompanies,
  isAdmin 
}: CompanyManagementModalProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const [selectedVacancyIds, setSelectedVacancyIds] = useState<Set<number>>(new Set());
  const [targetCompany, setTargetCompany] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  // Filter vacatures met "Onbekend Bedrijf"
  const unknownVacancies = useMemo(() => {
    return allVacancies.filter(v => v.company.name === 'Onbekend Bedrijf');
  }, [allVacancies]);

  // Filter bedrijven op basis van zoekquery en verwijder duplicaten
  const filteredCompanies = useMemo(() => {
    let companies = [];
    
    if (!searchQuery.trim()) {
      companies = allCompanies.filter(c => 
        c.name !== 'Onbekend Bedrijf' && 
        c.name !== 'Overig'
      );
    } else {
      companies = allCompanies.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        c.name !== 'Onbekend Bedrijf' && 
        c.name !== 'Overig'
      );
    }
    
    // Verwijder duplicaten op basis van ID (houd de eerste)
    const seenIds = new Set<number>();
    return companies.filter(c => {
      if (seenIds.has(c.id)) {
        return false;
      }
      seenIds.add(c.id);
      return true;
    });
  }, [allCompanies, searchQuery]);

  const toggleVacancySelection = (vacancyId: number) => {
    const newSelection = new Set(selectedVacancyIds);
    if (newSelection.has(vacancyId)) {
      newSelection.delete(vacancyId);
    } else {
      newSelection.add(vacancyId);
    }
    setSelectedVacancyIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedVacancyIds.size === unknownVacancies.length) {
      setSelectedVacancyIds(new Set());
    } else {
      setSelectedVacancyIds(new Set(unknownVacancies.map(v => v.job.id)));
    }
  };

  const handleAssignToCompany = async () => {
    if (selectedVacancyIds.size === 0) {
      addNotification({
        type: 'error',
        title: 'Fout',
        message: 'Selecteer minimaal één vacature',
      });
      return;
    }

    if (!targetCompany.trim()) {
      addNotification({
        type: 'error',
        title: 'Fout',
        message: 'Selecteer een bedrijf',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/company-management/assign-vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancyIds: Array.from(selectedVacancyIds),
          companyName: targetCompany.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign vacancies');
      }

      addNotification({
        type: 'success',
        title: 'Succesvol',
        message: `${selectedVacancyIds.size} vacature(s) toegewezen aan "${targetCompany}"`,
      });

      // Refresh data - invalidate all recruiteeJobs queries
      queryClient.invalidateQueries({ 
        queryKey: ['recruiteeJobs'],
        exact: false // Invalidate all queries that start with 'recruiteeJobs'
      });
      
      // Force refetch
      queryClient.refetchQueries({ 
        queryKey: ['recruiteeJobs'],
        exact: false 
      });
      
      // Reset state
      setSelectedVacancyIds(new Set());
      setTargetCompany('');
      setSearchQuery('');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error('Error assigning vacancies:', error);
      addNotification({
        type: 'error',
        title: 'Fout',
        message: error.message || 'Er is een fout opgetreden bij het toewijzen',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bedrijf Beheer</h2>
            <p className="text-sm text-gray-600 mt-1">
              Wijs vacatures met "Onbekend Bedrijf" toe aan een bestaand bedrijf
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Vacatures lijst */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Vacatures met "Onbekend Bedrijf" ({unknownVacancies.length})
              </h3>
              {unknownVacancies.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedVacancyIds.size === unknownVacancies.length ? 'Deselecteer alles' : 'Selecteer alles'}
                </button>
              )}
            </div>

            {unknownVacancies.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Geen vacatures met "Onbekend Bedrijf" gevonden.</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {unknownVacancies.map((vacancy) => {
                    const isSelected = selectedVacancyIds.has(vacancy.job.id);
                    return (
                      <div
                        key={vacancy.job.id}
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => toggleVacancySelection(vacancy.job.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 flex-shrink-0 w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-600' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm break-words">
                              {vacancy.job.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {vacancy.job.id}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bedrijf selectie */}
          {selectedVacancyIds.size > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Wijs toe aan bedrijf ({selectedVacancyIds.size} vacature{selectedVacancyIds.size !== 1 ? 's' : ''} geselecteerd)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zoek of selecteer bedrijf:
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        // Als de gebruiker typt, update ook targetCompany als er een exacte match is
                        const exactMatch = filteredCompanies.find(
                          c => c.name.toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (exactMatch) {
                          setTargetCompany(exactMatch.name);
                        } else if (e.target.value.trim()) {
                          setTargetCompany(e.target.value.trim());
                        }
                      }}
                      placeholder="Zoek bedrijf of voer nieuwe naam in..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {searchQuery && filteredCompanies.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {filteredCompanies.slice(0, 20).map((company, index) => (
                      <button
                        key={`${company.id}-${company.name}-${index}`}
                        onClick={() => {
                          setTargetCompany(company.name);
                          setSearchQuery(company.name);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                          targetCompany === company.name ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{company.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {targetCompany && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Geselecteerd bedrijf:</p>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{targetCompany}</p>
                      </div>
                      <button
                        onClick={handleAssignToCompany}
                        disabled={isUpdating || !targetCompany.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {isUpdating ? 'Toewijzen...' : 'Toewijzen'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedVacancyIds.size > 0 && (
              <span>{selectedVacancyIds.size} vacature{selectedVacancyIds.size !== 1 ? 's' : ''} geselecteerd</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
