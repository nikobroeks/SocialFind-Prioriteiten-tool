'use client';

import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-input hover:bg-muted"
    >
      <LogOut className="h-4 w-4" />
      Uitloggen
    </button>
  );
}

