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
import { useState, useEffect, useCallback } from 'react';
import { getUserRole } from '@/lib/supabase/queries';
import { Building2, TrendingUp, AlertCircle, Users, EyeOff, Search, Settings, Clock, Edit2 } from 'lucide-react';
import { CompanyVisibilityToggle } from './company-visibility-toggle';
import { CompanyVisibilityModal } from './company-visibility-modal';
import { CompanyHoursModal } from './company-hours-modal';
import { SearchBar } from './search-bar';
import { ExportButton } from './export-button';
import { DashboardAnalytics } from './dashboard-analytics';
import { useNotifications } from '@/contexts/notifications-context';

export default function Dashboard() {
  const [userRole, setUserRole] = useState<'admin' | 'viewer' | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompanyVisibilityModalOpen, setIsCompanyVisibilityModalOpen] = useState(false);
  const [companyHoursModal, setCompanyHoursModal] = useState<{ companyId: number; companyName: string } | null>(null);
  const { addNotification } = useNotifications();

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

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
  const { data: companyHiresData, isLoading: companyHiresLoading } = useQuery({
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

  // Fetch applicants per vacancy - heavily cached
  const { data: vacancyApplicantsData, isLoading: vacancyApplicantsLoading } = useQuery({
    queryKey: ['vacancy-applicants'],
    queryFn: async () => {
      const response = await fetch('/api/recruitee/vacancy-applicants');
      if (!response.ok) throw new Error('Failed to fetch vacancy applicants');
      return response.json();
    },
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 60 * 60 * 1000, // 1 hour cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 1,
  });

  // Fetch job visibility settings
  const { data: visibilityData, isLoading: visibilityLoading } = useQuery({
    queryKey: ['job-visibility'],
    queryFn: async () => {
      const response = await fetch('/api/job-visibility');
      if (!response.ok) throw new Error('Failed to fetch job visibility');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch company visibility settings
  const { data: companyVisibilityData, isLoading: companyVisibilityLoading } = useQuery({
    queryKey: ['company-visibility'],
    queryFn: async () => {
      const response = await fetch('/api/company-visibility');
      if (!response.ok) throw new Error('Failed to fetch company visibility');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const visibility = visibilityData?.visibility || [];
  const companyVisibility = companyVisibilityData?.visibility || [];

  // Fetch company hours
  const { data: companyHoursData, isLoading: companyHoursLoading, refetch: refetchCompanyHours } = useQuery({
    queryKey: ['company-hours'],
    queryFn: async () => {
      const response = await fetch('/api/company-hours');
      if (!response.ok) throw new Error('Failed to fetch company hours');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const companyHires = companyHiresData?.companyHires || {};
  const applicantsPerVacancy = vacancyApplicantsData?.applicantsPerVacancy || {};
  const companyHours = companyHoursData?.hours || [];
  
  // Helper function to normalize company names for matching
  const normalizeCompanyName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\./g, '')
      .replace(/,/g, '')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  // Create a lookup map with normalized keys for better matching
  const companyHiresMap = new Map<string, number>();
  Object.entries(companyHires).forEach(([name, count]) => {
    const normalized = normalizeCompanyName(name);
    // Store both original and normalized for lookup
    companyHiresMap.set(normalized, count as number);
    companyHiresMap.set(name, count as number); // Also keep original for exact match
  });
  
  // Helper function to get company hours
  const getCompanyHours = (companyId: number, companyName: string) => {
    return companyHours.find(
      (h: any) => h.recruitee_company_id === companyId && h.company_name === companyName
    );
  };

  // Helper to find hires count for a company (with fuzzy matching)
  const getCompanyHires = (companyName: string): number => {
    const normalized = normalizeCompanyName(companyName);
    // Try exact match first
    if (companyHiresMap.has(companyName)) {
      return companyHiresMap.get(companyName) || 0;
    }
    // Try normalized match
    if (companyHiresMap.has(normalized)) {
      return companyHiresMap.get(normalized) || 0;
    }
    // Try partial match (check if any key contains the company name or vice versa)
    for (const [key, count] of companyHiresMap.entries()) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return count;
      }
    }
    return 0;
  };
  
  // Debug logging will be done after companyGroupsWithPriority is created

  // Filter jobs based on visibility settings
  // Jobs are visible by default unless explicitly hidden
  const visibleJobs = jobs.filter((job) => {
    const jobVisibility = visibility.find(
      (v: any) => v.recruitee_job_id === job.id && v.recruitee_company_id === job.company_id
    );
    // If no visibility setting exists, job is visible by default
    // If setting exists, use the is_visible value
    return jobVisibility ? jobVisibility.is_visible : true;
  });

  // Group ALL jobs by company (including hidden ones) for visibility toggle
  // This ensures we can restore hidden jobs
  const allJobsByCompany = jobs.reduce((acc, job) => {
    // Extract company data
    let company = job.company;
    if (!company && job.company_id) {
      const companyName = (job as any).company_name || 
                         (job as any).company?.name || 
                         `Company ${job.company_id}`;
      company = {
        id: job.company_id,
        name: companyName,
      };
    }
    if (!company) {
      company = {
        id: job.company_id || 0,
        name: 'Unknown Company',
      };
    }

    const companyKey = (job as any).company_string_id || company.id.toString();
    
    if (!acc[companyKey]) {
      acc[companyKey] = {
        company,
        allJobIds: [],
      };
    }
    acc[companyKey].allJobIds.push(job.id);
    return acc;
  }, {} as Record<string, { company: any; allJobIds: number[] }>);

  // Combine jobs with priorities (only visible jobs for display)
  const vacanciesWithPriority: VacancyWithPriority[] = visibleJobs.map((job) => {
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

  // Group ALL companies first (including those with no visible jobs)
  // This ensures companies are always visible even if all their jobs are hidden
  const allCompaniesMap = jobs.reduce((acc, job) => {
    // Extract company data
    let company = job.company;
    if (!company && job.company_id) {
      const companyName = (job as any).company_name || 
                         (job as any).company?.name || 
                         `Company ${job.company_id}`;
      company = {
        id: job.company_id,
        name: companyName,
      };
    }
    if (!company) {
      company = {
        id: job.company_id || 0,
        name: 'Unknown Company',
      };
    }

    const companyKey = (job as any).company_string_id || company.id.toString();
    
    if (!acc[companyKey]) {
      acc[companyKey] = {
        company,
        vacancies: [],
      };
    }
    return acc;
  }, {} as Record<string, CompanyGroup>);

  // Now add visible vacancies to their companies
  vacanciesWithPriority.forEach((vacancy) => {
    const companyKey = (vacancy.job as any).company_string_id || 
                      vacancy.company.id.toString();
    
    if (allCompaniesMap[companyKey]) {
      allCompaniesMap[companyKey].vacancies.push(vacancy);
    }
  });

  // Convert to array - ALL companies are included, even if they have no visible vacancies
  const companyGroups: CompanyGroup[] = Object.values(allCompaniesMap);

  // Helper to check if company is visible
  const isCompanyVisible = (companyId: number, companyName: string): boolean => {
    const companyVis = companyVisibility.find(
      (v: any) => v.recruitee_company_id === companyId && v.company_name === companyName
    );
    // Default to visible if no setting exists
    return companyVis ? companyVis.is_visible : true;
  };

  // Filter companies based on visibility
  const visibleCompanyGroups = companyGroups.filter(group => 
    isCompanyVisible(group.company.id, group.company.name)
  );

  // Bereken company priority: hoogste priority van alle vacatures binnen dat bedrijf
  const companyGroupsWithPriority = visibleCompanyGroups.map(group => {
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

  // Filter op zoekquery
  const filteredCompanyGroups = searchQuery.trim()
    ? companyGroupsWithPriority.filter((group) => {
        const query = searchQuery.toLowerCase().trim();
        // Zoek in bedrijfsnaam
        const companyMatch = group.company.name.toLowerCase().includes(query);
        // Zoek in vacaturetitels
        const vacancyMatch = group.vacancies.some((vacancy) =>
          vacancy.job.title.toLowerCase().includes(query)
        );
        return companyMatch || vacancyMatch;
      }).map((group) => {
        // Als er een zoekquery is, filter ook de vacatures binnen het bedrijf
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          return {
            ...group,
            vacancies: group.vacancies.filter((vacancy) =>
              vacancy.job.title.toLowerCase().includes(query) ||
              group.company.name.toLowerCase().includes(query)
            ),
          };
        }
        return group;
      })
    : companyGroupsWithPriority;

  // Filter vacancies based on company visibility
  const vacanciesWithCompanyVisibility = vacanciesWithPriority.filter(vacancy => 
    isCompanyVisible(vacancy.company.id, vacancy.company.name)
  );

  // Filter vacatures voor kanban view
  const filteredVacancies = searchQuery.trim()
    ? vacanciesWithCompanyVisibility.filter((vacancy) => {
        const query = searchQuery.toLowerCase().trim();
        return (
          vacancy.job.title.toLowerCase().includes(query) ||
          vacancy.company.name.toLowerCase().includes(query)
        );
      })
    : vacanciesWithCompanyVisibility;

  const isLoading = jobsLoading || prioritiesLoading || companyHiresLoading || visibilityLoading || vacancyApplicantsLoading || companyVisibilityLoading || companyHoursLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader totalCompanies={0} totalVacancies={0} userRole={userRole} />
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600 font-medium">Gegevens laden...</p>
            <p className="text-sm text-gray-500 mt-2">Even geduld alstublieft</p>
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
      vacanciesCount: g.vacancies.length,
      hires: getCompanyHires(g.company.name),
    })),
    companyHiresData: companyHiresData ? {
      totalHires: companyHiresData.totalHires,
      companyCount: Object.keys(companyHires).length,
      sampleCompanies: Object.entries(companyHires).slice(0, 5),
    } : null,
  });

  // Calculate totals
  const totalVacancies = jobs.length;
  const totalCompanies = companyGroupsWithPriority.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader totalCompanies={totalCompanies} totalVacancies={totalVacancies} userRole={userRole} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Analytics */}
        <div className="mb-6">
          <DashboardAnalytics
            companyGroups={filteredCompanyGroups}
            vacancies={filteredVacancies}
            companyHires={companyHires}
          />
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col gap-4 mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Vacatures Overzicht</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <SearchBar onSearch={handleSearch} />
            </div>
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              {userRole === 'admin' && (
                <button
                  onClick={() => setIsCompanyVisibilityModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors border bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  title="Bedrijf zichtbaarheid beheren"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Bedrijf zichtbaarheid</span>
                </button>
              )}
              <ExportButton
                vacancies={filteredVacancies}
                companyGroups={filteredCompanyGroups}
                variant="icon"
              />
              <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
        </div>

        {/* Company Groups */}
        <div className="space-y-6">
          {filteredCompanyGroups.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              {jobs.length === 0 ? (
                <div>
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Geen vacatures gevonden</p>
                  <p className="text-sm text-gray-500 mb-4">Er zijn momenteel geen vacatures beschikbaar.</p>
                  <p className="text-xs text-gray-400">Check of de Recruitee API credentials correct zijn ingesteld.</p>
                </div>
              ) : searchQuery.trim() ? (
                <div>
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Geen resultaten gevonden</p>
                  <p className="text-sm text-gray-500 mb-2">
                    Geen bedrijven of vacatures gevonden voor "{searchQuery}"
                  </p>
                  <p className="text-xs text-gray-400">Probeer een andere zoekterm</p>
                </div>
              ) : (
                <div>
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">Geen bedrijven gevonden</p>
                  <p className="text-sm text-gray-500 mb-2">Geen bedrijven gevonden in de vacatures.</p>
                  <p className="text-xs text-gray-400">Aantal jobs: {jobs.length}</p>
                </div>
              )}
            </div>
          ) : viewMode === 'kanban' ? (
            // Kanban View - All vacancies grouped by priority
            <KanbanView 
              vacancies={filteredVacancies} 
              isAdmin={userRole === 'admin'}
              searchQuery={searchQuery}
              applicantsPerVacancy={applicantsPerVacancy}
            />
          ) : viewMode === 'compact' ? (
            // Compact View - Company groups in compact format
            <CompactView 
              companyGroups={filteredCompanyGroups} 
              isAdmin={userRole === 'admin'}
              companyHires={companyHires}
              searchQuery={searchQuery}
              applicantsPerVacancy={applicantsPerVacancy}
            />
          ) : (
            // Table View - Original table view per company
            filteredCompanyGroups.map((group, index) => {
          const priorityBorderColor = {
            Red: 'border-l-red-500',
            Orange: 'border-l-orange-500',
            Green: 'border-l-green-500',
          }[group.companyPriority || 'Green'];

          return (
            <div 
              key={`company-group-${index}-${group.company.id}`} 
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
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{group.company.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-500">
                            {group.vacancies.length > 0 
                              ? `${group.vacancies.length} vacature${group.vacancies.length !== 1 ? 's' : ''}`
                              : 'Geen zichtbare vacatures'
                            }
                          </p>
                          {(() => {
                            const hiresCount = getCompanyHires(group.company.name);
                            return hiresCount > 0 && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full">
                                <Users className="h-3 w-3 text-green-600" />
                                <span className="text-xs font-semibold text-green-700">{hiresCount}</span>
                                <span className="text-xs text-green-600">hires (90d)</span>
                              </div>
                            );
                          })()}
                        </div>
                        {(() => {
                          const hours = getCompanyHours(group.company.id, group.company.name);
                          if (hours && hours.total_hours > 0) {
                            const remaining = hours.total_hours - hours.spent_hours;
                            const percentage = (hours.spent_hours / hours.total_hours) * 100;
                            const progressColor = percentage > 80 ? 'bg-red-500' : 
                                                  percentage > 50 ? 'bg-orange-500' : 
                                                  'bg-green-500';
                            const textColor = percentage > 80 ? 'text-red-600' : 
                                              percentage > 50 ? 'text-orange-600' : 
                                              'text-green-600';
                            
                            return (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-xs text-gray-600 font-medium">
                                      {hours.spent_hours.toFixed(1)} / {hours.total_hours.toFixed(1)} uren
                                    </span>
                                  </div>
                                  <span className={`text-xs font-semibold ${textColor}`}>
                                    {percentage.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-1">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ease-out ${progressColor}`}
                                    style={{ width: `${Math.min(100, percentage)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400">
                                  {remaining.toFixed(1)}u resterend
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {userRole === 'admin' && (() => {
                      // Determine the company key for this group
                      // First try to get it from visible vacancies, then from all jobs
                      let companyKey: string | null = null;
                      
                      if (group.vacancies.length > 0) {
                        companyKey = (group.vacancies[0]?.job as any)?.company_string_id || null;
                      }
                      
                      // If no company key found, try to find it from all jobs matching this company
                      if (!companyKey) {
                        const matchingJob = jobs.find((job) => {
                          const jobCompanyName = job.company?.name || (job as any).company_name || '';
                          const jobCompanyId = job.company_id;
                          return jobCompanyName === group.company.name || 
                                 jobCompanyId === group.company.id;
                        });
                        if (matchingJob) {
                          companyKey = (matchingJob as any).company_string_id || matchingJob.company_id.toString();
                        }
                      }
                      
                      // Fallback to company ID if still no key found
                      if (!companyKey) {
                        companyKey = group.company.id.toString();
                      }
                      
                      // Get ALL job objects for this SPECIFIC company only (including hidden ones)
                      // IMPORTANT: Use the original 'jobs' array which contains ALL jobs, not just visible ones
                      // The 'visibleJobs' array is filtered and should NOT be used here
                      const allCompanyJobs = jobs.filter((job) => {
                        const jobCompanyKey = (job as any).company_string_id || job.company_id.toString();
                        const jobCompanyName = job.company?.name || (job as any).company_name || '';
                        const jobCompanyId = job.company_id;
                        
                        // Strict matching: must match company key OR (company name AND company ID)
                        const matchesByKey = jobCompanyKey === companyKey;
                        const matchesByNameAndId = jobCompanyName === group.company.name && 
                                                 jobCompanyId === group.company.id;
                        
                        return matchesByKey || matchesByNameAndId;
                      });
                      
                      // Debug log (can be removed later)
                      if (allCompanyJobs.length === 0) {
                        console.warn(`[VISIBILITY] No jobs found for company: ${group.company.name} (ID: ${group.company.id}, Key: ${companyKey})`);
                      } else {
                        // Log to verify we're getting all jobs including hidden ones
                        const visibleCount = allCompanyJobs.filter(job => {
                          const jobVisibility = visibility.find(
                            (v: any) => v.recruitee_job_id === job.id && v.recruitee_company_id === group.company.id
                          );
                          return jobVisibility ? jobVisibility.is_visible : true;
                        }).length;
                        console.log(`[VISIBILITY] Company ${group.company.name}: ${allCompanyJobs.length} total jobs (${visibleCount} visible, ${allCompanyJobs.length - visibleCount} hidden)`);
                      }
                      
                      return (
                        <CompanyVisibilityToggle
                          companyName={group.company.name}
                          companyId={group.company.id}
                          jobs={allCompanyJobs}
                          isAdmin={userRole === 'admin'}
                        />
                      );
                    })()}
                    {userRole === 'admin' && (
                      <button
                        onClick={() => setCompanyHoursModal({ companyId: group.company.id, companyName: group.company.name })}
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
                        title="Uren beheren"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Uren</span>
                      </button>
                    )}
                    <PriorityBadge priority={group.companyPriority || 'Green'} />
                  </div>
                </div>
              </div>

              {/* Table */}
              <div>
                {group.vacancies.length > 0 ? (
                  <table className="w-full border-collapse table-fixed" role="table" aria-label={`Vacatures voor ${group.company.name}`}>
                    <colgroup>
                      <col className="w-[20%]" />
                      <col className="w-[9%]" />
                      <col className="w-[12%]" />
                      <col className="w-[11%]" />
                      <col className="w-[11%]" />
                      <col className="w-[11%]" />
                      <col className="w-[8%]" />
                      {userRole === 'admin' && <col className="w-[10%]" />}
                    </colgroup>
                    <thead className="hidden sm:table-header-group">
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Vacature</th>
                        <th scope="col" className="text-center p-2 pr-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Sollicitanten</th>
                        <th scope="col" className="text-left p-2 pl-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Klant pijn</th>
                        <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Tijdkritiek</th>
                        <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Strategie</th>
                        <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Account</th>
                        <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Prioriteit</th>
                        {userRole === 'admin' && (
                          <th scope="col" className="text-left p-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">Acties</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {group.vacancies.map((vacancy) => {
                        const applicantCount = applicantsPerVacancy[vacancy.job.id.toString()] || 0;
                        return (
                          <VacancyRow
                            key={vacancy.job.id}
                            vacancy={vacancy}
                            isAdmin={userRole === 'admin'}
                            applicantCount={applicantCount}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-8 text-center">
                    <EyeOff className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Alle vacatures voor dit bedrijf zijn verborgen
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Gebruik de zichtbaarheidsinstellingen om vacatures weer zichtbaar te maken
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })
          )}
        </div>
      </main>

      {/* Company Visibility Modal */}
      <CompanyVisibilityModal
        companies={companyGroups.map(g => g.company)}
        isAdmin={userRole === 'admin'}
        isOpen={isCompanyVisibilityModalOpen}
        onClose={() => setIsCompanyVisibilityModalOpen(false)}
      />

      {/* Company Hours Modal */}
      {companyHoursModal && (
        <CompanyHoursModal
          companyId={companyHoursModal.companyId}
          companyName={companyHoursModal.companyName}
          isOpen={!!companyHoursModal}
          onClose={() => setCompanyHoursModal(null)}
          onSave={() => {
            refetchCompanyHours();
          }}
        />
      )}
    </div>
  );
}

