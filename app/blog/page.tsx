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
  { slug: "studio-foto-sragen", title: "Studio Foto di Sragen: Panduan Lengkap + Harga 2026", excerpt: "Cari studio foto di Sragen? CeritaKita Studio Sukoharjo cuma 35 menit. Mulai Rp150K.", date: "14 Juli 2026", readTime: "5 menit" },
  { slug: "studio-foto-karanganyar", title: "Studio Foto di Karanganyar: Panduan Lengkap + Harga 2026", excerpt: "Cari studio foto di Karanganyar? CeritaKita Studio Sukoharjo cuma 20 menit. Mulai Rp150K.", date: "14 Juli 2026", readTime: "5 menit" },
  // Batch 3
  { slug: "studio-foto-boyolali", title: "Studio Foto di Boyolali: Panduan Lengkap + Harga 2026", excerpt: "Cari studio foto di Boyolali? CeritaKita Studio Sukoharjo cuma 30 menit. Mulai Rp150K.", date: "21 Juli 2026", readTime: "5 menit" },
  { slug: "studio-foto-klaten-murah", title: "Studio Foto Murah di Klaten: Harga Mulai Rp40K", excerpt: "Cari studio foto murah di Klaten? CeritaKita Studio mulai Rp40K untuk pas foto.", date: "21 Juli 2026", readTime: "4 menit" },
  { slug: "fotografer-wonogiri", title: "Fotografer Wonogiri: Jasa Foto Profesional Mulai Rp150K", excerpt: "Butuh fotografer di Wonogiri? CeritaKita Studio sediakan fotografer profesional mulai Rp150K.", date: "21 Juli 2026", readTime: "5 menit" },
  // Batch 4
  { slug: "foto-wisuda-sragen", title: "Foto Wisuda Sragen: Panduan Lengkap + Harga 2026", excerpt: "Foto wisuda di Sragen mulai Rp150K. Studio & outdoor, hasil profesional.", date: "28 Juli 2026", readTime: "4 menit" },
  { slug: "self-photo-klaten", title: "Self Photo Studio Klaten: Seru, Mudah, Mulai Rp150K", excerpt: "Self photo studio dekat Klaten mulai Rp150K. Include makeup dan kostum adat Jawa.", date: "28 Juli 2026", readTime: "4 menit" },
  { slug: "foto-prewedding-wonogiri", title: "Foto Prewedding Wonogiri: Panduan + Harga 2026", excerpt: "Foto prewedding dekat Wonogiri mulai Rp400K. Indoor & outdoor.", date: "28 Juli 2026", readTime: "5 menit" },
  // Batch 5
  { slug: "foto-keluarga-sragen", title: "Foto Keluarga Sragen: Abadikan Momen Berharga", excerpt: "Foto keluarga dekat Sragen mulai Rp300K untuk 6 orang. Fotografer profesional.", date: "4 Agustus 2026", readTime: "4 menit" },
  { slug: "pas-foto-solo-murah", title: "Pas Foto Solo Murah: Mulai Rp40K | CeritaKita Studio", excerpt: "Pas foto murah di Solo mulai Rp40K. Untuk KTP, SIM, visa, ijazah.", date: "4 Agustus 2026", readTime: "3 menit" },
  { slug: "foto-wisuda-solo-2026", title: "Foto Wisuda Solo 2026: Panduan Terbaru + Harga", excerpt: "Foto wisuda di Solo 2026 mulai Rp150K. Tips persiapan & rekomendasi studio.", date: "4 Agustus 2026", readTime: "5 menit" },
  // Batch 6
  { slug: "self-photo-solo-raya", title: "Self Photo Solo Raya: Panduan Lengkap 2026", excerpt: "Self photo terjangkau di Solo Raya mulai Rp150K. Sukoharjo, Klaten, Wonogiri.", date: "11 Agustus 2026", readTime: "4 menit" },
  { slug: "tips-foto-studio-pertama-kali", title: "Tips Foto Studio Pertama Kali: Panduan Pemula 2026", excerpt: "Baru pertama kali foto studio? Ini tips lengkap agar hasilnya maksimal.", date: "11 Agustus 2026", readTime: "5 menit" },
  { slug: "persiapan-foto-prewedding", title: "Persiapan Foto Prewedding: Checklist Lengkap 2026", excerpt: "Mau foto prewedding? Ini checklist persiapan dari kostum hingga lokasi.", date: "11 Agustus 2026", readTime: "6 menit" },
  // Batch 7
  { slug: "harga-foto-wisuda-2026", title: "Harga Foto Wisuda 2026: Perbandingan Solo Raya", excerpt: "Daftar harga foto wisuda 2026 di Solo, Sukoharjo, Klaten. Mulai Rp150K.", date: "18 Agustus 2026", readTime: "5 menit" },
  { slug: "ide-pose-self-photo", title: "20 Ide Pose Self Photo Studio yang Instagramable", excerpt: "Inspirasi pose self photo yang estetik dan Instagramable. Cocok untuk pemula!", date: "18 Agustus 2026", readTime: "4 menit" },
  { slug: "perbedaan-self-photo-dan-foto-studio", title: "Self Photo vs Foto Studio: Mana yang Lebih Cocok?", excerpt: "Bingung pilih self photo atau foto studio biasa? Ini perbedaannya.", date: "18 Agustus 2026", readTime: "4 menit" },
  { slug: "foto-studio-untuk-cv-kerja", title: "Foto Profesional untuk CV Kerja: Tips & Harga 2026", excerpt: "Butuh foto profesional untuk CV? Mulai Rp40K di CeritaKita Studio.", date: "18 Agustus 2026", readTime: "3 menit" },
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
