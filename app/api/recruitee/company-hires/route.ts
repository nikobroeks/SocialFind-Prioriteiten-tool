import { NextResponse } from 'next/server';
import { fetchAllCandidatesAndApplications } from '@/lib/recruitee';

/**
 * Get hires per company for the last 90 days
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 90;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all hires (no date filter, we'll filter client-side)
    const { hires } = await fetchAllCandidatesAndApplications();

    // Group by company and filter by date
    const companyHires: Record<string, number> = {};

    hires.forEach((hire: any) => {
      // Get hire date from placement.hired_at first, then hire.hired_at, then updated_at
      const placements = hire.placements || [];
      const hireDateStr = (placements.length > 0 && placements[0].hired_at)
                        || hire.hired_at
                        || hire.updated_at;

      if (!hireDateStr) return;

      const hireDate = new Date(hireDateStr);
      
      // Check if within date range
      if (hireDate >= startDate && hireDate <= endDate) {
        // Extract company name from job title or use company field
        const companyName = hire.company_name || 
                          hire.job?.company_name || 
                          hire.offer?.company_name ||
                          'Unknown Company';
        
        companyHires[companyName] = (companyHires[companyName] || 0) + 1;
      }
    });

    return NextResponse.json({
      companyHires,
      totalHires: Object.values(companyHires).reduce((sum, count) => sum + count, 0),
      days,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/recruitee/company-hires:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company hires' },
      { status: 500 }
    );
  }
}

