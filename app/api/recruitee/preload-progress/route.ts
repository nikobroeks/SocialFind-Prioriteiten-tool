import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchRecruiteeJobs } from '@/lib/recruitee';
import { fetchAllCandidatesAndApplications } from '@/lib/recruitee';

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { step } = await request.json();
    
    // Step 1: Fetch jobs (25%)
    if (step === 1) {
      console.log('[PRELOAD PROGRESS] Step 1/4: Fetching jobs...');
      const jobs = await fetchRecruiteeJobs({ status: 'published' });
      
      // Store jobs in cache immediately (partial update)
      const { data: existingCache } = await supabase
        .from('recruitee_cache')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingCache) {
        await (supabase.from('recruitee_cache') as any)
          .update({
            jobs: JSON.stringify(jobs),
            cached_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        await (supabase.from('recruitee_cache') as any)
          .insert({
            user_id: user.id,
            jobs: JSON.stringify(jobs),
            hires: JSON.stringify([]),
            applications: JSON.stringify([]),
            cached_at: new Date().toISOString(),
          });
      }

      return NextResponse.json({
        step: 1,
        progress: 25,
        message: `Jobs geladen: ${jobs.length}`,
        jobs: jobs.length,
      });
    }

    // Step 2: Fetch applications (50%)
    if (step === 2) {
      console.log('[PRELOAD PROGRESS] Step 2/4: Fetching applications...');
      const { applications } = await fetchAllCandidatesAndApplications();
      
      // Update cache with applications
      const { data: existingCache } = await supabase
        .from('recruitee_cache')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingCache) {
        await (supabase.from('recruitee_cache') as any)
          .update({
            applications: JSON.stringify(applications),
            cached_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }

      return NextResponse.json({
        step: 2,
        progress: 50,
        message: `Sollicitaties geladen: ${applications.length}`,
        applications: applications.length,
      });
    }

    // Step 3: Fetch hires (75%)
    if (step === 3) {
      console.log('[PRELOAD PROGRESS] Step 3/4: Fetching hires...');
      const { hires, stats } = await fetchAllCandidatesAndApplications();
      
      // Update cache with hires
      const { data: existingCache } = await supabase
        .from('recruitee_cache')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingCache) {
        await (supabase.from('recruitee_cache') as any)
          .update({
            hires: JSON.stringify(hires),
            stats: JSON.stringify(stats),
            cached_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }

      return NextResponse.json({
        step: 3,
        progress: 75,
        message: `Hires geladen: ${hires.length}`,
        hires: hires.length,
      });
    }

    // Step 4: Finalize (100%)
    if (step === 4) {
      console.log('[PRELOAD PROGRESS] Step 4/4: Finalizing...');
      
      // Get final cache to verify
      const { data: cache } = await supabase
        .from('recruitee_cache')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return NextResponse.json({
        step: 4,
        progress: 100,
        message: 'Data refresh voltooid!',
        cached_at: (cache as any)?.cached_at,
        jobs: cache ? JSON.parse((cache as any).jobs || '[]').length : 0,
        hires: cache ? JSON.parse((cache as any).hires || '[]').length : 0,
        applications: cache ? JSON.parse((cache as any).applications || '[]').length : 0,
      });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  } catch (error: any) {
    console.error('[PRELOAD PROGRESS] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preload data' },
      { status: 500 }
    );
  }
}

