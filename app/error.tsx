'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // If the error is regarding a missing server action due to a new deployment, auto-reload
    if (error.message && error.message.includes('Failed to find Server Action')) {
      window.location.reload();
      return;
    }
    // Log the error
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <h2 className="text-2xl font-bold mb-4 text-neutral-800">Opps, sepertinya ada sedikit kendala!</h2>
      <p className="text-neutral-600 mb-6 max-w-md">
        Kami baru saja melakukan pembaruan sistem atau mendeteksi adanya error. Silakan muat ulang halaman ini.
      </p>
      <button
        onClick={() => {
          window.location.reload();
        }}
        className="px-6 py-2 bg-[#8C8F70] text-white rounded-md hover:bg-[#72755a] transition-colors"
      >
        Muat Ulang / Refresh Halaman
      </button>
    </div>
  );
}
