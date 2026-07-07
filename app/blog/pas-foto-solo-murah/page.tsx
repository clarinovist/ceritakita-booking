import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Pas Foto Solo Murah: Mulai Rp40K | CeritaKita Studio",
  description: "Pas foto murah di Solo mulai Rp40K. Untuk KTP, SIM, visa, ijazah, lamaran kerja. CeritaKita Studio Sukoharjo!",
  keywords: "pas foto solo murah, pas foto murah solo, foto pas solo, pas foto solo, foto dokumen solo, pas foto sukoharjo",
  openGraph: { title: "Pas Foto Solo Murah: Mulai Rp40K | CeritaKita Studio", description: "Pas foto murah di Solo mulai Rp40K. Untuk KTP, SIM, visa, ijazah, lamaran kerja.", url: "https://ceritakitastudio.site/blog/pas-foto-solo-murah", siteName: "CeritaKita Studio", locale: "id_ID", type: "article" },
  alternates: { canonical: "https://ceritakitastudio.site/blog/pas-foto-solo-murah" },
};

const faqData = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Berapa harga pas foto murah di Solo?", acceptedAnswer: { "@type": "Answer", text: "Di CeritaKita Studio, pas foto mulai Rp40.000 saja untuk semua ukuran. Harga termurah di Solo Raya!" } },
    { "@type": "Question", name: "Ukuran pas foto apa saja yang tersedia dengan harga Rp40K?", acceptedAnswer: { "@type": "Answer", text: "Harga Rp40K berlaku untuk semua ukuran: 2x3, 3x4, 4x6, dan ukuran lainnya. Tidak ada biaya tambahan." } },
    { "@type": "Question", name: "Berapa lama proses pas foto?", acceptedAnswer: { "@type": "Answer", text: "Proses sangat cepat, 10-15 menit saja sudah selesai. Bisa langsung cetak atau terima file digital." } },
    { "@type": "Question", name: "Syarat pas foto apa saja yang perlu dibawa?", acceptedAnswer: { "@type": "Answer", text: "Tidak ada syarat khusus. Cukup datang ke studio, pilih ukuran, dan langsung foto. Pakaian rapi disarankan." } },
  ],
};

export default function PasFotoSoloMurahPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={faqData} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" / "}<Link href="/blog" className="hover:text-gold-400">Blog</Link>{" / "}<span>Pas Foto Solo Murah</span>
        </nav>
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">Pas Foto Solo Murah: Mulai Rp40K untuk Semua Kebutuhan</h1>
        <p className="text-cream-300 text-sm mb-8">Terakhir diperbarui: 4 Agustus 2026 · Waktu baca: 3 menit</p>
        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>Cari <strong>pas foto murah di Solo</strong>? Di <strong>CeritaKita Studio</strong>, harga pas foto mulai dari <strong>Rp40 ribu</strong> saja — termurah di Solo Raya! Tidak perlu khawatir soal kualitas karena harga murah bukan berarti hasil murahan. Foto Anda dicetak dengan tinta berkualitas dan resolusi tinggi.</p>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-gold-400 text-2xl font-bold">Rp40.000</span>
              <span className="text-cream-400 text-sm line-through">Harga biasa Rp50.000+</span>
              <span className="bg-gold-500 text-olive-900 text-xs font-bold px-2 py-1 rounded">PROMO</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-cream-300">
              <span className="text-gold-400">★★★★★</span>
              <span>4.8/5 dari 200+ pelanggan</span>
            </div>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Daftar Harga Pas Foto Murah Solo</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead><tr className="border-b border-cream-300/20 bg-olive-800"><th className="p-3 text-left text-cream-100">Paket</th><th className="p-3 text-left text-cream-100">Harga</th><th className="p-3 text-left text-cream-100">Include</th></tr></thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10"><td className="p-3">Pas Foto Standar</td><td className="p-3 font-bold text-gold-400">Rp40.000</td><td className="p-3">Semua ukuran (2x3, 3x4, 4x6), cetak langsung</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Cute Pas Foto</td><td className="p-3 font-bold text-gold-400">Rp125.000 <span className="text-cream-400 line-through text-xs">Rp150.000</span></td><td className="p-3">Pas foto estetik dengan sentuhan makeup</td></tr>
                <tr><td className="p-3">Self Photo + Pas Foto</td><td className="p-3 font-bold text-gold-400">Rp150.000</td><td className="p-3">Kombinasi self photo + pas foto</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Jenis Pas Foto yang Kami Layani</h2>
          <p>Dengan harga mulai Rp40K, Anda bisa pas foto untuk semua kebutuhan dokumen:</p>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Pas foto KTP</strong> — Ukuran 3x4, background merah sesuai standar Disdukcapil</li>
            <li><strong>Pas foto SIM</strong> — Ukuran 3x4, background biru sesuai standar polisi</li>
            <li><strong>Pas foto visa & passport</strong> — Standar internasional (ICAO) untuk dokumen luar negeri</li>
            <li><strong>Pas foto ijazah</strong> — Untuk keperluan akademik dan melamar beasiswa</li>
            <li><strong>Pas foto lamaran kerja</strong> — Professional look untuk CV dan berkas lamaran</li>
            <li><strong>Pas foto nikah</strong> — Background merah/biru sesuai standar KUA untuk berkas nikah</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Kenapa Pas Foto di CeritaKita Paling Murah?</h2>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Harga transparan</strong> — Rp40K untuk semua ukuran, tidak ada biaya tersembunyi</li>
            <li><strong>Proses kilat</strong> — 10-15 menit, langsung selesai dan bawa pulang</li>
            <li><strong>Hasil profesional</strong> — Background rapi, warna kulit natural, resolusi tinggi</li>
            <li><strong>Tanpa appointment</strong> — Langsung datang kapan saja, tidak perlu booking</li>
            <li><strong>Lokasi strategis</strong> — Sukoharjo, mudah dijangkau dari Solo dan sekitarnya</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>
          <div className="space-y-4">
            <div><h3 className="font-bold text-cream-100">Berapa harga pas foto murah di Solo?</h3><p className="text-cream-300">Di CeritaKita Studio, pas foto mulai Rp40.000 untuk semua ukuran. Harga termurah di Solo Raya!</p></div>
            <div><h3 className="font-bold text-cream-100">Ukuran pas foto apa saja yang tersedia dengan harga Rp40K?</h3><p className="text-cream-300">Semua ukuran: 2x3, 3x4, 4x6, dan ukuran lainnya. Tidak ada biaya tambahan untuk ukuran tertentu.</p></div>
            <div><h3 className="font-bold text-cream-100">Berapa lama proses pas foto?</h3><p className="text-cream-300">Proses sangat cepat, 10-15 menit saja sudah selesai. Bisa langsung cetak atau terima file digital.</p></div>
            <div><h3 className="font-bold text-cream-100">Syarat pas foto apa saja yang perlu dibawa?</h3><p className="text-cream-300">Tidak ada syarat khusus. Cukup datang ke studio, pilih ukuran, dan langsung foto. Pakaian rapi disarankan.</p></div>
          </div>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">Pas Foto Murah Sekarang!</h3>
            <p className="text-cream-300 mb-4">Mulai Rp40K, proses 10-15 menit, hasil profesional. Langsung datang tanpa appointment!</p>
            <a href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20pas%20foto%20murah%20di%20Solo" className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors">CHAT WHATSAPP</a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Artikel Terkait</h2>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><Link href="/blog/pas-foto-solo" className="text-gold-400 hover:underline">Pas Foto Solo — Foto Dokumen Profesional</Link></li>
            <li><Link href="/blog/studio-foto-solo" className="text-gold-400 hover:underline">Studio Foto Murah Solo</Link></li>
            <li><Link href="/blog/self-photo-sukoharjo" className="text-gold-400 hover:underline">Self Photo Studio Sukoharjo</Link></li>
          </ul>
        </div>
      </article>
    </main>
  );
}
