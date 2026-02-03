import { NextResponse } from 'next/server';
import { fetchRecruiteeHires, fetchAllCandidatesAndApplications } from '@/lib/recruitee';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const includeApplications = searchParams.get('include_applications') === 'true';

    if (includeApplications) {
      const { applications, hires } = await fetchAllCandidatesAndApplications(month, year);
      return NextResponse.json({ 
        applications, 
        hires, 
        applicationsCount: applications.length,
        hiresCount: hires.length 
      });
    } else {
      const hires = await fetchRecruiteeHires(month, year);
      return NextResponse.json({ hires, count: hires.length });
    }
  } catch (error: any) {
    console.error('Error in /api/recruitee/hires:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch hires' },
      { status: 500 }
    );
  }
}

