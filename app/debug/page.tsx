'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DebugPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          setError(`User error: ${userError.message}`);
          return;
        }

        setUser(user);

        if (user) {
          // Check role
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (roleError) {
            setError(`Role error: ${roleError.message}`);
          } else {
            setRole(roleData);
          }
        }
      } catch (err: any) {
        setError(`Unexpected error: ${err.message}`);
      }
    }

    checkAuth();
  }, []);

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">User Info:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Role Info:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(role, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Environment:</h2>
          <p className="text-sm">
            Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
          </p>
          <p className="text-sm">
            Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
          </p>
        </div>
      </div>
    </main>
  );
}

