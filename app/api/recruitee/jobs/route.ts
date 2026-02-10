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

    // ALTIJD eerst database checken - Data flow: API → Database → Frontend
    if (useCache) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // SELECT alleen de jobs kolom - niet alle kolommen!
        const { data: cache } = await supabase
          .from('recruitee_cache')
          .select('jobs')
          .eq('user_id', user.id)
          .single();

        if (cache && (cache as any).jobs) {
          console.log('[DATABASE] Using jobs data from database');
          const cachedJobs = JSON.parse((cache as any).jobs || '[]');
          return NextResponse.json({ jobs: cachedJobs, cached: true, source: 'database' });
        }
      }
    }

    // Cache miss - geen data in database
    // Dit zou alleen moeten gebeuren als er nog geen refresh is gedaan
    console.log('[DATABASE MISS] No jobs data in database. Please run Data Refresh first.');
    return NextResponse.json({ 
      jobs: [], 
      cached: false, 
      source: 'none',
      message: 'No cached data available. Please click "Data Refresh" button first.',
    });
  } catch (error: any) {
    console.error('Error in /api/recruitee/jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

