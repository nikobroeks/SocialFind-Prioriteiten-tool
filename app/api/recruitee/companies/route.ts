import { NextResponse } from 'next/server';
import { fetchRecruiteeCompanies } from '@/lib/recruitee';

export async function GET(request: Request) {
  try {
    const companies = await fetchRecruiteeCompanies();
    return NextResponse.json({ companies });
  } catch (error: any) {
    console.error('Error in /api/recruitee/companies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

