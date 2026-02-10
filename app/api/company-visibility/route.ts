import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllCompanyVisibility, setCompanyVisibility } from '@/lib/supabase/company-visibility';

export async function GET() {
  try {
    const visibility = await getAllCompanyVisibility();
    return NextResponse.json({ visibility });
  } catch (error: any) {
    console.error('Error in GET /api/company-visibility:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company visibility' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, companyName, isVisible } = body;

    if (!companyId || !companyName || isVisible === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, companyName, isVisible' },
        { status: 400 }
      );
    }

    const visibility = await setCompanyVisibility(companyId, companyName, isVisible);
    return NextResponse.json({ visibility });
  } catch (error: any) {
    console.error('Error in POST /api/company-visibility:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update company visibility' },
      { status: 500 }
    );
  }
}

