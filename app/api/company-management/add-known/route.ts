import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addKnownCompany } from '@/lib/supabase/known-companies';

/**
 * Voeg een bedrijf toe aan de bekende bedrijven lijst
 * Dit wordt opgeslagen in een database tabel zodat het persistent is
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin role using server-side client
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || !roleData || roleData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { companyName } = body;

    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { error: 'Missing required field: companyName' },
        { status: 400 }
      );
    }

    const knownCompany = await addKnownCompany(companyName.trim());
    
    return NextResponse.json({
      success: true,
      message: `Bedrijf "${companyName}" is toegevoegd aan de bekende bedrijven lijst`,
      company: knownCompany,
    });
  } catch (error: any) {
    console.error('Error adding company to known list:', error);
    
    // Check if it's a duplicate error
    if (error.code === '23505' || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Dit bedrijf staat al in de bekende bedrijven lijst' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to add company to known list' },
      { status: 500 }
    );
  }
}

