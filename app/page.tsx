import { MultiStepBookingForm } from '@/components/booking';
import { HeroLogo } from '@/components/ui';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header with Logo Only */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-center">
          <HeroLogo />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <MultiStepBookingForm />
      </div>

      {/* Footer with Admin Access */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500 mb-4">
            <p>© 2024 CeritaKita Studio. All rights reserved.</p>
            <p className="mt-1">Booking sesi foto profesional dengan layanan terbaik</p>
          </div>
          
          {/* Admin Login - Bottom Center */}
          <div className="text-center pt-4 border-t border-gray-100">
            <a 
              href="/admin" 
              className="text-xs font-medium text-gray-400 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Administrator
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
