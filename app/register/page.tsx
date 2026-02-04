'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validatie
    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      setLoading(false);
      return;
    }

    // Special case: admin credentials (bypass password length check)
    const isAdminCredentials = email.toLowerCase() === 'admin@admin' && password === 'admin';
    
    if (!isAdminCredentials && password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens lang zijn');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Check if admin credentials
        if (isAdminCredentials) {
          // Wacht even zodat de user in de database staat
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Log in met de nieuwe credentials
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!signInError) {
            // Wacht even zodat de session goed is ingesteld
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Assign admin role direct via Supabase client
            const { error: insertError } = await (supabase.from('user_roles') as any)
              .insert({
                user_id: data.user.id,
                email: email.toLowerCase(),
                role: 'admin',
              });

            if (!insertError) {
              setSuccess(true);
              setTimeout(() => {
                router.push('/');
                router.refresh();
              }, 1000);
              return;
            } else {
              console.error('Error inserting admin role:', insertError);
              // Als insert faalt, probeer via API
              try {
                const roleResponse = await fetch('/api/users/assign-role', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role: 'admin' }),
                });

                if (roleResponse.ok) {
                  setSuccess(true);
                  setTimeout(() => {
                    router.push('/');
                    router.refresh();
                  }, 1000);
                  return;
                }
              } catch (roleErr) {
                console.error('Error assigning admin role via API:', roleErr);
              }
            }
          }
        }

        setSuccess(true);
        // Voor normale users: standaard viewer rol (optioneel)
        // Je kunt dit ook handmatig doen via SQL
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het registreren');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              Registratie gelukt!
            </h2>
            <p className="text-green-700 mb-4">
              {email.toLowerCase() === 'admin@admin' 
                ? 'Admin account aangemaakt! Je wordt doorgestuurd naar het dashboard...'
                : 'Je account is aangemaakt. Je wordt doorgestuurd naar de login pagina...'}
            </p>
            {email.toLowerCase() !== 'admin@admin' && (
              <p className="text-sm text-green-600">
                Let op: Je moet mogelijk eerst je email bevestigen voordat je kunt inloggen.
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center">Account Aanmaken</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Maak een account aan om toegang te krijgen
          </p>
        </div>
        <form onSubmit={handleRegister} className="mt-8 space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email adres
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="jouw@email.nl"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Minimaal 6 tekens"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Bevestig wachtwoord
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Account aanmaken...' : 'Account aanmaken'}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Al een account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log hier in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

