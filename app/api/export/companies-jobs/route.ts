import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractCompanyFromTitle } from '@/lib/company-extractor';

/**
 * Export endpoint om alle bedrijven en job titels te exporteren naar CSV
 * GET /api/export/companies-jobs
 * Haalt data uit de database cache
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Haal jobs uit database cache
    const { data: cache } = await supabase
      .from('recruitee_cache')
      .select('jobs')
      .eq('user_id', user.id)
      .single();

    if (!cache || !(cache as any).jobs) {
      return NextResponse.json(
        { error: 'No cached data available. Please run Data Refresh first.' },
        { status: 404 }
      );
    }

    const jobs = JSON.parse((cache as any).jobs || '[]');

    // Maak CSV header
    const csvRows = [
      ['Job ID', 'Job Title', 'Extracted Company', 'Original Company Name', 'Company ID'].join(',')
    ];

    // Voeg alle jobs toe
    for (const job of jobs) {
      const jobId = job.id || '';
      const jobTitle = (job.title || '').replace(/"/g, '""'); // Escape quotes voor CSV
      const extractedCompany = extractCompanyFromTitle(job.title || '');
      const originalCompanyName = ((job.company?.name || (job as any).company_name || '') as string).replace(/"/g, '""');
      const companyId = job.company_id || job.company?.id || '';

      csvRows.push([
        jobId.toString(),
        `"${jobTitle}"`,
        `"${extractedCompany.replace(/"/g, '""')}"`,
        `"${originalCompanyName}"`,
        companyId.toString()
      ].join(','));
    }

    const csvContent = csvRows.join('\n');

    // Return als CSV download
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bedrijven-en-jobs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting companies and jobs:', error);
    return NextResponse.json(
      { error: 'Failed to export companies and jobs' },
      { status: 500 }
    );
  }
}

