/**
 * instrumentation.ts
 * 
 * Next.js Instrumentation hook.
 * Runs once when the server starts.
 * 
 * Used here to suppress benign "Failed to find Server Action" errors
 * from being logged to stderr, which prevents Coolify from sending
 * unnecessary Telegram alerts for deployment version mismatches.
 */

export async function register() {
  // Only patch in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs' || !process.env.NEXT_RUNTIME) {
    const originalStderrWrite = process.stderr.write.bind(process.stderr);

    // These are benign errors that occur when a client with an old build
    // tries to call a Server Action that no longer exists after deployment.
    // The client-side DeploymentMismatchHandler auto-refreshes the page.
    const SUPPRESSED_PATTERNS = [
      'Failed to find Server Action',
      'failed to pipe response',
    ];

    process.stderr.write = function (
      chunk: string | Uint8Array,
      encodingOrCallback?: BufferEncoding | ((err?: Error | null) => void),
      callback?: (err?: Error | null) => void
    ): boolean {
      const message = typeof chunk === 'string' ? chunk : chunk.toString();

      // Check if this is a benign error we want to suppress
      const isSuppressed = SUPPRESSED_PATTERNS.some(pattern => message.includes(pattern));

      if (isSuppressed) {
        // Log as debug-level info instead of error, so it doesn't trigger alerts
        // but is still visible in logs for debugging if needed
        process.stdout.write(`[suppressed-warning] ${message}`);
        return true;
      }

      // Let all other stderr output through normally
      if (typeof encodingOrCallback === 'function') {
        return originalStderrWrite(chunk, encodingOrCallback);
      }
      return originalStderrWrite(chunk, encodingOrCallback, callback);
    } as typeof process.stderr.write;
  }
}
