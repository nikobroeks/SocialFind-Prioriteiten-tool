'use client';

import { useQuery } from '@tanstack/react-query';
import { useRecruiteeJobs } from '@/hooks/use-recruitee-jobs';
import { getAllPriorities } from '@/lib/supabase/queries';
import { VacancyWithPriority, CompanyGroup } from '@/types/dashboard';
import { getDisplayPriority } from '@/lib/utils';
import { PriorityBadge } from './priority-badge';
import { VacancyRow } from './vacancy-row';
import { useState } from 'react';
import { getUserRole } from '@/lib/supabase/queries';

export default function Dashboard() {
  const [userRole, setUserRole] = useState<'admin' | 'viewer' | null>(null);

  // Fetch user role
  useQuery({
    queryKey: ['userRole'],
    queryFn: getUserRole,
    onSuccess: setUserRole,
  });

  // Fetch Recruitee jobs
  const { data: jobs = [], isLoading: jobsLoading, error: jobsError } = useRecruiteeJobs({
    status: 'published',
  });

  // Fetch priorities
  const { data: priorities = [], isLoading: prioritiesLoading } = useQuery({
    queryKey: ['priorities'],
    queryFn: getAllPriorities,
  });

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

  // Group by company
  const companyGroups: CompanyGroup[] = Object.values(
    vacanciesWithPriority.reduce((acc, vacancy) => {
      const companyId = vacancy.company.id;
      if (!acc[companyId]) {
        acc[companyId] = {
          company: vacancy.company,
          vacancies: [],
        };
      }
      acc[companyId].vacancies.push(vacancy);
      return acc;
    }, {} as Record<number, CompanyGroup>)
  );

  // Sort companies by name
  companyGroups.sort((a, b) => a.company.name.localeCompare(b.company.name));

  if (jobsLoading || prioritiesLoading) {
    return <div className="text-center py-8">Laden...</div>;
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
    companyGroupsCount: companyGroups.length,
    companyGroups: companyGroups.map(g => ({
      id: g.company.id,
      name: g.company.name,
      vacanciesCount: g.vacancies.length
    }))
  });

  return (
    <div className="space-y-8">
      {companyGroups.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {jobs.length === 0 ? (
            <div>
              <p>Geen vacatures gevonden.</p>
              <p className="text-sm mt-2">Check of de Recruitee API credentials correct zijn ingesteld.</p>
            </div>
          ) : (
            <div>
              <p>Geen bedrijven gevonden in de vacatures.</p>
              <p className="text-sm mt-2">Aantal jobs: {jobs.length}</p>
            </div>
          )}
        </div>
      ) : (
        companyGroups.map((group) => (
          <div key={group.company.id} className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">{group.company.name}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Vacature</th>
                    <th className="text-left p-2">Strategie</th>
                    <th className="text-left p-2">Hiring</th>
                    <th className="text-left p-2">Pijn</th>
                    <th className="text-left p-2">Prioriteit</th>
                    {userRole === 'admin' && (
                      <th className="text-left p-2">Acties</th>
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
        ))
      )}
    </div>
  );
}

