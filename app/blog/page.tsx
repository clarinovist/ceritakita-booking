import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog CeritaKita Studio — Tips Foto, Harga, & Panduan | Solo",
  description: "Artikel seputar fotografi: tips foto, harga prewedding, self photo studio, wisuda, keluarga, dan panduan lengkap untuk sesi foto di Solo & Sukoharjo.",
  alternates: { canonical: "https://ceritakitastudio.site/blog" },
};

const articles = [
  { slug: "studio-foto-solo", title: "Studio Foto Murah di Solo: Panduan Lengkap 2026", excerpt: "Cari studio foto murah di Solo? CeritaKita Studio Sukoharjo mulai Rp150K.", date: "14 Juni 2026", readTime: "5 menit" },
  { slug: "self-photo-sukoharjo", title: "Self Photo Studio di Sukoharjo: Seru, Mudah, Mulai Rp150K", excerpt: "Pengalaman self photo seru di studio profesional. Include makeup, kostum adat Jawa.", date: "14 Juni 2026", readTime: "4 menit" },
  { slug: "harga-prewedding-solo", title: "Harga Foto Prewedding Solo 2026: Panduan Lengkap + Tips Hemat", excerpt: "Daftar harga foto prewedding di Solo 2026. Paket indoor & outdoor mulai Rp400K.", date: "14 Juni 2026", readTime: "6 menit" },
  { slug: "wisuda-solo", title: "Foto Wisuda Solo: Panduan Lengkap + Harga 2026", excerpt: "Foto wisuda di Solo mulai Rp150K. Studio & outdoor.", date: "14 Juni 2026", readTime: "4 menit" },
  { slug: "foto-keluarga-solo", title: "Foto Keluarga Solo: Abadikan Momen Berharga Bersama", excerpt: "Foto keluarga di Solo mulai Rp300K untuk 6 orang.", date: "14 Juni 2026", readTime: "4 menit" },
  { slug: "birthday-photo-solo", title: "Foto Birthday Solo: Abadikan Momen Spesial Ulang Tahun", excerpt: "Foto birthday di Solo mulai Rp150K.", date: "14 Juni 2026", readTime: "3 menit" },
  { slug: "pas-foto-solo", title: "Pas Foto Solo: Foto Dokumen Profesional Mulai Rp40K", excerpt: "Pas foto di Solo mulai Rp40K untuk semua kebutuhan dokumen.", date: "14 Juni 2026", readTime: "3 menit" },
  { slug: "studio-foto-klaten", title: "Studio Foto di Klaten: Panduan Lengkap + Harga 2026", excerpt: "Cari studio foto di Klaten? CeritaKita Studio Sukoharjo cuma 25 menit. Mulai Rp150K.", date: "7 Juli 2026", readTime: "5 menit" },
  { slug: "studio-foto-wonogiri", title: "Studio Foto di Wonogiri: Panduan Lengkap + Harga 2026", excerpt: "Cari studio foto di Wonogiri? CeritaKita Studio Sukoharjo cuma 30 menit. Mulai Rp150K.", date: "7 Juli 2026", readTime: "5 menit" },

];

export default function BlogPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="font-display text-4xl md:text-5xl text-cream-100 tracking-wide mb-4">Blog</h1>
        <p className="text-cream-300 mb-12">Tips, panduan, dan inspirasi seputar dunia fotografi di Solo & Sukoharjo.</p>
        <div className="space-y-8">
          {articles.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`} className="block border border-cream-300/20 p-6 hover:border-gold-400/50 transition-colors group">
              <h2 className="font-display text-xl md:text-2xl text-cream-100 group-hover:text-gold-400 transition-colors mb-2">{article.title}</h2>
              <p className="text-cream-400 text-sm mb-3">{article.date} · {article.readTime} baca</p>
              <p className="text-cream-300">{article.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
