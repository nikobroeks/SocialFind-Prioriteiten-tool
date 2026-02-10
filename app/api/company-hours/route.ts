import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllCompanyHoursForWeeks, 
  getCompanyHoursForWeeks, 
  setCompanyHours,
  getWeekStartDate,
  getPreviousWeekStartDate
} from '@/lib/supabase/company-hours';

/**
 * GET /api/company-hours
 * Get hours for all companies or a specific company (for current and previous week)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const companyName = searchParams.get('companyName');

    if (companyId && companyName) {
      // Get hours for specific company for both weeks
      const hours = await getCompanyHoursForWeeks(parseInt(companyId), companyName);
      return NextResponse.json({ 
        hours: hours.currentWeek,
        previousWeekHours: hours.previousWeek,
        currentWeekStart: getWeekStartDate(),
        previousWeekStart: getPreviousWeekStartDate()
      });
    } else {
      // Get hours for all companies for both weeks
      const hours = await getAllCompanyHoursForWeeks();
      return NextResponse.json({ 
        hours: hours.currentWeek,
        previousWeekHours: hours.previousWeek,
        currentWeekStart: getWeekStartDate(),
        previousWeekStart: getPreviousWeekStartDate()
      });
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
 * Create or update hours for a company for the current week
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, companyName, totalHours, spentHours, weekStartDate } = body;

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

    // Use provided weekStartDate or default to current week
    const weekStart = weekStartDate || getWeekStartDate();

    const hours = await setCompanyHours(
      parseInt(companyId),
      companyName,
      totalHours,
      spentHours,
      weekStart
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

