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

    // Lijst van admin emails
    const adminEmails = ['admin@admin', 'niko@socialfind.nl'];
    
    // Check if user is admin email
    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();

      if (!existingRole) {
        // Insert admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            email: user.email.toLowerCase(),
            role: 'admin',
          });

        if (error && error.code !== '23505') {
          throw error;
        }
      }

      return NextResponse.json({ success: true, role: 'admin' });
    }

    return NextResponse.json({ success: false });
  } catch (error: any) {
    console.error('Error ensuring admin role:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to ensure admin role' },
      { status: 500 }
    );
  }
}

