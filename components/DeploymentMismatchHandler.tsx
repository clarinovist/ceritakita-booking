'use client';

import { useEffect } from 'react';
import { reloadForDeploymentMismatch } from '@/lib/client/deployment-recovery';

function isDeploymentMismatchMessage(message: string) {
  return (
    message.includes('Failed to find Server Action') ||
    message.includes('Action not found')
  );
}

export function DeploymentMismatchHandler() {
  useEffect(() => {
    const triggerRecovery = (message: string, context: string) => {
      if (!isDeploymentMismatchMessage(message)) {
        return;
      }

      const didReload = reloadForDeploymentMismatch();
      if (didReload) {
        console.warn(`${context} Refreshing for latest build...`);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || '';
      triggerRecovery(message, 'Server Action mismatch detected in background.');
    };

    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      triggerRecovery(message, 'Server Action error detected.');
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
