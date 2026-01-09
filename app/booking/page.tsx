import { MultiStepBookingForm } from '@/components/booking';
import Link from 'next/link';

export default function BookingPage() {
    return (
        <main className="min-h-screen bg-cream-100">
            {/* Header with Logo */}
            <header className="bg-olive-900 border-b border-olive-700 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="block">
                        <h1 className="font-display text-xl md:text-2xl text-cream-100 tracking-wider">
                            CERITAKITA
                        </h1>
                        <p className="text-cream-400 text-[8px] tracking-[0.2em] uppercase">
                            Photography
                        </p>
                    </Link>

                    <Link
                        href="/"
                        className="text-cream-300 hover:text-gold-400 text-sm flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Home
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
                <MultiStepBookingForm />
            </div>

            {/* Footer */}
            <footer className="bg-olive-900 border-t border-olive-700 mt-12">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="text-center text-sm text-cream-300/70 mb-4">
                        <p>© 2024 CeritaKita Studio. All rights reserved.</p>
                        <p className="mt-1">Booking sesi foto profesional dengan layanan terbaik</p>
                    </div>

                    {/* Admin Login */}
                    <div className="text-center pt-4 border-t border-olive-700">
                        <a
                            href="/admin"
                            className="text-xs font-medium text-cream-400/50 hover:text-gold-400 transition-colors inline-flex items-center gap-1"
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
