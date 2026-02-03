'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AssignRoleButtonProps {
  userEmail: string;
  userId: string;
}

export function AssignRoleButton({ userEmail, userId }: AssignRoleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const assignAdminRole = async () => {
    setLoading(true);
    setError(null);

    try {
      // Gebruik altijd de API route (server-side heeft meer rechten)
      const response = await fetch('/api/users/ensure-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Success! Refresh de pagina
        router.refresh();
        return;
      }

      // Als API faalt, toon error
      throw new Error(data.error || 'Kon rol niet toewijzen');
    } catch (err: any) {
      console.error('Error assigning role:', err);
      setError(err.message || 'Fout bij toewijzen van rol. Voer het SQL script uit in Supabase.');
    } finally {
      setLoading(false);
    }
  };

  // Lijst van admin emails
  const adminEmails = ['admin@admin', 'niko@socialfind.nl'];
  
  if (!adminEmails.includes(userEmail.toLowerCase())) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        onClick={assignAdminRole}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
      >
        {loading ? 'Rol toewijzen...' : 'Wijs Admin Rol Toe'}
      </button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

