import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminUsersClient } from '@/components/admin-users-client';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    type UserRoleData = { role: 'admin' | 'viewer' } | null;
    const roleData = userRole as UserRoleData;

    if (roleError || !roleData || roleData.role !== 'admin') {
      return (
        <main className="container mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <h1 className="text-xl font-bold mb-2">Toegang Geweigerd</h1>
            <p>Je hebt geen admin rechten om deze pagina te bekijken.</p>
          </div>
        </main>
      );
    }

    // Get all users from auth.users (via Supabase admin API or by querying user_roles)
    // Note: We can't directly query auth.users, so we'll get users from user_roles
    // and also try to get all auth users if possible
    const { data: allRoles } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    return <AdminUsersClient initialRoles={allRoles || []} />;
  } catch (error) {
    console.error('Admin users page error:', error);
    redirect('/login');
  }
}

