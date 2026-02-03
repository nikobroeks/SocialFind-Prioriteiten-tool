import { NextResponse } from 'next/server';
import { fetchRecruiteeHires, fetchAllCandidatesAndApplications } from '@/lib/recruitee';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '../rate-limit';

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const includeApplications = searchParams.get('include_applications') === 'true';
    const useCache = searchParams.get('use_cache') !== 'false'; // Default true

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Rate limiting: max 20 requests per minute per user
    if (user) {
      const rateLimit = checkRateLimit(`hires:${user.id}`, 20, 60000);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { 
            error: 'Too many requests',
            message: `Rate limit exceeded. Please wait ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds.`,
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    }

    // Try to get from cache first if no date filters and cache is enabled
    if (useCache && month === undefined && year === undefined && user) {
      const { data: cache } = await supabase
        .from('recruitee_cache')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (cache && (cache as any).cached_at) {
        const cachedAt = new Date((cache as any).cached_at);
        const now = new Date();
        const age = now.getTime() - cachedAt.getTime();

        if (age < CACHE_DURATION_MS) {
          console.log('[CACHE HIT] Using cached data for hires/applications');
          const cachedHires = JSON.parse((cache as any).hires || '[]');
          const cachedApplications = JSON.parse((cache as any).applications || '[]');
          const cachedStats = (cache as any).stats ? JSON.parse((cache as any).stats) : null;

          if (includeApplications) {
            return NextResponse.json({
              applications: cachedApplications,
              hires: cachedHires,
              applicationsCount: cachedApplications.length,
              hiresCount: cachedHires.length,
              stats: cachedStats,
              cached: true,
            });
          } else {
            return NextResponse.json({
              hires: cachedHires,
              count: cachedHires.length,
              cached: true,
            });
          }
        }
      }
    }

    // Cache miss or expired - fetch fresh data
    console.log('[CACHE MISS] Fetching fresh data from Recruitee API');
    
    if (includeApplications) {
      const { applications, hires, stats } = await fetchAllCandidatesAndApplications(month, year);
      return NextResponse.json({ 
        applications, 
        hires, 
        applicationsCount: applications.length,
        hiresCount: hires.length,
        stats,
        cached: false,
      });
    } else {
      const hires = await fetchRecruiteeHires(month, year);
      return NextResponse.json({ 
        hires, 
        count: hires.length,
        cached: false,
      });
    }
  } catch (error: any) {
    console.error('Error in /api/recruitee/hires:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hires' },
      { status: 500 }
    );
  }
}

