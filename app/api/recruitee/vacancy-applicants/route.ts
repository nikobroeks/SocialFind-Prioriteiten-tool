import { NextResponse } from 'next/server';

/**
 * Get applicants count per vacancy ID
 * Returns: { [vacancyId]: count }
 */
export async function GET(request: Request) {
  try {
    // Get from cache first
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let applications: any[] = [];

    if (user) {
      // SELECT alleen de applications kolom - niet alle kolommen!
      const { data: cache } = await supabase
        .from('recruitee_cache')
        .select('applications')
        .eq('user_id', user.id)
        .single();

      if (cache && (cache as any).applications) {
        console.log('[VACANCY-APPLICANTS] Using applications data from database');
        applications = JSON.parse((cache as any).applications || '[]');
      }
    }

    // If no cache, return empty
    if (applications.length === 0) {
      console.log('[VACANCY-APPLICANTS] No applications data in database');
      return NextResponse.json({
        applicantsPerVacancy: {},
        totalApplicants: 0,
        source: 'none',
      });
    }

    // Count applicants per vacancy ID (total and those still in 'applied' first stage)
    const applicantsPerVacancy: Record<string, number> = {};
    const newApplicantsPerVacancy: Record<string, number> = {};

    applications.forEach((app: any) => {
      const vacancyId = app.offer_id || app.job_id || null;
      if (!vacancyId) return;

      const key = vacancyId.toString();
      applicantsPerVacancy[key] = (applicantsPerVacancy[key] || 0) + 1;

      // Count as "gesolliciteerd" if candidate is still in the first 'applied' stage
      const stageCategory = app.stage?.category?.toLowerCase() || '';
      if (stageCategory === 'applied') {
        newApplicantsPerVacancy[key] = (newApplicantsPerVacancy[key] || 0) + 1;
      }
    });

    const totalApplicants = applications.length;
    const totalVacancies = Object.keys(applicantsPerVacancy).length;

    console.log('[VACANCY-APPLICANTS] Processed applications:', {
      totalApplications: applications.length,
      totalVacancies,
      sampleVacancies: Object.entries(applicantsPerVacancy).slice(0, 5),
    });

    return NextResponse.json({
      applicantsPerVacancy,
      newApplicantsPerVacancy,
      totalApplicants,
      totalVacancies,
      source: 'cache',
    });
  } catch (error: any) {
    console.error('Error in /api/recruitee/vacancy-applicants:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vacancy applicants' },
      { status: 500 }
    );
  }
}

