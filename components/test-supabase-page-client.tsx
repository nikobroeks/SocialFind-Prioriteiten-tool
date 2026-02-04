'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function TestSupabasePageClient() {
  const [status, setStatus] = useState<string>('Niet getest');
  const [details, setDetails] = useState<any>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  const testConnection = async () => {
    setStatus('Testen...');
    try {
      // Test 1: Check environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('Env vars:', { 
        url: url ? '✅ Set' : '❌ Missing',
        key: key ? '✅ Set' : '❌ Missing'
      });

      // Test 2: Try to get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session:', { sessionData, sessionError });

      // Test 3: Try to sign in with test credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@admin',
        password: 'admin',
      });
      console.log('Sign in test:', { signInData, signInError });

      setDetails({
        env: { url: !!url, key: !!key },
        session: { data: sessionData, error: sessionError },
        signIn: { data: signInData, error: signInError },
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setStatus(`❌ Error: Gebruiker bestaat niet. Klik op "Maak admin gebruiker aan" hieronder.`);
        } else {
          setStatus(`❌ Error: ${signInError.message}`);
        }
      } else if (signInData?.user) {
        setStatus(`✅ Login succesvol! User: ${signInData.user.email}`);
      } else {
        setStatus('⚠️ Geen error maar ook geen user data');
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setStatus(`❌ Exception: ${err.message}`);
      setDetails({ error: err.message, stack: err.stack });
    }
  };

  const createAdminUser = async () => {
    setCreatingUser(true);
    setStatus('Gebruiker aanmaken...');
    try {
      // Maak gebruiker aan
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@admin',
        password: 'admin',
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) {
        setStatus(`❌ Fout bij aanmaken: ${signUpError.message}`);
        setDetails({ signUpError });
        return;
      }

      if (!signUpData.user) {
        setStatus('❌ Geen user data ontvangen na aanmaken');
        return;
      }

      // Wacht even
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Probeer direct in te loggen
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@admin',
        password: 'admin',
      });

      if (signInError) {
        setStatus(`⚠️ Gebruiker aangemaakt maar kan niet inloggen: ${signInError.message}. Mogelijk moet je email bevestiging uitschakelen in Supabase.`);
        setDetails({ 
          signUp: signUpData,
          signInError,
          note: 'Ga naar Supabase Dashboard > Authentication > Settings en zet "Enable email confirmations" UIT'
        });
      } else {
        setStatus(`✅ Gebruiker aangemaakt en ingelogd! Email: ${signInData.user?.email}`);
        setDetails({ signUp: signUpData, signIn: signInData });
      }
    } catch (err: any) {
      console.error('Create user error:', err);
      setStatus(`❌ Exception: ${err.message}`);
      setDetails({ error: err.message });
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="space-y-4 mb-4">
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Supabase Connection
        </button>

        <button
          onClick={createAdminUser}
          disabled={creatingUser}
          className="ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {creatingUser ? 'Aanmaken...' : 'Maak admin gebruiker aan (admin@admin / admin)'}
        </button>
      </div>

      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>

      {details && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="font-semibold mb-2">Details:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 bg-blue-50 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Environment Variables:</h2>
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        <h2 className="font-semibold mb-2">Instructies:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Klik op "Test Supabase Connection" om te testen of je kunt inloggen</li>
          <li>Als je "Invalid login credentials" krijgt, klik dan op "Maak admin gebruiker aan"</li>
          <li>Als de gebruiker wordt aangemaakt maar je nog steeds niet kunt inloggen:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Ga naar je Supabase Dashboard</li>
              <li>Ga naar Authentication → Settings</li>
              <li>Zet "Enable email confirmations" UIT</li>
              <li>Of bevestig de gebruiker handmatig in Authentication → Users</li>
            </ul>
          </li>
          <li>Na het aanmaken kun je inloggen met: <strong>admin@admin</strong> / <strong>admin</strong></li>
        </ol>
      </div>
    </main>
  );
}

