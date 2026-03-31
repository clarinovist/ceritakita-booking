'use client';

import { useEffect } from 'react';

export function DeploymentMismatchHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || '';
      
      const isActionError = 
        message.includes('Failed to find Server Action') || 
        message.includes('Action not found');

      if (isActionError) {
        console.warn('Server Action mismatch detected in background. Refreshing for latest build...');
        
        // Use assign to ensure a full reload from server
        setTimeout(() => {
          window.location.assign(window.location.href);
        }, 500);
      }
    };

    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      if (message.includes('Failed to find Server Action') || message.includes('Action not found')) {
        console.warn('Server Action error detected. Refreshing...');
        window.location.assign(window.location.href);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
