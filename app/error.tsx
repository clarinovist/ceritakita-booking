'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isActionError = 
    error.message?.includes('Failed to find Server Action') || 
    error.message?.includes('Action not found') ||
    error.digest?.includes('NEXT_REDIRECT'); // Some versions might hide message but have digest

  useEffect(() => {
    // If the error is regarding a missing server action due to a new deployment, auto-reload
    if (isActionError) {
      console.warn('Server Action mismatch detected. Refreshing for latest build in 1s...');
      const timer = setTimeout(() => {
        window.location.assign(window.location.href);
      }, 1000);
      return () => clearTimeout(timer);
    }
    // Log the error
    console.error('Unhandled application error:', error);
  }, [error, isActionError]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="bg-orange-500/10 p-3 rounded-full mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
      </div>
      
      <h2 className="text-2xl font-bold mb-4 text-neutral-800">
        {isActionError ? 'Sistem Sedang Memperbarui' : 'Opps, sepertinya ada sedikit kendala!'}
      </h2>
      
      <p className="text-neutral-600 mb-6 max-w-md">
        {isActionError 
          ? 'Kami mendeteksi adanya pembaruan sistem yang diperlukan agar aplikasi berjalan lancar. Halaman akan segera dimuat ulang.'
          : 'Kami baru saja melakukan pembaruan sistem atau mendeteksi adanya error. Silakan muat ulang halaman ini untuk mendapatkan versi terbaru.'}
      </p>
      
      <button
        onClick={() => {
          window.location.assign(window.location.href);
        }}
        className="px-6 py-2 bg-[#8C8F70] text-white rounded-md hover:bg-[#72755a] transition-colors flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        Muat Ulang Sekarang
      </button>
    </div>
  );
}
