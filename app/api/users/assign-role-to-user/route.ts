import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if current user is admin
    const { data: currentUserRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    type UserRoleData = { role: 'admin' | 'viewer' } | null;
    const roleData = currentUserRole as UserRoleData;

    if (roleError || !roleData || roleData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can assign roles' },
        { status: 403 }
      );
    }

    const { targetUserId, targetEmail, role } = await request.json();

    if (!targetUserId || !targetEmail || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: targetUserId, targetEmail, role' },
        { status: 400 }
      );
    }

    if (!['admin', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "viewer"' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existingRole) {
      // Update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role, email: targetEmail.toLowerCase() })
        .eq('user_id', targetUserId);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Role updated successfully' 
      });
    } else {
      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUserId,
          email: targetEmail.toLowerCase(),
          role: role,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json({ 
            success: true, 
            message: 'Role already exists' 
          });
        }
        throw insertError;
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Role assigned successfully' 
      });
    }
  } catch (error: any) {
    console.error('Error assigning role to user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign role' },
      { status: 500 }
    );
  }
}

