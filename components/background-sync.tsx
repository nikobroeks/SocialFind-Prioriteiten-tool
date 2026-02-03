'use client';

import { useEffect, useRef } from 'react';

/**
 * Component that automatically syncs Recruitee data every 5 minutes
 * when the user is on the application
 */
export function BackgroundSync() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    // Function to trigger preload
    const syncData = async () => {
      if (!isActiveRef.current) return;
      
      try {
        console.log('[BACKGROUND SYNC] Starting sync...');
        const response = await fetch('/api/recruitee/preload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[BACKGROUND SYNC] Sync completed:', {
            jobs: data.jobs,
            hires: data.hires,
            applications: data.applications,
          });
        } else {
          console.warn('[BACKGROUND SYNC] Sync failed:', response.status);
        }
      } catch (error) {
        console.error('[BACKGROUND SYNC] Sync error:', error);
      }
    };

    // Initial sync after 30 seconds (to not interfere with initial page load)
    const initialTimer = setTimeout(() => {
      syncData();
    }, 30000);

    // Then sync every 5 minutes
    intervalRef.current = setInterval(() => {
      syncData();
    }, 5 * 60 * 1000); // 5 minutes

    // Handle visibility change - pause sync when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
        console.log('[BACKGROUND SYNC] Tab hidden, pausing sync');
      } else {
        isActiveRef.current = true;
        console.log('[BACKGROUND SYNC] Tab visible, resuming sync');
        // Sync immediately when tab becomes visible again
        syncData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; // This component doesn't render anything
}

