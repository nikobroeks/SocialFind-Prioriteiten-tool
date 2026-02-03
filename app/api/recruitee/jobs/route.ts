import { NextResponse } from 'next/server';
import { fetchRecruiteeJobs } from '@/lib/recruitee';
import { createClient } from '@/lib/supabase/server';

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'published';
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '100');
    const useCache = searchParams.get('use_cache') !== 'false'; // Default true

    // Try to get from cache first
    if (useCache) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: cache } = await supabase
          .from('recruitee_cache')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (cache && (cache as any).jobs) {
          const cachedAt = new Date((cache as any).cached_at);
          const now = new Date();
          const age = now.getTime() - cachedAt.getTime();

          if (age < CACHE_DURATION_MS) {
            console.log('[JOBS API] Using cached jobs data');
            const cachedJobs = JSON.parse((cache as any).jobs || '[]');
            return NextResponse.json({ jobs: cachedJobs, cached: true });
          }
        }
      }
    }

    // Cache miss - fetch from API
    console.log('[JOBS API] Cache miss, fetching from Recruitee');
    const jobs = await fetchRecruiteeJobs({ status, page, perPage });
    
    return NextResponse.json({ jobs, cached: false });
  } catch (error: any) {
    console.error('Error in /api/recruitee/jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

