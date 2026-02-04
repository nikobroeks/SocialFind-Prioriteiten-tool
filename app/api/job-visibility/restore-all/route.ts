import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setJobVisibility } from '@/lib/supabase/job-visibility';

/**
 * API route om alle verborgen vacatures weer zichtbaar te maken
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal alle verborgen jobs op uit de job_visibility tabel
    const { data: hiddenJobs, error: visibilityError } = await supabase
      .from('job_visibility')
      .select('*')
      .eq('is_visible', false);

    if (visibilityError) {
      throw visibilityError;
    }

    if (!hiddenJobs || hiddenJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Geen verborgen vacatures gevonden',
        restored: [],
        totalFound: 0,
      });
    }

    console.log(`[RESTORE ALL] Found ${hiddenJobs.length} hidden jobs`);

    // Maak alle verborgen jobs zichtbaar
    const restored = [];
    for (const hiddenJob of hiddenJobs) {
      try {
        await setJobVisibility(
          hiddenJob.recruitee_job_id,
          hiddenJob.recruitee_company_id,
          hiddenJob.company_name,
          true // isVisible = true
        );
        
        restored.push({
          id: hiddenJob.recruitee_job_id,
          company: hiddenJob.company_name,
        });
      } catch (error: any) {
        console.error(`[RESTORE ALL] Error restoring job ${hiddenJob.recruitee_job_id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${restored.length} hidden jobs`,
      restored,
      totalFound: hiddenJobs.length,
    });
  } catch (error: any) {
    console.error('Error in restore-all:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to restore hidden jobs' },
      { status: 500 }
    );
  }
}

