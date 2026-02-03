'use client';

import { useEffect } from 'react';

/**
 * Component that triggers background data preload when the page loads
 * This ensures data is ready when user navigates to different pages
 */
export function PreloadTrigger() {
  useEffect(() => {
    // Trigger preload after a short delay to not block initial page load
    const timer = setTimeout(() => {
      fetch('/api/recruitee/preload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(err => {
        // Silent fail - preload is optional
        console.debug('Preload error (non-blocking):', err);
      });
    }, 1000); // Wait 1 second after page load

    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
}

