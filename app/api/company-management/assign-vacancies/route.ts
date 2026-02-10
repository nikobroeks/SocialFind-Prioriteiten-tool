import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Wijs meerdere vacatures toe aan een bedrijf
 * Dit update de company_name in de recruitee_cache voor de geselecteerde jobs
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role using server-side client
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (userRoleError || !userRoleData || (userRoleData as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vacancyIds, companyName } = body;

    if (!vacancyIds || !Array.isArray(vacancyIds) || vacancyIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty vacancyIds array' },
        { status: 400 }
      );
    }

    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: companyName' },
        { status: 400 }
      );
    }

    // Haal de huidige cache op
    const { data: cache, error: cacheError } = await supabase
      .from('recruitee_cache')
      .select('jobs')
      .eq('user_id', user.id)
      .single();

    if (cacheError || !cache) {
      return NextResponse.json(
        { error: 'Cache not found' },
        { status: 404 }
      );
    }

    const jobs = JSON.parse((cache as any).jobs || '[]');
    const vacancyIdSet = new Set(vacancyIds);
    let updatedCount = 0;
    
    // Update de company name voor de geselecteerde jobs
    const updatedJobs = jobs.map((job: any) => {
      if (vacancyIdSet.has(job.id)) {
        updatedCount++;
        return {
          ...job,
          company: {
            ...job.company,
            name: companyName.trim(),
          },
          company_name: companyName.trim(),
        };
      }
      return job;
    });

    if (updatedCount === 0) {
      return NextResponse.json(
        { error: 'No matching vacancies found in cache' },
        { status: 404 }
      );
    }

    // Update de cache
    const { error: updateError } = await supabase
      .from('recruitee_cache')
      .update({
        jobs: JSON.stringify(updatedJobs),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating cache:', updateError);
      return NextResponse.json(
        { error: 'Failed to update cache' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} vacature(s) toegewezen aan "${companyName}"`,
      updatedCount,
    });
  } catch (error: any) {
    console.error('Error assigning vacancies to company:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign vacancies' },
      { status: 500 }
    );
  }
}
