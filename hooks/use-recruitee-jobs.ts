import { useQuery } from '@tanstack/react-query';
import { RecruiteeJob } from '@/types/recruitee';

interface FetchJobsOptions {
  status?: string;
  page?: number;
  perPage?: number;
}

export function useRecruiteeJobs(options: FetchJobsOptions = {}) {
  return useQuery({
    queryKey: ['recruiteeJobs', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.status) params.set('status', options.status);
      if (options.page) params.set('page', options.page.toString());
      if (options.perPage) params.set('per_page', options.perPage.toString());

      const response = await fetch(`/api/recruitee/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      return data.jobs as RecruiteeJob[];
    },
  });
}

