import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Dashboard from '@/components/dashboard';
import { LogoutButton } from '@/components/logout-button';
import { AssignRoleButton } from '@/components/assign-role-button';

export default async function HomePage() {
  const supabase = createClient();
  
  try {
    // Probeer eerst de session te refreshen
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      console.error('Auth error:', authError);
      console.error('Session:', session);
      redirect('/login');
    }

  // Check if user has a role (optional - users without role can still view)
  let roleData = null;
  
  // Lijst van admin emails die automatisch admin rol krijgen
  const adminEmails = ['admin@admin', 'niko@socialfind.nl'];
  const isAdminEmail = user.email && adminEmails.includes(user.email.toLowerCase());
  
  // Als admin email, probeer automatisch rol toe te wijzen
  if (isAdminEmail) {
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();

      if (!existingRole) {
        // Probeer automatisch admin rol toe te wijzen
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            email: user.email.toLowerCase(),
            role: 'admin',
          });

        if (!insertError) {
          // Refresh de query
          const { data: newRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();
          roleData = newRole;
        }
      } else {
        roleData = existingRole;
      }
    } catch (err) {
      console.error('Error auto-assigning role:', err);
      // Fallback: haal gewoon de rol op
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      roleData = data;
    }
  } else {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    roleData = data;
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Prioriteiten Dashboard</h1>
        <LogoutButton />
      </div>
      {!roleData && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          <p className="text-sm mb-2">
            Je hebt nog geen rol toegewezen gekregen. Je kunt de applicatie bekijken maar niet bewerken.
          </p>
          {isAdminEmail && (
            <div>
              <p className="text-sm mb-2">
                Als je een admin email hebt ({user.email}), klik op de knop hieronder om je admin rol toe te wijzen:
              </p>
              <AssignRoleButton userEmail={user.email} userId={user.id} />
            </div>
          )}
        </div>
      )}
      <Dashboard />
      </main>
    );
  } catch (error) {
    console.error('Homepage error:', error);
    redirect('/login');
  }
}

