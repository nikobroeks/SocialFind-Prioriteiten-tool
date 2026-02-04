import { useQuery } from '@tanstack/react-query';
import { SilverMedalistCandidate } from '@/types/recruitee';

interface UseSilverMedalistsOptions {
  jobId: number;
  jobTitle: string;
  jobTags?: string[];
  enabled?: boolean;
}

interface SilverMedalistsResponse {
  candidates: SilverMedalistCandidate[];
  total: number;
  jobId: number;
  jobTitle: string;
}

/**
 * Hook to fetch Silver Medalist candidates matched to a job
 * Only fetches when job has Red priority (10-12 points)
 */
export function useSilverMedalists({
  jobId,
  jobTitle,
  jobTags,
  enabled = true,
}: UseSilverMedalistsOptions) {
  return useQuery<SilverMedalistsResponse>({
    queryKey: ['silver-medalists', jobId, jobTitle, jobTags?.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams({
        jobId: jobId.toString(),
        jobTitle,
      });
      
      if (jobTags && jobTags.length > 0) {
        params.append('jobTags', jobTags.join(','));
      }
      
      console.log('[HOOK] Fetching silver medalists:', { jobId, jobTitle });
      const response = await fetch(`/api/recruitee/silver-medalists?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[HOOK] API error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to fetch Silver Medalist candidates: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[HOOK] Received data:', { total: data.total, candidates: data.candidates?.length });
      return data;
    },
    enabled: enabled && !!jobId && !!jobTitle,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

