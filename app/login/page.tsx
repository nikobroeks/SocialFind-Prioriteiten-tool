'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted, email:', email);
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting login...');
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', { data, error });

      if (error) {
        console.error('Login error:', error);
        // Check for specific error types
        if (error.message.includes('Email not confirmed')) {
          setError('Je email is nog niet bevestigd. Check je inbox of bevestig je email in Supabase dashboard.');
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Ongeldige inloggegevens. Controleer je email en wachtwoord.');
        } else {
          setError(error.message || 'Er is een fout opgetreden bij het inloggen');
        }
        return;
      }

      if (!data.user) {
        setError('Login mislukt. Geen user data ontvangen.');
        return;
      }

      // Check if user is confirmed
      if (!data.user.email_confirmed_at && data.user.email !== 'admin@admin') {
        setError('Je email is nog niet bevestigd. Check je inbox of bevestig je email in Supabase dashboard.');
        return;
      }

      // Als admin@admin inlogt, zorg dat admin rol bestaat
      if (email.toLowerCase() === 'admin@admin') {
        try {
          const roleResponse = await fetch('/api/users/ensure-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!roleResponse.ok) {
            console.warn('Could not ensure admin role, but continuing login');
          }
        } catch (err) {
          console.error('Error ensuring admin role:', err);
          // Continue anyway - user can still login
        }
      }

      // Wacht even zodat de session goed is ingesteld
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verifieer dat we ingelogd zijn (client-side)
      const { data: { user: verifyUser }, error: verifyError } = await supabase.auth.getUser();
      
      console.log('Verification:', { verifyUser, verifyError });

      if (!verifyUser) {
        setError('Login succesvol maar session niet gevonden. Probeer opnieuw.');
        console.error('No user found after login');
        return;
      }

      console.log('Login succesvol, redirecting...', verifyUser.email);

      // Haal de session op om cookies te forceren
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session ? 'Found' : 'Not found');

      if (!session) {
        setError('Session niet gevonden na login. Probeer opnieuw.');
        return;
      }

      // Wacht nog even zodat cookies worden gezet
      await new Promise(resolve => setTimeout(resolve, 500));

      // Forceer een volledige page reload om de session te synchroniseren
      // Dit zorgt ervoor dat de middleware de nieuwe session ziet
      window.location.href = '/';
    } catch (err: any) {
      console.error('Unexpected login error:', err);
      setError(err.message || 'Er is een onverwachte fout opgetreden bij het inloggen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-center">SocialFind Prioriteiten Dashboard</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Log in om toegang te krijgen
          </p>
        </div>
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
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
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            onClick={(e) => {
              console.log('Button clicked');
              if (!email || !password) {
                console.log('Missing email or password');
                e.preventDefault();
                setError('Vul email en wachtwoord in');
              }
            }}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Inloggen...' : 'Inloggen'}
          </button>
          {loading && (
            <div className="text-center text-sm text-muted-foreground">
              Bezig met inloggen...
            </div>
          )}
          <div className="text-center text-xs text-muted-foreground mt-2">
            <a href="/test-supabase" className="text-blue-500 hover:underline">
              Test Supabase verbinding
            </a>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Nog geen account?{' '}
            <a href="/register" className="text-primary hover:underline">
              Maak er een aan
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}

