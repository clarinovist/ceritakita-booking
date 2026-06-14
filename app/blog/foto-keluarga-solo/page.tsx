import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Foto Keluarga Solo 2026 — Studio Profesional Mulai Rp300K | CeritaKita",
  description: "Foto keluarga di Solo mulai Rp300K. Max 6 orang, photographer, cetak 4R & 10R. CeritaKita Studio Sukoharjo.",
  keywords: "foto keluarga solo, studio foto keluarga sukoharjo, foto family murah solo, foto keluarga profesional solo",
  openGraph: { title: "Foto Keluarga Solo 2026 — CeritaKita Studio", description: "Foto keluarga profesional di Solo mulai Rp300K.", url: "https://ceritakitastudio.site/blog/foto-keluarga-solo", siteName: "CeritaKita Studio", locale: "id_ID", type: "article" },
  alternates: { canonical: "https://ceritakitastudio.site/blog/foto-keluarga-solo" },
};

const faqData = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Berapa harga foto keluarga di Solo?", acceptedAnswer: { "@type": "Answer", text: "Di CeritaKita Studio, foto keluarga Rp300.000 untuk max 6 orang, sudah termasuk photographer, asisten, cetak 4R & 10R, dan file GDrive." } },
    { "@type": "Question", name: "Berapa orang yang bisa ikut foto keluarga?", acceptedAnswer: { "@type": "Answer", text: "Paket standard untuk 6 orang. Tambah orang Rp15.000/orang." } },
    { "@type": "Question", name: "Apakah ada kostum untuk foto keluarga?", acceptedAnswer: { "@type": "Answer", text: "Tersedia kostum adat Jawa untuk dewasa. Untuk anak-anak, silakan bawa kostum sendiri." } },
    { "@type": "Question", name: "Kapan waktu terbaik foto keluarga?", acceptedAnswer: { "@type": "Answer", text: "Pagi hari saat anak-anak masih fresh dan energik. Hindari jam tidur siang." } },
  ],
};

export default function FotoKeluargaSoloPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={faqData} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" / "}<Link href="/blog" className="hover:text-gold-400">Blog</Link>{" / "}<span>Foto Keluarga</span>
        </nav>
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">Foto Keluarga Solo: Abadikan Momen Berharga Bersama</h1>
        <p className="text-cream-300 text-sm mb-8">Terakhir diperbarui: 14 Juni 2026 · Waktu baca: 4 menit</p>
        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>Foto keluarga bukan sekadar foto — ini adalah investasi kenangan. Di <strong>CeritaKita Studio</strong>, foto keluarga di Solo mulai dari <strong>Rp300 ribu</strong> untuk 6 orang, sudah termasuk photographer profesional dan cetak foto.</p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Paket Foto Keluarga</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead><tr className="border-b border-cream-300/20 bg-olive-800"><th className="p-3 text-left text-cream-100">Paket</th><th className="p-3 text-left text-cream-100">Harga</th><th className="p-3 text-left text-cream-100">Include</th></tr></thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10"><td className="p-3">Family (6 orang)</td><td className="p-3 font-bold text-gold-400">Rp300.000</td><td className="p-3">Photographer, asisten, cetak 4R & 10R, file GDrive</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Tambah Orang</td><td className="p-3 font-bold text-gold-400">+Rp15.000/orang</td><td className="p-3">Di atas 6 orang</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Self Photo + Family</td><td className="p-3 font-bold text-gold-400">Rp300.000</td><td className="p-3">Kombinasi self photo bareng keluarga</td></tr>
                <tr><td className="p-3">Mini Album (10 lembar @4R)</td><td className="p-3 font-bold text-gold-400">Rp150.000</td><td className="p-3">Album kenangan keluarga</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Tips Foto Keluarga yang Natural</h2>
          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Koordinasi outfit</strong> — Pakai warna senada, hindari motif ramai</li>
            <li><strong>Pilih waktu yang tepat</strong> — Saat semua anggota keluarga fresh dan mood bagus</li>
            <li><strong>Siapkan anak-anak</strong> — Bawa snack, mainan, atau benda favorit mereka</li>
            <li><strong>Jangan terlalu formal</strong> — Foto candid sering lebih berkesan dari foto pose</li>
            <li><strong>Bawa properti keluarga</strong> — Buku, alat musik, atau hobi yang merepresentasikan keluarga</li>
          </ol>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>
          <div className="space-y-4">
            <div><h3 className="font-bold text-cream-100">Berapa harga foto keluarga di Solo?</h3><p className="text-cream-300">Di CeritaKita Studio, foto keluarga Rp300.000 untuk max 6 orang, sudah termasuk photographer, asisten, cetak 4R & 10R, dan file GDrive.</p></div>
            <div><h3 className="font-bold text-cream-100">Berapa orang yang bisa ikut?</h3><p className="text-cream-300">Paket standard untuk 6 orang. Tambah orang Rp15.000/orang.</p></div>
            <div><h3 className="font-bold text-cream-100">Apakah ada kostum?</h3><p className="text-cream-300">Tersedia kostum adat Jawa untuk dewasa. Untuk anak-anak, silakan bawa kostum sendiri.</p></div>
            <div><h3 className="font-bold text-cream-100">Kapan waktu terbaik?</h3><p className="text-cream-300">Pagi hari saat anak-anak masih fresh dan energik. Hindari jam tidur siang.</p></div>
          </div>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">Booking Foto Keluarga</h3>
            <p className="text-cream-300 mb-4">Abadikan momen kebersamaan keluarga Anda!</p>
            <a href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20booking%20foto%20keluarga" className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors">BOOKING VIA WHATSAPP</a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Artikel Terkait</h2>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><Link href="/blog/studio-foto-solo" className="text-gold-400 hover:underline">Studio Foto Murah Solo</Link></li>
            <li><Link href="/blog/wisuda-solo" className="text-gold-400 hover:underline">Foto Wisuda Solo</Link></li>
            <li><Link href="/blog/birthday-photo-solo" className="text-gold-400 hover:underline">Foto Birthday Solo</Link></li>
            <li><Link href="/blog/harga-prewedding-solo" className="text-gold-400 hover:underline">Harga Prewedding Solo</Link></li>
          </ul>
        </div>
      </article>
    </main>
  );
}
