import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchRecruiteeJobs } from '@/lib/recruitee';
import { fetchAllCandidatesAndApplications } from '@/lib/recruitee';

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[PRELOAD] Starting data preload for user:', user.email);

    // Preload jobs
    console.log('[PRELOAD] Fetching jobs...');
    const jobs = await fetchRecruiteeJobs({ status: 'published' });
    console.log('[PRELOAD] Fetched', jobs.length, 'jobs');

    // Preload hires and applications (without date filters to get all data)
    console.log('[PRELOAD] Fetching hires and applications...');
    const { hires, applications, stats } = await fetchAllCandidatesAndApplications();
    console.log('[PRELOAD] Fetched', hires.length, 'hires and', applications.length, 'applications');

    // Store in cache table
    const cacheData = {
      user_id: user.id,
      jobs: JSON.stringify(jobs),
      hires: JSON.stringify(hires),
      applications: JSON.stringify(applications),
      stats: JSON.stringify(stats),
      cached_at: new Date().toISOString(),
    };

    // Upsert cache (replace existing cache for this user)
    const { error: cacheError } = await supabase
      .from('recruitee_cache')
      .upsert(cacheData as any, {
        onConflict: 'user_id',
      });

    if (cacheError) {
      console.error('[PRELOAD] Cache error:', cacheError);
      // Continue anyway - cache is optional
    } else {
      console.log('[PRELOAD] Cache updated successfully');
    }

    return NextResponse.json({
      success: true,
      jobs: jobs.length,
      hires: hires.length,
      applications: applications.length,
      cached_at: cacheData.cached_at,
    });
  } catch (error: any) {
    console.error('[PRELOAD] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preload data' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get cached data
    const { data: cache, error: cacheError } = await supabase
      .from('recruitee_cache')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (cacheError || !cache || !(cache as any).cached_at) {
      return NextResponse.json({
        cached: false,
        message: 'No cache found',
      });
    }

    // Check if cache is still valid
    const cachedAt = new Date((cache as any).cached_at);
    const now = new Date();
    const age = now.getTime() - cachedAt.getTime();
    const isValid = age < CACHE_DURATION_MS;

    if (!isValid) {
      return NextResponse.json({
        cached: true,
        valid: false,
        age_minutes: Math.floor(age / 60000),
        message: 'Cache expired',
      });
    }

    return NextResponse.json({
      cached: true,
      valid: true,
      age_minutes: Math.floor(age / 60000),
      cached_at: (cache as any).cached_at,
      jobs_count: JSON.parse((cache as any).jobs || '[]').length,
      hires_count: JSON.parse((cache as any).hires || '[]').length,
      applications_count: JSON.parse((cache as any).applications || '[]').length,
    });
  } catch (error: any) {
    console.error('[PRELOAD] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check cache' },
      { status: 500 }
    );
  }
}

