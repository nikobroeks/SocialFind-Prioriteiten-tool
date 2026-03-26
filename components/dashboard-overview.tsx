'use client';

import { CompanyGroup, VacancyWithPriority } from '@/types/dashboard';
import { PriorityBadge } from './priority-badge';
import { Building2, Briefcase, AlertTriangle, Users, TrendingUp, Search, Clock } from 'lucide-react';
import { useState } from 'react';
import { PriorityModal } from './priority-modal';

interface CompanyHoursEntry {
  recruitee_company_id: number;
  company_name: string;
  spent_hours: number;
  total_hours: number;
}

interface DashboardOverviewProps {
  companyGroups: CompanyGroup[];
  vacancies: VacancyWithPriority[];
  companyHires?: Record<string, number>;
  applicantsPerVacancy?: Record<string, number>;
  newApplicantsPerVacancy?: Record<string, number>;
  companyHoursData?: CompanyHoursEntry[];
  previousWeekHoursData?: CompanyHoursEntry[];
  searchQuery?: string;
  isAdmin: boolean;
}

const PRIORITY_ORDER = { Red: 3, Orange: 2, Green: 1 } as const;

export function DashboardOverview({
  companyGroups,
  vacancies,
  companyHires = {},
  applicantsPerVacancy = {},
  newApplicantsPerVacancy = {},
  companyHoursData = [],
  previousWeekHoursData = [],
  searchQuery = '',
  isAdmin,
}: DashboardOverviewProps) {
  const getHours = (companyId: number, companyName: string) =>
    companyHoursData.find(
      h => h.recruitee_company_id === companyId && h.company_name === companyName
    );

  const getPrevHours = (companyId: number, companyName: string) =>
    previousWeekHoursData.find(
      h => h.recruitee_company_id === companyId && h.company_name === companyName
    );
  const [selectedVacancy, setSelectedVacancy] = useState<VacancyWithPriority | null>(null);

  // Tally counts per prioriteit
  const redCompanies = companyGroups.filter(g => g.companyPriority === 'Red');
  const orangeCompanies = companyGroups.filter(g => g.companyPriority === 'Orange');
  const greenCompanies = companyGroups.filter(g => g.companyPriority === 'Green');

  const redVacancies = vacancies.filter(v => v.displayPriority === 'Red');
  const orangeVacancies = vacancies.filter(v => v.displayPriority === 'Orange');
  const greenVacancies = vacancies.filter(v => v.displayPriority === 'Green');

  // Top 10 meest urgente vacatures (Red eerst, dan Orange)
  const topVacancies = [...vacancies]
    .sort((a, b) => PRIORITY_ORDER[b.displayPriority] - PRIORITY_ORDER[a.displayPriority])
    .slice(0, 10);

  // Alle bedrijven gesorteerd: Red > Orange > Green
  const sortedCompanies = [...companyGroups].sort(
    (a, b) =>
      PRIORITY_ORDER[b.companyPriority ?? 'Green'] -
      PRIORITY_ORDER[a.companyPriority ?? 'Green']
  );

  // Bedrijven met hoge prio (Red of Orange)
  const urgentCompanies = sortedCompanies.filter(
    g => g.companyPriority === 'Red' || g.companyPriority === 'Orange'
  );

  if (companyGroups.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {searchQuery ? 'Geen resultaten gevonden' : 'Geen bedrijven beschikbaar'}
        </p>
        <p className="text-sm text-gray-500">
          {searchQuery
            ? `Geen bedrijven of vacatures gevonden voor "${searchQuery}"`
            : 'Er zijn momenteel geen bedrijven om weer te geven.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* KPI-samenvatting */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Bedrijven" value={companyGroups.length} icon={<Building2 className="h-4 w-4" />} color="gray" />
          <StatCard label="Vacatures" value={vacancies.length} icon={<Briefcase className="h-4 w-4" />} color="gray" />
          <StatCard label="Hoog bedrijven" value={redCompanies.length} icon={<AlertTriangle className="h-4 w-4" />} color="red" />
          <StatCard label="Medium bedrijven" value={orangeCompanies.length} icon={<AlertTriangle className="h-4 w-4" />} color="orange" />
          <StatCard label="Hoog vacatures" value={redVacancies.length} icon={<TrendingUp className="h-4 w-4" />} color="red" />
          <StatCard label="Medium vacatures" value={orangeVacancies.length} icon={<TrendingUp className="h-4 w-4" />} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Linkerkolom: Urgente bedrijven */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                Bedrijven op prioriteit
              </h2>
              <span className="ml-auto text-xs text-gray-500">{sortedCompanies.length} totaal</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
              {sortedCompanies.map((group, i) => {
                const hiresCount = getCompanyHires(companyHires, group.company.name);
                const vacancyCount = group.vacancies.length;
                const hours = getHours(group.company.id, group.company.name);
                const prevHours = getPrevHours(group.company.id, group.company.name);
                const hasHours = hours && hours.total_hours > 0;
                const hasPrevHours = prevHours && prevHours.total_hours > 0;
                const pct = hasHours
                  ? Math.min(100, (hours.spent_hours / hours.total_hours) * 100)
                  : 0;
                return (
                  <div
                    key={`ov-company-${i}-${group.company.id}`}
                    className="px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                        group.companyPriority === 'Red'
                          ? 'bg-red-400'
                          : group.companyPriority === 'Orange'
                          ? 'bg-orange-400'
                          : 'bg-green-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate block">
                        {group.company.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-gray-500">
                          {vacancyCount} vacature{vacancyCount !== 1 ? 's' : ''}
                        </span>
                        {group.recruiter && (
                          <span className="text-[11px] text-blue-600">{group.recruiter}</span>
                        )}
                        {group.buddy && (
                          <span className="text-[11px] text-purple-600">{group.buddy}</span>
                        )}
                        {hiresCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-green-700 font-medium">
                            <Users className="h-3 w-3" />
                            {hiresCount} hires
                          </span>
                        )}
                      </div>
                      {/* Uren progressie */}
                      {(hasHours || hasPrevHours) && (
                        <div className="mt-1.5 space-y-1">
                          {hasHours ? (
                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="flex items-center gap-1 text-[11px] text-gray-600">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  Deze week: {hours.spent_hours.toFixed(1)} / {hours.total_hours.toFixed(1)}u
                                </span>
                                <span className={`text-[11px] font-semibold ${
                                  pct > 80 ? 'text-red-600' : pct > 50 ? 'text-orange-600' : 'text-green-600'
                                }`}>
                                  {pct.toFixed(0)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-orange-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>Deze week: Geen data</span>
                            </div>
                          )}
                          {hasPrevHours && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>
                                Vorige week: {prevHours.spent_hours.toFixed(1)} / {prevHours.total_hours.toFixed(1)}u
                                {' '}({((prevHours.spent_hours / prevHours.total_hours) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <PriorityBadge priority={group.companyPriority ?? 'Green'} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rechterkolom: Top urgente vacatures */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                Vacatures op prioriteit
              </h2>
              <span className="ml-auto text-xs text-gray-500">{vacancies.length} totaal</span>
            </div>
            <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
              {topVacancies.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-gray-400">
                  Geen vacatures beschikbaar
                </div>
              ) : (
                topVacancies.map((vacancy) => {
                  const newApplicantCount =
                    newApplicantsPerVacancy[vacancy.job.id.toString()] || 0;
                  const totalApplicantCount =
                    applicantsPerVacancy[vacancy.job.id.toString()] || 0;
                  return (
                    <div
                      key={vacancy.job.id}
                      className="px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                          vacancy.displayPriority === 'Red'
                            ? 'bg-red-400'
                            : vacancy.displayPriority === 'Orange'
                            ? 'bg-orange-400'
                            : 'bg-green-400'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">
                          {vacancy.job.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-gray-500 truncate">
                            {vacancy.company.name}
                          </span>
                          {(newApplicantCount > 0 || totalApplicantCount > 0) && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[11px] text-blue-600 font-medium"
                              title={`${totalApplicantCount} totaal gesolliciteerd`}
                            >
                              <Users className="h-3 w-3" />
                              {newApplicantCount} nieuw
                            </span>
                          )}
                          {vacancy.priority?.client_pain_level && (
                            <span className="text-[11px] text-gray-400">
                              Pijn: {vacancy.priority.client_pain_level}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <PriorityBadge priority={vacancy.displayPriority} />
                        {isAdmin && (
                          <button
                            onClick={() => setSelectedVacancy(vacancy)}
                            className="text-[11px] text-orange-600 hover:text-orange-800 hover:underline"
                          >
                            Bewerk
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {vacancies.length > 10 && (
                <div className="px-4 py-2 text-center text-[11px] text-gray-400 border-t border-gray-100">
                  + {vacancies.length - 10} meer vacatures — bekijk via Compact of Tabel view
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Onderste rij: Rode en oranje bedrijven snel overzicht (als er genoeg zijn) */}
        {urgentCompanies.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h2 className="text-sm font-semibold text-gray-900">Actie vereist</h2>
              <span className="text-xs text-gray-500 ml-1">
                — bedrijven met Hoog of Medium prioriteit
              </span>
            </div>
            <div className="px-4 py-3 flex flex-wrap gap-2">
              {urgentCompanies.map((group, i) => (
                <div
                  key={`urgent-${i}-${group.company.id}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
                    group.companyPriority === 'Red'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-orange-50 border-orange-200 text-orange-800'
                  }`}
                >
                  <span>{group.company.name}</span>
                  <span className="opacity-60">
                    {group.vacancies.length}v
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedVacancy && (
        <PriorityModal
          vacancy={selectedVacancy}
          isOpen={true}
          onClose={() => setSelectedVacancy(null)}
        />
      )}
    </>
  );
}

// Helper: fuzzy hires lookup (zelfde logica als elders in de app)
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCompanyHires(companyHires: Record<string, number>, companyName: string): number {
  if (companyHires[companyName] !== undefined) return companyHires[companyName];
  const normalized = normalizeCompanyName(companyName);
  for (const [key, count] of Object.entries(companyHires)) {
    if (normalizeCompanyName(key) === normalized) return count;
  }
  for (const [key, count] of Object.entries(companyHires)) {
    const normKey = normalizeCompanyName(key);
    if (normalized.includes(normKey) || normKey.includes(normalized)) return count;
  }
  return 0;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'gray' | 'red' | 'orange' | 'green';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorStyles = {
    gray: 'bg-white border-gray-200 text-gray-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    green: 'bg-green-50 border-green-200 text-green-700',
  };

  return (
    <div className={`rounded-lg border px-3 py-2.5 flex items-center gap-2.5 shadow-sm ${colorStyles[color]}`}>
      <div className="opacity-70">{icon}</div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-[11px] leading-tight mt-0.5 opacity-75 truncate">{label}</p>
      </div>
    </div>
  );
}
