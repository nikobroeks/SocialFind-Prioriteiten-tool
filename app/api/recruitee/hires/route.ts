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

    // ALTIJD eerst proberen cache te gebruiken als beschikbaar (ongeacht filters)
    // Filters worden client-side toegepast op de gecachte data
    // Data flow: API → Database → Frontend (geen directe API calls naar Recruitee)
    if (useCache && user) {
      // SELECT alleen de kolommen die we nodig hebben - niet alle kolommen!
      const columnsToSelect = includeApplications 
        ? 'hires,applications,stats' 
        : 'hires';
      const { data: cache } = await supabase
        .from('recruitee_cache')
        .select(columnsToSelect)
        .eq('user_id', user.id)
        .single();

      if (cache && ((cache as any).hires || (cache as any).applications)) {
        console.log('[DATABASE] Using cached data from database (age:', Math.round((Date.now() - new Date((cache as any).cached_at).getTime()) / 1000), 'seconds)');
        const cachedHires = JSON.parse((cache as any).hires || '[]');
        const cachedApplications = JSON.parse((cache as any).applications || '[]');
        const cachedStats = (cache as any).stats ? JSON.parse((cache as any).stats) : null;

        // Return ALL cached data - filtering happens client-side
        if (includeApplications) {
          return NextResponse.json({
            applications: cachedApplications,
            hires: cachedHires,
            applicationsCount: cachedApplications.length,
            hiresCount: cachedHires.length,
            stats: cachedStats,
            cached: true,
            source: 'database',
          });
        } else {
          return NextResponse.json({
            hires: cachedHires,
            count: cachedHires.length,
            cached: true,
            source: 'database',
          });
        }
      }
    }

    // Cache miss - geen data in database
    // Dit zou alleen moeten gebeuren als er nog geen refresh is gedaan
    console.log('[DATABASE MISS] No data in database. Please run Data Refresh first.');
    return NextResponse.json(
      { 
        error: 'No cached data available',
        message: 'Please click "Data Refresh" button to load data from Recruitee API first.',
        applications: [],
        hires: [],
        applicationsCount: 0,
        hiresCount: 0,
        stats: null,
        cached: false,
        source: 'none',
      },
      { status: 200 } // Return 200 with empty data instead of error
    );
  } catch (error: any) {
    console.error('Error in /api/recruitee/hires:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hires' },
      { status: 500 }
    );
  }
}

