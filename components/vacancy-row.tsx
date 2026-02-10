'use client';

import { VacancyWithPriority } from '@/types/dashboard';
import { PriorityBadge } from './priority-badge';
import { Edit2, Users, ChevronDown, Building2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { PriorityModal } from './priority-modal';
import { useNotifications } from '@/contexts/notifications-context';

interface VacancyRowProps {
  vacancy: VacancyWithPriority;
  isAdmin: boolean;
  applicantCount?: number;
  allCompanies?: Array<{ id: number; name: string }>;
  onCompanyAssign?: (jobId: number, companyName: string) => void;
}

export function VacancyRow({ vacancy, isAdmin, applicantCount = 0, allCompanies = [], onCompanyAssign }: VacancyRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssigningCompany, setIsAssigningCompany] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { addNotification } = useNotifications();
  const isUnknownCompany = vacancy.company.name === 'Onbekend Bedrijf';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };

    if (showCompanyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCompanyDropdown]);

  const handleAssignCompany = async () => {
    if (!selectedCompany || !onCompanyAssign) return;
    
    setIsAssigningCompany(true);
    try {
      await onCompanyAssign(vacancy.job.id, selectedCompany);
      addNotification({
        type: 'success',
        title: 'Succesvol',
        message: `Vacature toegewezen aan "${selectedCompany}"`,
      });
      setShowCompanyDropdown(false);
      setSelectedCompany('');
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Fout',
        message: error.message || 'Er is een fout opgetreden',
      });
    } finally {
      setIsAssigningCompany(false);
    }
  };

  const filteredCompanies = allCompanies.filter(c => 
    c.name.toLowerCase().includes(selectedCompany.toLowerCase()) &&
    c.name !== 'Onbekend Bedrijf' &&
    c.name !== 'Overig'
  );

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
                {isAdmin && isUnknownCompany && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Wijs toe aan bedrijf:</div>
                    <div className="relative" ref={dropdownRef}>
                      <input
                        type="text"
                        placeholder="Zoek bedrijf..."
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        onFocus={() => setShowCompanyDropdown(true)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {showCompanyDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {filteredCompanies.slice(0, 10).map((company) => (
                              <button
                                key={company.id}
                                onClick={() => {
                                  setSelectedCompany(company.name);
                                  handleAssignCompany();
                                }}
                                className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors"
                              >
                                {company.name}
                              </button>
                            ))}
                            {selectedCompany && !filteredCompanies.find(c => c.name.toLowerCase() === selectedCompany.toLowerCase()) && (
                              <button
                                onClick={handleAssignCompany}
                                disabled={isAssigningCompany}
                                className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 text-blue-600 rounded transition-colors font-medium"
                              >
                                {isAssigningCompany ? 'Toewijzen...' : `Gebruik "${selectedCompany}"`}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
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
          <div className="flex items-start gap-2">
            <span className="group-hover:text-orange-600 transition-colors break-words flex-1">
              {vacancy.job.title}
            </span>
            {isAdmin && isUnknownCompany && (
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title="Wijs toe aan bedrijf"
                >
                  <Building2 className="h-3 w-3" />
                  <ChevronDown className={`h-3 w-3 transition-transform ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showCompanyDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Zoek bedrijf..."
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="space-y-1">
                        {filteredCompanies.slice(0, 10).map((company) => (
                          <button
                            key={company.id}
                            onClick={() => {
                              setSelectedCompany(company.name);
                              handleAssignCompany();
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded transition-colors"
                          >
                            {company.name}
                          </button>
                        ))}
                        {selectedCompany && !filteredCompanies.find(c => c.name.toLowerCase() === selectedCompany.toLowerCase()) && (
                          <button
                            onClick={handleAssignCompany}
                            disabled={isAssigningCompany}
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 text-blue-600 rounded transition-colors font-medium disabled:opacity-50"
                          >
                            {isAssigningCompany ? 'Toewijzen...' : `Gebruik "${selectedCompany}"`}
                          </button>
                        )}
                        {filteredCompanies.length === 0 && !selectedCompany && (
                          <div className="px-2 py-1.5 text-xs text-gray-500">
                            Geen bedrijven gevonden
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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
