import { NextResponse } from 'next/server';
import { getAllKnownCompanies } from '@/lib/supabase/known-companies';

/**
 * Get all known companies
 * GET /api/known-companies
 */
export async function GET() {
  try {
    const companies = await getAllKnownCompanies();
    return NextResponse.json({ companies });
  } catch (error: any) {
    console.error('Error fetching known companies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch known companies' },
      { status: 500 }
    );
  }
}

