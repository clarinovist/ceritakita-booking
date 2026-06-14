import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Pas Foto Solo 2026 — Foto Dokumen Mulai Rp40K | CeritaKita Studio",
  description: "Pas foto di Solo mulai Rp40K. Untuk nikah, visa, kerja, ijazah. Proses cepat, hasil profesional. CeritaKita Studio Sukoharjo.",
  keywords: "pas foto solo, pas foto murah solo, foto dokumen sukoharjo, pas foto terdekat, pas foto nikah solo, pas foto visa solo",
  openGraph: { title: "Pas Foto Solo 2026 — CeritaKita Studio", description: "Pas foto profesional mulai Rp40K untuk semua kebutuhan dokumen.", url: "https://ceritakitastudio.site/blog/pas-foto-solo", siteName: "CeritaKita Studio", locale: "id_ID", type: "article" },
  alternates: { canonical: "https://ceritakitastudio.site/blog/pas-foto-solo" },
};

const faqData = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Berapa harga pas foto di Solo?", acceptedAnswer: { "@type": "Answer", text: "Di CeritaKita Studio, pas foto mulai Rp40.000. Cute Pas Foto Rp125.000 (diskon dari Rp150.000)." } },
    { "@type": "Question", name: "Berapa lama proses pas foto?", acceptedAnswer: { "@type": "Answer", text: "Proses cepat, 10-15 menit sudah selesai. Bisa langsung cetak atau file digital." } },
    { "@type": "Question", name: "Ukuran pas foto apa saja yang tersedia?", acceptedAnswer: { "@type": "Answer", text: "Semua ukuran: 2x3, 3x4, 4x6, atau custom sesuai kebutuhan dokumen Anda." } },
    { "@type": "Question", name: "Apakah bisa pas foto untuk visa dan dokumen luar negeri?", acceptedAnswer: { "@type": "Answer", text: "Bisa! Kami melayani pas foto untuk visa, passport, dan dokumen internasional dengan background sesuai standar." } },
  ],
};

export default function PasFotoSoloPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={faqData} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" / "}<Link href="/blog" className="hover:text-gold-400">Blog</Link>{" / "}<span>Pas Foto</span>
        </nav>
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">Pas Foto Solo: Foto Dokumen Profesional Mulai Rp40K</h1>
        <p className="text-cream-300 text-sm mb-8">Terakhir diperbarui: 14 Juni 2026 · Waktu baca: 3 menit</p>
        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>Butuh pas foto untuk dokumen? Di <strong>CeritaKita Studio</strong>, pas foto di Solo mulai dari <strong>Rp40 ribu</strong> saja. Proses cepat, hasil profesional, untuk semua kebutuhan dokumen Anda.</p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Paket Pas Foto</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead><tr className="border-b border-cream-300/20 bg-olive-800"><th className="p-3 text-left text-cream-100">Paket</th><th className="p-3 text-left text-cream-100">Harga</th><th className="p-3 text-left text-cream-100">Include</th></tr></thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10"><td className="p-3">Pas Foto</td><td className="p-3 font-bold text-gold-400">Rp40.000</td><td className="p-3">Foto dokumen resmi, semua ukuran, cetak langsung</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Cute Pas Foto</td><td className="p-3 font-bold text-gold-400">Rp125.000 <span className="text-cream-400 line-through text-xs">Rp150.000</span></td><td className="p-3">Pas foto estetik dengan sentuhan makeup</td></tr>
                <tr><td className="p-3">Self Photo + Pas Foto</td><td className="p-3 font-bold text-gold-400">Rp150.000</td><td className="p-3">Kombinasi self photo + pas foto</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Kebutuhan Pas Foto yang Kami Layani</h2>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Pas foto nikah/pernikahan</strong> — Background merah/biru sesuai standar KUA</li>
            <li><strong>Pas foto visa & passport</strong> — Standar internasional (ICAO)</li>
            <li><strong>Pas foto kerja & CV</strong> — Professional look untuk melamar kerja</li>
            <li><strong>Pas foto ijazah</strong> — Untuk keperluan akademik</li>
            <li><strong>Pas foto lamaran</strong> — Untuk berkas nikah</li>
            <li><strong>Pas foto SKCK</strong> — Background biru sesuai standar kepolisian</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>
          <div className="space-y-4">
            <div><h3 className="font-bold text-cream-100">Berapa harga pas foto?</h3><p className="text-cream-300">Mulai Rp40.000 untuk pas foto standar. Cute Pas Foto Rp125.000.</p></div>
            <div><h3 className="font-bold text-cream-100">Berapa lama prosesnya?</h3><p className="text-cream-300">10-15 menit sudah selesai. Bisa langsung cetak atau file digital.</p></div>
            <div><h3 className="font-bold text-cream-100">Ukuran apa saja?</h3><p className="text-cream-300">Semua ukuran: 2x3, 3x4, 4x6, atau custom sesuai kebutuhan.</p></div>
            <div><h3 className="font-bold text-cream-100">Bisa untuk visa luar negeri?</h3><p className="text-cream-300">Bisa! Kami melayani pas foto untuk visa, passport, dan dokumen internasional.</p></div>
          </div>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">Pas Foto Sekarang</h3>
            <p className="text-cream-300 mb-4">Tanpa appointment, langsung datang! Proses cepat 10-15 menit.</p>
            <a href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20pas%20foto" className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors">CHAT WHATSAPP</a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Artikel Terkait</h2>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><Link href="/blog/studio-foto-solo" className="text-gold-400 hover:underline">Studio Foto Murah Solo</Link></li>
            <li><Link href="/blog/wisuda-solo" className="text-gold-400 hover:underline">Foto Wisuda Solo</Link></li>
            <li><Link href="/blog/self-photo-sukoharjo" className="text-gold-400 hover:underline">Self Photo Studio Sukoharjo</Link></li>
          </ul>
        </div>
      </article>
    </main>
  );
}
