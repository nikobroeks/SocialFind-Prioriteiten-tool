import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Dashboard from '@/components/dashboard';
import { LogoutButton } from '@/components/logout-button';
import { AssignRoleButton } from '@/components/assign-role-button';
import { PreloadTrigger } from '@/components/preload-trigger';
import { BackgroundSync } from '@/components/background-sync';

export default async function HomePage() {
  const supabase = await createClient();
  
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
  if (isAdminEmail && user.email) {
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
          } as any);

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
    <>
      {!roleData && user.email && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-800">
                Je hebt nog geen rol toegewezen gekregen. Je kunt de applicatie bekijken maar niet bewerken.
              </p>
              {isAdminEmail && (
                <AssignRoleButton userEmail={user.email} userId={user.id} />
              )}
            </div>
          </div>
        </div>
      )}
      <Dashboard />
    </>
  );
  } catch (error) {
    console.error('Homepage error:', error);
    redirect('/login');
  }
}

