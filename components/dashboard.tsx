'use client';

import { useQuery } from '@tanstack/react-query';
import { useRecruiteeJobs } from '@/hooks/use-recruitee-jobs';
import { getAllPriorities } from '@/lib/supabase/queries';
import { VacancyWithPriority, CompanyGroup } from '@/types/dashboard';
import { getDisplayPriority } from '@/lib/utils';
import { PriorityColor } from '@/types/dashboard';
import { PriorityBadge } from './priority-badge';
import { VacancyRow } from './vacancy-row';
import { DashboardHeader } from './dashboard-header';
import { ViewToggle, ViewMode } from './view-toggle';
import { KanbanView } from './kanban-view';
import { CompactView } from './compact-view';
import { useState, useEffect } from 'react';
import { getUserRole } from '@/lib/supabase/queries';
import { Building2, TrendingUp, AlertCircle, Users } from 'lucide-react';

export default function Dashboard() {
  const [userRole, setUserRole] = useState<'admin' | 'viewer' | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Fetch user role
  const { data: roleData } = useQuery({
    queryKey: ['userRole'],
    queryFn: getUserRole,
  });
  
  // Update userRole state when roleData changes
  useEffect(() => {
    if (roleData) setUserRole(roleData);
  }, [roleData]);

  // Fetch Recruitee jobs
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useRecruiteeJobs({
    status: 'published',
  });

  // Fetch priorities
  const { data: priorities = [], isLoading: prioritiesLoading } = useQuery({
    queryKey: ['priorities'],
    queryFn: getAllPriorities,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 1,
  });

  // Fetch company hires (last 90 days) - heavily cached
  const { data: companyHiresData } = useQuery({
    queryKey: ['company-hires-90d'],
    queryFn: async () => {
      const response = await fetch('/api/recruitee/company-hires?days=90');
      if (!response.ok) throw new Error('Failed to fetch company hires');
      return response.json();
    },
    staleTime: 20 * 60 * 1000, // 20 minutes - hires don't change that often
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 1,
  });

  const companyHires = companyHiresData?.companyHires || {};

  // Combine jobs with priorities
  const vacanciesWithPriority: VacancyWithPriority[] = jobs.map((job) => {
    const priority = priorities.find(
      (p) =>
        p.recruitee_job_id === job.id &&
        p.recruitee_company_id === job.company_id
    ) || null;

    const displayPriority = priority
      ? getDisplayPriority(priority.calculated_priority, priority.manual_override)
      : 'Green'; // Default to Green if no priority set

    // Extract company data - check verschillende mogelijke velden
    let company = job.company;
    
    // Als er geen company object is, probeer het uit andere velden te halen
    if (!company && job.company_id) {
      // Check of er een company_name veld is
      const companyName = (job as any).company_name || 
                         (job as any).company?.name || 
                         `Company ${job.company_id}`;
      
      company = {
        id: job.company_id,
        name: companyName,
      };
    }

    // Fallback als er helemaal geen company data is
    if (!company) {
      company = {
        id: job.company_id || 0,
        name: 'Unknown Company',
      };
    }

    return {
      job,
      company,
      priority,
      displayPriority,
    };
  });

  // Group by company (gebruik company_string_id als die bestaat, anders company.id)
  const companyGroups: CompanyGroup[] = Object.values(
    vacanciesWithPriority.reduce((acc, vacancy) => {
      // Gebruik company_string_id voor groepering (op basis van naam uit titel)
      const companyKey = (vacancy.job as any).company_string_id || 
                        vacancy.company.id.toString();
      
      if (!acc[companyKey]) {
        acc[companyKey] = {
          company: vacancy.company,
          vacancies: [],
        };
      }
      acc[companyKey].vacancies.push(vacancy);
      return acc;
    }, {} as Record<string, CompanyGroup>)
  );

  // Bereken company priority: hoogste priority van alle vacatures binnen dat bedrijf
  const companyGroupsWithPriority = companyGroups.map(group => {
    const priorities = group.vacancies.map(v => {
      const priorityValue = v.displayPriority === 'Red' ? 3 : 
                           v.displayPriority === 'Orange' ? 2 : 1;
      return priorityValue;
    });
    const maxPriority = Math.max(...priorities);
    const companyPriority: PriorityColor = maxPriority === 3 ? 'Red' : 
                                           maxPriority === 2 ? 'Orange' : 'Green';
    
    return {
      ...group,
      companyPriority,
      // Sorteer vacatures binnen het bedrijf op priority (hoogste eerst)
      vacancies: [...group.vacancies].sort((a, b) => {
        const priorityOrder: Record<PriorityColor, number> = { Red: 3, Orange: 2, Green: 1 };
        return priorityOrder[b.displayPriority] - priorityOrder[a.displayPriority];
      }),
    };
  });

  // Sorteer bedrijven op priority (Red > Orange > Green), dan op naam
  companyGroupsWithPriority.sort((a, b) => {
    const priorityOrder: Record<PriorityColor, number> = { Red: 3, Orange: 2, Green: 1 };
    const priorityDiff = priorityOrder[b.companyPriority] - priorityOrder[a.companyPriority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.company.name.localeCompare(b.company.name);
  });

  if (jobsLoading || prioritiesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (jobsError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        <p className="font-semibold mb-2">Fout bij ophalen van vacatures:</p>
        <p className="text-sm">{String(jobsError)}</p>
        <p className="text-sm mt-2">
          <a href="/test-recruitee" className="text-blue-600 hover:underline">
            Test Recruitee API verbinding
          </a>
        </p>
      </div>
    );
  }

  // Debug info (tijdelijk)
  console.log('Dashboard data:', {
    jobsCount: jobs.length,
    prioritiesCount: priorities.length,
    companyGroupsCount: companyGroupsWithPriority.length,
    companyGroups: companyGroupsWithPriority.map(g => ({
      id: g.company.id,
      name: g.company.name,
      priority: g.companyPriority,
      vacanciesCount: g.vacancies.length
    }))
  });

  // Calculate totals
  const totalVacancies = jobs.length;
  const totalCompanies = companyGroupsWithPriority.length;
  const redCompanies = companyGroupsWithPriority.filter(g => g.companyPriority === 'Red').length;
  const orangeCompanies = companyGroupsWithPriority.filter(g => g.companyPriority === 'Orange').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader totalCompanies={totalCompanies} totalVacancies={totalVacancies} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal Bedrijven</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalCompanies}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal Vacatures</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalVacancies}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hoog Prioriteit</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{redCompanies}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medium Prioriteit</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{orangeCompanies}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle - Always visible */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Vacatures Overzicht</h2>
          <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
        </div>

        {/* Company Groups */}
        <div className="space-y-6">
          {companyGroupsWithPriority.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              {jobs.length === 0 ? (
                <div>
                  <p className="text-gray-600">Geen vacatures gevonden.</p>
                  <p className="text-sm mt-2 text-gray-500">Check of de Recruitee API credentials correct zijn ingesteld.</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600">Geen bedrijven gevonden in de vacatures.</p>
                  <p className="text-sm mt-2 text-gray-500">Aantal jobs: {jobs.length}</p>
                </div>
              )}
            </div>
          ) : viewMode === 'kanban' ? (
            // Kanban View - All vacancies grouped by priority
            <KanbanView 
              vacancies={vacanciesWithPriority} 
              isAdmin={userRole === 'admin'} 
            />
          ) : viewMode === 'compact' ? (
            // Compact View - Company groups in compact format
            <CompactView 
              companyGroups={companyGroupsWithPriority} 
              isAdmin={userRole === 'admin'}
              companyHires={companyHires}
            />
          ) : (
            // Table View - Original table view per company
            companyGroupsWithPriority.map((group) => {
          const priorityBorderColor = {
            Red: 'border-l-red-500',
            Orange: 'border-l-orange-500',
            Green: 'border-l-green-500',
          }[group.companyPriority || 'Green'];

          return (
            <div 
              key={group.company.id} 
              className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${priorityBorderColor} overflow-hidden transition-shadow hover:shadow-md`}
            >
              {/* Company Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{group.company.name}</h2>
                      <div className="flex items-center gap-4 mt-0.5">
                        <p className="text-sm text-gray-500">
                          {group.vacancies.length} vacature{group.vacancies.length !== 1 ? 's' : ''}
                        </p>
                        {companyHires[group.company.name] !== undefined && companyHires[group.company.name] > 0 && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full">
                            <Users className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">{companyHires[group.company.name]}</span>
                            <span className="text-xs text-green-600">hires (90d)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <PriorityBadge priority={group.companyPriority || 'Green'} />
                </div>
              </div>

              {/* Table */}
              <div>
                <table className="w-full border-collapse">
                      <colgroup>
                        <col className="w-[35%]" />
                        <col className="w-[12%]" />
                        <col className="w-[10%]" />
                        <col className="w-[8%]" />
                        <col className="w-[12%]" />
                        {userRole === 'admin' && <col className="w-[13%]" />}
                      </colgroup>
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Vacature</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Strategie</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Hiring</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Pijn</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Prioriteit</th>
                          {userRole === 'admin' && (
                            <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Acties</th>
                          )}
                        </tr>
                      </thead>
                <tbody>
                  {group.vacancies.map((vacancy) => (
                    <VacancyRow
                      key={vacancy.job.id}
                      vacancy={vacancy}
                      isAdmin={userRole === 'admin'}
                    />
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          );
        })
          )}
        </div>
      </main>
    </div>
  );
}

