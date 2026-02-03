'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('Niet getest');
  const [details, setDetails] = useState<any>(null);

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
        setStatus(`❌ Error: ${signInError.message}`);
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

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <button
        onClick={testConnection}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Supabase Connection
      </button>

      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>

      {details && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Details:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 bg-blue-50 p-4 rounded">
        <h2 className="font-semibold mb-2">Environment Variables:</h2>
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
        <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
      </div>
    </main>
  );
}

