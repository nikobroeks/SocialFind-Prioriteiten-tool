import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { role } = await request.json();

    if (!role || !['admin', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Insert user role
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        email: user.email!,
        role: role,
      })
      .select()
      .single();

    if (error) {
      // If role already exists, that's okay
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Role already assigned' });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign role' },
      { status: 500 }
    );
  }
}

