import { NextRequest, NextResponse } from 'next/server';
import { getAllCompanyHours, getCompanyHours, setCompanyHours } from '@/lib/supabase/company-hours';

/**
 * GET /api/company-hours
 * Get hours for all companies or a specific company
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const companyName = searchParams.get('companyName');

    if (companyId && companyName) {
      // Get hours for specific company
      const hours = await getCompanyHours(parseInt(companyId), companyName);
      return NextResponse.json({ hours });
    } else {
      // Get hours for all companies
      const hours = await getAllCompanyHours();
      return NextResponse.json({ hours });
    }
  } catch (error: any) {
    console.error('Error fetching company hours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company hours', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/company-hours
 * Create or update hours for a company
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, companyName, totalHours, spentHours } = body;

    if (!companyId || !companyName) {
      return NextResponse.json(
        { error: 'companyId and companyName are required' },
        { status: 400 }
      );
    }

    if (typeof totalHours !== 'number' || typeof spentHours !== 'number') {
      return NextResponse.json(
        { error: 'totalHours and spentHours must be numbers' },
        { status: 400 }
      );
    }

    if (totalHours < 0 || spentHours < 0) {
      return NextResponse.json(
        { error: 'Hours cannot be negative' },
        { status: 400 }
      );
    }

    const hours = await setCompanyHours(
      parseInt(companyId),
      companyName,
      totalHours,
      spentHours
    );

    return NextResponse.json({ hours });
  } catch (error: any) {
    console.error('Error setting company hours:', error);
    return NextResponse.json(
      { error: 'Failed to set company hours', details: error.message },
      { status: 500 }
    );
  }
}

