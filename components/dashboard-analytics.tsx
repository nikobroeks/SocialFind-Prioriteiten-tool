'use client';

import { CompanyGroup, VacancyWithPriority } from '@/types/dashboard';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { PriorityBadge } from './priority-badge';

interface DashboardAnalyticsProps {
  companyGroups: CompanyGroup[];
  vacancies: VacancyWithPriority[];
  companyHires?: Record<string, number>;
}

export function DashboardAnalytics({ companyGroups, vacancies, companyHires = {} }: DashboardAnalyticsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Bereken statistieken
  const totalVacancies = vacancies.length;
  const totalCompanies = companyGroups.length;
  
  const redVacancies = vacancies.filter((v) => v.displayPriority === 'Red').length;
  const orangeVacancies = vacancies.filter((v) => v.displayPriority === 'Orange').length;
  const greenVacancies = vacancies.filter((v) => v.displayPriority === 'Green').length;

  const redCompanies = companyGroups.filter((g) => g.companyPriority === 'Red').length;
  const orangeCompanies = companyGroups.filter((g) => g.companyPriority === 'Orange').length;
  const greenCompanies = companyGroups.filter((g) => g.companyPriority === 'Green').length;

  // Prioriteit distributie percentages
  const redPercentage = totalVacancies > 0 ? Math.round((redVacancies / totalVacancies) * 100) : 0;
  const orangePercentage = totalVacancies > 0 ? Math.round((orangeVacancies / totalVacancies) * 100) : 0;
  const greenPercentage = totalVacancies > 0 ? Math.round((greenVacancies / totalVacancies) * 100) : 0;

  // Bedrijven met meeste vacatures
  const companiesByVacancyCount = [...companyGroups]
    .sort((a, b) => b.vacancies.length - a.vacancies.length)
    .slice(0, 5);

  // Bedrijven met meeste hires
  const companiesWithHires = companyGroups
    .map((group) => ({
      ...group,
      hires: companyHires[group.company.name] || 0,
    }))
    .filter((group) => group.hires > 0)
    .sort((a, b) => b.hires - a.hires)
    .slice(0, 5);

  // Klant pijn distributie
  const clientPainDistribution = {
    'Ja': vacancies.filter((v) => v.priority?.client_pain_level === 'Ja').length,
    'Beginnend': vacancies.filter((v) => v.priority?.client_pain_level === 'Beginnend').length,
    'Nee': vacancies.filter((v) => v.priority?.client_pain_level === 'Nee').length,
    'Niet ingesteld': vacancies.filter((v) => !v.priority?.client_pain_level).length,
  };

  // Tijdkritiek distributie
  const timeCriticalityDistribution = {
    'Tegen het einde': vacancies.filter((v) => v.priority?.time_criticality === 'Tegen het einde van samenwerking').length,
    'Lopend': vacancies.filter((v) => v.priority?.time_criticality === 'Lopend').length,
    'Net begonnen': vacancies.filter((v) => v.priority?.time_criticality === 'Net begonnen').length,
    'Niet ingesteld': vacancies.filter((v) => !v.priority?.time_criticality).length,
  };

  // Strategische waarde distributie
  const strategicValueDistribution = {
    'A-klant': vacancies.filter((v) => v.priority?.strategic_value === 'A-klant').length,
    'B-klant': vacancies.filter((v) => v.priority?.strategic_value === 'B-klant').length,
    'C-klant': vacancies.filter((v) => v.priority?.strategic_value === 'C-klant').length,
    'Niet ingesteld': vacancies.filter((v) => !v.priority?.strategic_value).length,
  };

  // Accountgezondheid distributie
  const accountHealthDistribution = {
    'Kans op churn': vacancies.filter((v) => v.priority?.account_health === 'Kans op churn').length,
    'Onrustige stakeholder': vacancies.filter((v) => v.priority?.account_health === 'Onrustige stakeholder').length,
    'Tevreden stakeholder': vacancies.filter((v) => v.priority?.account_health === 'Tevreden stakeholder').length,
    'Niet ingesteld': vacancies.filter((v) => !v.priority?.account_health).length,
  };

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6" aria-labelledby="analytics-heading">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-orange-600" aria-hidden="true" />
          <h2 id="analytics-heading" className="text-lg sm:text-xl font-semibold text-gray-900">Dashboard Analytics</h2>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-md px-2 py-1 self-start sm:self-auto"
          aria-expanded={isExpanded}
          aria-controls="analytics-details"
        >
          {isExpanded ? 'Inklappen' : 'Uitklappen'}
        </button>
      </div>

      {/* Basis statistieken - altijd zichtbaar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-300" role="region" aria-label="Hoog prioriteit statistieken">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-700" aria-hidden="true" />
            <span className="text-xs font-medium text-red-700">{redPercentage}%</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-red-700">{redVacancies}</p>
          <p className="text-xs text-red-800 mt-1">Hoog Prioriteit</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-3 sm:p-4 border border-orange-300" role="region" aria-label="Medium prioriteit statistieken">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-700" aria-hidden="true" />
            <span className="text-xs font-medium text-orange-700">{orangePercentage}%</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-orange-700">{orangeVacancies}</p>
          <p className="text-xs text-orange-800 mt-1">Medium Prioriteit</p>
        </div>

        <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-300" role="region" aria-label="Laag prioriteit statistieken">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" aria-hidden="true" />
            <span className="text-xs font-medium text-green-700">{greenPercentage}%</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-700">{greenVacancies}</p>
          <p className="text-xs text-green-800 mt-1">Laag Prioriteit</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-300" role="region" aria-label="Klant pijn statistieken">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" aria-hidden="true" />
            <span className="text-xs font-medium text-blue-700">
              {totalVacancies > 0 ? Math.round((clientPainDistribution['Ja'] / totalVacancies) * 100) : 0}%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-700">{clientPainDistribution['Ja']}</p>
          <p className="text-xs text-blue-800 mt-1">Klant Pijn (Ja)</p>
        </div>
      </div>

      {/* Uitgebreide analytics - alleen zichtbaar wanneer uitgeklapt */}
      {isExpanded && (
        <div id="analytics-details" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-gray-200">
          {/* Prioriteit distributie per bedrijf */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Prioriteit per Bedrijf</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-24 text-gray-600">Hoog (Red):</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${(redCompanies / totalCompanies) * 100}%` }}
                  />
                </div>
                <div className="w-12 text-right font-medium">{redCompanies}</div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-24 text-gray-600">Medium (Orange):</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${(orangeCompanies / totalCompanies) * 100}%` }}
                  />
                </div>
                <div className="w-12 text-right font-medium">{orangeCompanies}</div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-24 text-gray-600">Laag (Green):</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(greenCompanies / totalCompanies) * 100}%` }}
                  />
                </div>
                <div className="w-12 text-right font-medium">{greenCompanies}</div>
              </div>
            </div>
          </div>

          {/* Klant pijn distributie */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Klant Pijn Distributie</h3>
            <div className="space-y-2">
              {Object.entries(clientPainDistribution).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{key}:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${totalVacancies > 0 ? (value / totalVacancies) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tijdkritiek distributie */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tijdkritiek Distributie</h3>
            <div className="space-y-2">
              {Object.entries(timeCriticalityDistribution).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{key}:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${totalVacancies > 0 ? (value / totalVacancies) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategische waarde distributie */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Strategische Waarde Distributie</h3>
            <div className="space-y-2">
              {Object.entries(strategicValueDistribution).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{key}:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${totalVacancies > 0 ? (value / totalVacancies) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accountgezondheid distributie */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Accountgezondheid Distributie</h3>
            <div className="space-y-2">
              {Object.entries(accountHealthDistribution).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{key}:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${totalVacancies > 0 ? (value / totalVacancies) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top bedrijven met meeste vacatures */}
          {companiesByVacancyCount.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Top 5 Bedrijven (Meeste Vacatures)</h3>
              <div className="space-y-2">
                {companiesByVacancyCount.map((group, index) => (
                  <div key={`company-vacancies-${group.company.id}-${group.company.name}-${index}`} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-medium">#{index + 1}</span>
                      <span className="text-gray-900">{group.company.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <PriorityBadge priority={group.companyPriority || 'Green'} />
                      <span className="font-medium text-gray-700">{group.vacancies.length} vacatures</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top bedrijven met meeste hires */}
          {companiesWithHires.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Top 5 Bedrijven (Meeste Hires - 90d)</h3>
              <div className="space-y-2">
                {companiesWithHires.map((group, index) => (
                  <div key={`company-hires-${group.company.id}-${group.company.name}-${index}`} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-medium">#{index + 1}</span>
                      <span className="text-gray-900">{group.company.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <PriorityBadge priority={group.companyPriority || 'Green'} />
                      <span className="font-medium text-green-700">{group.hires} hires</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

