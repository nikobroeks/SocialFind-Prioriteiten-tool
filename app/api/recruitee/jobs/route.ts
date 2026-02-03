import { NextResponse } from 'next/server';
import { fetchRecruiteeJobs } from '@/lib/recruitee';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'published';
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '100');

    const jobs = await fetchRecruiteeJobs({ status, page, perPage });
    
    // Log voor debugging
    console.log('API route - Jobs fetched:', {
      count: jobs.length,
      sample: jobs[0] ? {
        id: jobs[0].id,
        title: jobs[0].title,
        company_id: jobs[0].company_id,
        hasCompany: !!jobs[0].company
      } : null
    });
    
    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Error in /api/recruitee/jobs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

