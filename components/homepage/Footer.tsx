import Link from 'next/link';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-olive-900 text-cream-200">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="inline-block mb-6">
                            <h3 className="font-display text-3xl text-cream-100 tracking-wider">
                                CERITAKITA
                            </h3>
                            <p className="text-cream-400 text-xs tracking-[0.3em] uppercase">
                                Photography
                            </p>
                        </Link>
                        <p className="text-cream-300/70 leading-relaxed max-w-md">
                            Mengabadikan momen berharga Anda dengan sentuhan artistik yang timeless.
                            Setiap foto adalah cerita yang akan dikenang selamanya.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-cream-100 font-display text-lg tracking-wider mb-6">
                            Explore
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="#about" className="text-cream-300/70 hover:text-gold-400 transition-colors text-sm">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="#packages" className="text-cream-300/70 hover:text-gold-400 transition-colors text-sm">
                                    Packages
                                </Link>
                            </li>
                            <li>
                                <Link href="#gallery" className="text-cream-300/70 hover:text-gold-400 transition-colors text-sm">
                                    Gallery
                                </Link>
                            </li>
                            <li>
                                <Link href="/booking" className="text-cream-300/70 hover:text-gold-400 transition-colors text-sm">
                                    Book a Session
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-cream-100 font-display text-lg tracking-wider mb-6">
                            Get in Touch
                        </h4>
                        <ul className="space-y-3 text-cream-300/70 text-sm">
                            <li>hello@ceritakita.studio</li>
                            <li>+62 812 3456 7890</li>
                            <li>Jakarta, Indonesia</li>
                        </ul>

                        {/* Social Links */}
                        <div className="flex gap-4 mt-6">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 border border-cream-300/30 flex items-center justify-center hover:border-gold-400 hover:text-gold-400 transition-colors"
                                aria-label="Instagram"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                            <a
                                href="https://wa.me/6281234567890"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 border border-cream-300/30 flex items-center justify-center hover:border-gold-400 hover:text-gold-400 transition-colors"
                                aria-label="WhatsApp"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-cream-300/10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-cream-400/60 text-sm">
                        © {currentYear} CeritaKita Studio. All rights reserved.
                    </p>

                    {/* Admin Link - Subtle */}
                    <Link
                        href="/admin"
                        className="text-cream-400/40 hover:text-cream-300 text-xs transition-colors flex items-center gap-1"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Admin
                    </Link>
                </div>
            </div>
        </footer>
    );
}
