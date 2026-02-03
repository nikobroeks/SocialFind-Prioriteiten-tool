'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15 * 60 * 1000, // 15 minutes - data blijft lang "fresh"
            gcTime: 60 * 60 * 1000, // 60 minutes cache
            refetchOnWindowFocus: false, // Geen refetch bij focus
            refetchOnMount: false, // Gebruik cache als beschikbaar
            refetchOnReconnect: false, // Geen refetch bij reconnect
            refetchInterval: false, // Geen automatische polling
            retry: 1, // Minder retries
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

