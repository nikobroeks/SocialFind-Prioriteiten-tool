import { DebugPageClient } from '@/components/debug-page-client';

// Force dynamic rendering to prevent build-time errors with missing env vars
export const dynamic = 'force-dynamic';

export default function DebugPage() {
  return <DebugPageClient />;
}

