import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Wijs een vacature toe aan een bedrijf
 * Dit update de company_name in de recruitee_cache voor die specifieke job
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
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || !roleData || (roleData as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { jobId, companyName } = body;

    if (!jobId || !companyName || !companyName.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, companyName' },
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
    
    // Update de company name voor de specifieke job
    const updatedJobs = jobs.map((job: any) => {
      if (job.id === jobId) {
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
      message: `Vacature toegewezen aan "${companyName}"`,
    });
  } catch (error: any) {
    console.error('Error assigning company to vacancy:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign company' },
      { status: 500 }
    );
  }
}

