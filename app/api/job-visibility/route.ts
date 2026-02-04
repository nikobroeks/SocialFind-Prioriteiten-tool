import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllJobVisibility, setJobVisibility, setCompanyJobsVisibility } from '@/lib/supabase/job-visibility';

export async function GET() {
  try {
    const visibility = await getAllJobVisibility();
    return NextResponse.json({ visibility });
  } catch (error: any) {
    console.error('Error in GET /api/job-visibility:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job visibility' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, companyId, companyName, isVisible, jobIds } = body;

    if (jobIds && Array.isArray(jobIds)) {
      // Bulk update for multiple jobs
      await setCompanyJobsVisibility(companyName, companyId, jobIds, isVisible);
      return NextResponse.json({ success: true });
    } else if (jobId && companyId && companyName !== undefined) {
      // Single job update
      const visibility = await setJobVisibility(jobId, companyId, companyName, isVisible);
      return NextResponse.json({ visibility });
    } else {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error in POST /api/job-visibility:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update job visibility' },
      { status: 500 }
    );
  }
}

