import { TestSupabasePageClient } from '@/components/test-supabase-page-client';

// Force dynamic rendering to prevent build-time errors with missing env vars
export const dynamic = 'force-dynamic';

export default function TestSupabasePage() {
  return <TestSupabasePageClient />;
}

