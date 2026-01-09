'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-olive-900/95 backdrop-blur-sm py-4' : 'bg-transparent py-6'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Left Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            href="#about"
                            className="text-cream-200 hover:text-gold-400 transition-colors text-sm tracking-[0.2em] uppercase"
                        >
                            About
                        </Link>
                        <Link
                            href="#packages"
                            className="text-cream-200 hover:text-gold-400 transition-colors text-sm tracking-[0.2em] uppercase"
                        >
                            Services
                        </Link>
                        <Link
                            href="#gallery"
                            className="text-cream-200 hover:text-gold-400 transition-colors text-sm tracking-[0.2em] uppercase"
                        >
                            Gallery
                        </Link>
                    </div>

                    {/* Center Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="block">
                            <h1 className="font-display text-2xl md:text-3xl text-cream-100 tracking-wider">
                                CERITAKITA
                            </h1>
                            <p className="text-cream-300 text-[10px] tracking-[0.3em] text-center uppercase">
                                Photography
                            </p>
                        </Link>
                    </div>

                    {/* Right CTA */}
                    <div className="hidden md:flex items-center">
                        <Link
                            href="/booking"
                            className="border border-cream-300/50 text-cream-100 hover:bg-cream-100 hover:text-olive-900 px-6 py-2.5 text-sm tracking-[0.15em] uppercase transition-all duration-300"
                        >
                            Let&apos;s Connect
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-cream-100 p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden mt-6 pb-6 border-t border-cream-300/20 pt-6">
                        <div className="flex flex-col space-y-4">
                            <Link
                                href="#about"
                                className="text-cream-200 hover:text-gold-400 transition-colors text-sm tracking-[0.2em] uppercase"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                About
                            </Link>
                            <Link
                                href="#packages"
                                className="text-cream-200 hover:text-gold-400 transition-colors text-sm tracking-[0.2em] uppercase"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Services
                            </Link>
                            <Link
                                href="#gallery"
                                className="text-cream-200 hover:text-gold-400 transition-colors text-sm tracking-[0.2em] uppercase"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Gallery
                            </Link>
                            <Link
                                href="/booking"
                                className="border border-cream-300/50 text-cream-100 hover:bg-cream-100 hover:text-olive-900 px-6 py-3 text-sm tracking-[0.15em] uppercase transition-all duration-300 text-center mt-4"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Let&apos;s Connect
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
