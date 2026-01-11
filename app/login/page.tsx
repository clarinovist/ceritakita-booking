"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

// Separate component for search params to wrap in Suspense
function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/admin";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Username atau password salah!");
                setLoading(false);
            } else {
                router.push(callbackUrl);
                router.refresh(); // Ensure session state is updated
            }
        } catch {
            setError("Terjadi kesalahan saat login");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in backdrop-blur-sm">
                    <AlertCircle size={18} className="text-red-400 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-cream-200 uppercase tracking-widest ml-1">
                        Username
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-olive-600 group-focus-within:text-gold-500 transition-colors">
                            <User size={18} />
                        </div>
                        <input
                            required
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            className="w-full pl-12 pr-4 py-3.5 bg-cream-50/5 border border-cream-200/10 rounded-xl text-cream-100 placeholder:text-cream-400/30 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all duration-300"
                            placeholder="username"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-cream-200 uppercase tracking-widest ml-1">
                        Password
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-olive-600 group-focus-within:text-gold-500 transition-colors">
                            <Lock size={18} />
                        </div>
                        <input
                            required
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="w-full pl-12 pr-12 py-3.5 bg-cream-50/5 border border-cream-200/10 rounded-xl text-cream-100 placeholder:text-cream-400/30 focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none transition-all duration-300"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-cream-400/50 hover:text-cream-200 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="peersr-only h-4 w-4 opacity-0 absolute"
                        />
                        <div className={`w-4 h-4 rounded border ${rememberMe ? 'bg-gold-500 border-gold-500' : 'border-cream-300/30'} flex items-center justify-center transition-all`}>
                            {rememberMe && <div className="w-2 h-2 bg-olive-900 rounded-sm" />}
                        </div>
                    </div>
                    <span className="text-cream-300 group-hover:text-cream-200 transition-colors select-none">Ingat saya</span>
                </label>
                <Link
                    href="#"
                    className="text-gold-400 hover:text-gold-300 transition-colors font-medium text-xs uppercase tracking-wider"
                    onClick={(e) => { e.preventDefault(); alert("Silakan hubungi administrator sistem untuk reset password."); }}
                >
                    Lupa Password?
                </Link>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-500 hover:bg-gold-400 text-olive-900 font-bold py-4 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,184,150,0.3)] hover:scale-[1.01] active:scale-[0.98] flex justify-center items-center gap-2 uppercase tracking-[0.15em] text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Memproses...</span>
                    </>
                ) : (
                    "Masuk Dashboard"
                )}
            </button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-olive-900 relative overflow-hidden flex items-center justify-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url('/images/hero_photography.png')`,
                        filter: 'grayscale(100%) contrast(120%)'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-olive-900 via-olive-900/80 to-olive-900/30" />
            </div>

            {/* Content */}
            <div className="relative w-full max-w-md px-6 animate-slide-up">
                <div className="bg-olive-800/50 backdrop-blur-md border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/50">
                    <div className="text-center mb-10">
                        <div className="inline-block mb-6 p-4 rounded-full bg-olive-900/50 border border-white/5 shadow-inner">
                            <Logo size="lg" showText={false} className="scale-125" />
                        </div>
                        <h1 className="font-display text-3xl font-bold text-cream-100 mb-2">
                            Welcome Back
                        </h1>
                        <p className="font-serif text-cream-300 text-lg">
                            Masuk untuk mengelola studio
                        </p>
                    </div>

                    <Suspense fallback={
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-gold-400" />
                        </div>
                    }>
                        <LoginForm />
                    </Suspense>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-cream-400 hover:text-white transition-colors text-sm group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span>
                            Kembali ke Halaman Utama
                        </Link>
                    </div>
                </div>

                <p className="text-center text-cream-400/30 text-xs mt-8 font-mono">
                    &copy; {new Date().getFullYear()} CeritaKita Studio. Internal System.
                </p>
            </div>
        </div>
    );
}
