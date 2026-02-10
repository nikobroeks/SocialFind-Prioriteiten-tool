import { NextResponse } from 'next/server';

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

    // Try to get from cache first
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ALTIJD eerst database checken - Data flow: API → Database → Frontend
    let hires: any[] = [];

    if (user) {
      // SELECT alleen de hires kolom - niet alle kolommen!
      const { data: cache } = await supabase
        .from('recruitee_cache')
        .select('hires')
        .eq('user_id', user.id)
        .single();

      if (cache && (cache as any).hires) {
        console.log('[DATABASE] Using hires data from database for company-hires');
        hires = JSON.parse((cache as any).hires || '[]');
      }
    }

    // If no cache, return empty (should not happen if refresh was done)
    if (hires.length === 0) {
      console.log('[DATABASE MISS] No hires data in database. Please run Data Refresh first.');
      // Return empty data instead of fetching from API
      return NextResponse.json({
        companyHires: {},
        totalHires: 0,
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        source: 'none',
        message: 'No cached data available. Please click "Data Refresh" button first.',
      });
    }

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
        // Extract company name from various sources
        // Priority: offer_company > company_name > offer_title (extract from "Company - Job")
        let companyName = hire.offer_company ||
                         hire.company_name || 
                         hire.job?.company_name || 
                         hire.offer?.company_name ||
                         (hire.offer_title?.includes(' - ') ? hire.offer_title.split(' - ')[0] : null) ||
                         (hire.job_title?.includes(' - ') ? hire.job_title.split(' - ')[0] : null) ||
                         'Unknown Company';
        
        // Clean up company name (remove extra spaces, etc.)
        companyName = companyName.trim();
        
        // Normalize company name for better matching
        // Remove common suffixes and normalize case
        companyName = companyName
          .replace(/\s+/g, ' ') // Multiple spaces to single space
          .replace(/\.$/, '') // Remove trailing dot
          .trim();
        
        if (companyName && companyName !== 'Unknown Company') {
          companyHires[companyName] = (companyHires[companyName] || 0) + 1;
        }
      }
    });

    // Debug logging
    console.log('[COMPANY-HIRES API] Processed hires:', {
      totalHires: hires.length,
      hiresInRange: Object.values(companyHires).reduce((sum, count) => sum + count, 0),
      uniqueCompanies: Object.keys(companyHires).length,
      sampleCompanies: Object.entries(companyHires).slice(0, 10),
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

