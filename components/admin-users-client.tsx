'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UserRole {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'viewer';
  created_at: string;
  updated_at: string;
}

interface AdminUsersClientProps {
  initialRoles: UserRole[];
}

export function AdminUsersClient({ initialRoles }: AdminUsersClientProps) {
  const [users, setUsers] = useState<UserRole[]>(initialRoles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'viewer'>('viewer');
  const router = useRouter();

  const refreshUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error refreshing users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, email: string, role: 'admin' | 'viewer') => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/users/assign-role-to-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          targetEmail: email,
          role: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign role');
      }

      setSuccess(`Rol "${role}" toegewezen aan ${email}`);
      await refreshUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error assigning role:', err);
      setError(err.message || 'Fout bij toewijzen van rol');
    } finally {
      setLoading(false);
    }
  };

  const addUserByEmail = async () => {
    if (!newUserEmail.trim()) {
      setError('Voer een email adres in');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First, try to find the user in auth.users by checking if they exist
      // We'll need to create a user first or find them
      // For now, we'll show an error if the user doesn't exist in user_roles
      // and suggest they register first

      // Check if user already has a role
      const existingUser = users.find(u => u.email.toLowerCase() === newUserEmail.toLowerCase());
      
      if (existingUser) {
        setError('Deze gebruiker heeft al een rol. Gebruik de update knop.');
        setLoading(false);
        return;
      }

      // Try to get user from auth (we can't directly query, but we can try to sign them up or find them)
      // For now, we'll require the user to exist first
      setError('Gebruiker moet eerst een account hebben. Laat ze eerst registreren via /register, of voeg de rol handmatig toe via Supabase SQL.');
      setLoading(false);
    } catch (err: any) {
      console.error('Error adding user:', err);
      setError(err.message || 'Fout bij toevoegen van gebruiker');
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Gebruikersbeheer</h1>
        <p className="text-gray-600">Beheer gebruikersrollen (admin of viewer)</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Gebruikers met rollen</h2>
        
        {users.length === 0 ? (
          <p className="text-gray-500">Geen gebruikers gevonden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aangemaakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => assignRole(user.user_id, user.email, 'admin')}
                          disabled={loading}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                        >
                          Maak Admin
                        </button>
                      )}
                      {user.role !== 'viewer' && (
                        <button
                          onClick={() => assignRole(user.user_id, user.email, 'viewer')}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          Maak Viewer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={refreshUsers}
            disabled={loading}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? 'Laden...' : 'Ververs'}
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        <h3 className="font-semibold mb-2">Let op:</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Gebruikers moeten eerst een account hebben voordat je ze een rol kunt geven</li>
          <li>Als een gebruiker nog geen rol heeft, laat ze eerst registreren via /register</li>
          <li>Je kunt ook handmatig een rol toevoegen via Supabase SQL Editor:</li>
        </ul>
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
{`INSERT INTO public.user_roles (user_id, email, role)
SELECT id, 'email@example.com', 'admin'
FROM auth.users
WHERE email = 'email@example.com'
ON CONFLICT (email) DO UPDATE SET role = 'admin';`}
        </pre>
      </div>
    </main>
  );
}

