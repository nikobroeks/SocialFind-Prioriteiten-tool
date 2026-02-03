'use client';

import { useEffect, useRef } from 'react';

/**
 * Component that automatically syncs Recruitee data every 5 minutes
 * when the user is on the application
 * Includes rate limiting to prevent too many requests
 */
export function BackgroundSync() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);
  const lastSyncRef = useRef<number>(0);
  const syncInProgressRef = useRef(false);

  useEffect(() => {
    // Function to trigger preload with rate limiting
    const syncData = async () => {
      if (!isActiveRef.current || syncInProgressRef.current) return;
      
      // Rate limiting: don't sync more than once per 4 minutes
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncRef.current;
      const MIN_SYNC_INTERVAL = 4 * 60 * 1000; // 4 minutes minimum

      if (timeSinceLastSync < MIN_SYNC_INTERVAL) {
        console.log(`[BACKGROUND SYNC] Rate limited. Next sync in ${Math.ceil((MIN_SYNC_INTERVAL - timeSinceLastSync) / 1000)}s`);
        return;
      }

      // Check if cache is still fresh before syncing
      try {
        const cacheCheck = await fetch('/api/recruitee/preload');
        if (cacheCheck.ok) {
          const cacheData = await cacheCheck.json();
          if (cacheData.cached && cacheData.valid) {
            const ageMinutes = cacheData.age_minutes || 0;
            // If cache is less than 3 minutes old, skip sync
            if (ageMinutes < 3) {
              console.log(`[BACKGROUND SYNC] Cache still fresh (${ageMinutes} min old), skipping sync`);
              lastSyncRef.current = now;
              return;
            }
          }
        }
      } catch (err) {
        console.warn('[BACKGROUND SYNC] Cache check failed, proceeding with sync');
      }

      syncInProgressRef.current = true;
      lastSyncRef.current = now;
      
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
      } finally {
        syncInProgressRef.current = false;
      }
    };

    // Initial sync after 60 seconds (to not interfere with initial page load)
    const initialTimer = setTimeout(() => {
      syncData();
    }, 60000); // 60 seconds

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

