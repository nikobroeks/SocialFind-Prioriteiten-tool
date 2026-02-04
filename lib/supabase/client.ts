import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

function getSupabaseClient() {
  // Lazy initialization - only create client when actually used (not during build/prerender)
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    // Gebruik createBrowserClient voor betere cookie synchronisatie
    supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}

// Export a proxy that lazily initializes the client when accessed
// This prevents errors during build/prerender when env vars might not be available
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
}) as ReturnType<typeof createBrowserClient<Database>>;

