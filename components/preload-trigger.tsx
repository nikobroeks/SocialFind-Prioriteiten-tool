'use client';

import { useEffect, useRef } from 'react';

/**
 * Component that triggers background data preload when the page loads
 * This ensures data is ready when user navigates to different pages
 * Includes rate limiting to prevent too many requests
 */
export function PreloadTrigger() {
  const hasTriggeredRef = useRef(false);
  const lastTriggerRef = useRef<number>(0);

  useEffect(() => {
    // Only trigger once per session
    if (hasTriggeredRef.current) return;

    // Check if we triggered recently (within last 5 minutes)
    const now = Date.now();
    const timeSinceLastTrigger = now - lastTriggerRef.current;
    const MIN_TRIGGER_INTERVAL = 5 * 60 * 1000; // 5 minutes

    if (timeSinceLastTrigger < MIN_TRIGGER_INTERVAL) {
      console.log('[PRELOAD TRIGGER] Skipping - triggered recently');
      return;
    }

    // Check cache first before triggering preload
    const checkCacheAndPreload = async () => {
      try {
        const cacheCheck = await fetch('/api/recruitee/preload');
        if (cacheCheck.ok) {
          const cacheData = await cacheCheck.json();
          if (cacheData.cached && cacheData.valid) {
            const ageMinutes = cacheData.age_minutes || 0;
            // If cache is less than 4 minutes old, skip preload
            if (ageMinutes < 4) {
              console.log(`[PRELOAD TRIGGER] Cache still fresh (${ageMinutes} min old), skipping`);
              hasTriggeredRef.current = true;
              lastTriggerRef.current = now;
              return;
            }
          }
        }
      } catch (err) {
        console.warn('[PRELOAD TRIGGER] Cache check failed');
      }

      // Cache expired or not found - trigger preload
      console.log('[PRELOAD TRIGGER] Triggering preload...');
      lastTriggerRef.current = now;
      hasTriggeredRef.current = true;

      fetch('/api/recruitee/preload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(err => {
        // Silent fail - preload is optional
        console.debug('Preload error (non-blocking):', err);
      });
    };

    // Trigger after a delay to not block initial page load
    const timer = setTimeout(() => {
      checkCacheAndPreload();
    }, 2000); // Wait 2 seconds after page load

    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
}

