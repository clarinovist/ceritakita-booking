import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Studio Foto Boyolali: Panduan Lengkap + Harga 2026 | CeritaKita Studio",
  description:
    "Studio foto terdekat dari Boyolali mulai Rp150K. Self photo, wisuda, prewedding. CeritaKita Studio Sukoharjo — cuma 30 menit dari Boyolali!",
  keywords:
    "studio foto boyolali, foto studio boyolali, studio foto murah boyolali, self photo boyolali, foto wisuda boyolali, foto prewedding boyolali, fotografer boyolali",
  openGraph: {
    title: "Studio Foto Boyolali — CeritaKita Studio",
    description:
      "Studio foto profesional dekat Boyolali mulai Rp150K. Termasuk makeup, kostum adat Jawa, dan editing profesional. Booking sekarang!",
    url: "https://ceritakitastudio.site/blog/studio-foto-boyolali",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/studio-foto-boyolali",
  },
};

export default function StudioFotoBoyolaliPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Dimana studio foto terdekat dari Boyolali?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CeritaKita Studio berlokasi di Sukoharjo, hanya 30 menit dari pusat Boyolali via Jalan Raya Solo-Yogyakarta. Akses mudah dan parkir luas."
            }
          },
          {
            "@type": "Question",
            "name": "Berapa harga studio foto di dekat Boyolali?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CeritaKita Studio menawarkan harga mulai Rp150.000 untuk self photo, Rp40.000 untuk pas foto, hingga Rp1.300.000 untuk paket wedding. Sudah termasuk makeup dan editing."
            }
          },
          {
            "@type": "Question",
            "name": "Apakah bisa booking studio foto dari Boyolali?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Bisa! Booking sangat mudah via WhatsApp. Banyak customer dari Boyolali yang sudah membuktikan kualitas layanan CeritaKita Studio."
            }
          },
          {
            "@type": "Question",
            "name": "Jenis foto apa saja yang tersedia?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tersedia pas foto, self photo, foto wisuda, foto keluarga, prewedding (Bronze/Silver/Gold), outdoor, dan wedding. Semua paket include makeup dan kostum."
            }
          }
        ]
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Studio Foto Boyolali",
        "description": "Sesi foto studio di CeritaKita Studio Sukoharjo, dekat Boyolali. Termasuk makeup, kostum, sesi foto 30 menit, dan editing profesional.",
        "brand": { "@type": "Brand", "name": "CeritaKita Studio" },
        "offers": {
          "@type": "Offer",
          "price": 150000,
          "priceCurrency": "IDR",
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": "CeritaKita Studio" }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "50"
        }
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Foto Keluarga Boyolali",
        "description": "Foto keluarga profesional di CeritaKita Studio Sukoharjo. Max 6 orang, photographer include, cetak 4R dan 10R.",
        "brand": { "@type": "Brand", "name": "CeritaKita Studio" },
        "offers": {
          "@type": "Offer",
          "price": 300000,
          "priceCurrency": "IDR",
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": "CeritaKita Studio" }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "50"
        }
      }} />

      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{""}/{""}{" "}
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{""}/{""}{" "}
          <span>Studio Foto Boyolali</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Studio Foto di Boyolali: Panduan Lengkap + Harga 2026
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 21 Juli 2026 · Waktu baca: 5 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Cari <strong>studio foto terbaik di Boyolali</strong>? Kamu nggak perlu jauh-jauh ke Solo! CeritaKita Studio di Sukoharjo cuma <strong>30 menit dari pusat Boyolali</strong> — dekat, mudah dijangkau, dan harga sangat terjangkau. Mulai dari Rp40 ribu untuk pas foto hingga paket wedding premium, kami siap memenuhi kebutuhan fotografi kamu.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Kenapa Pilih CeritaKita Studio untuk Warga Boyolali?
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Jarak dekat</strong> — Cuma 30 menit dari Boyolali via Jalan Raya Solo-Yogyakarta</li>
            <li><strong>Harga paling terjangkau</strong> di Solo Raya — mulai Rp40K untuk pas foto</li>
            <li><strong>Studio privat</strong> — Nggak digabung dengan customer lain, bebas berekspresi</li>
            <li><strong>Kostum adat Jawa lengkap</strong> — Kebaya, jarik, blangkon, dan aksesoris</li>
            <li><strong>Makeup profesional</strong> — Tim makeup artist berpengalaman</li>
            <li><strong>Hasil edit cepat</strong> — Maksimal 3 hari kerja, dikirim via Google Drive</li>
            <li><strong>Parkir luas</strong> dan akses mudah dari arah Boyolali</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Daftar Harga Studio Foto 2026
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead>
                <tr className="border-b border-cream-300/20 bg-olive-800">
                  <th className="p-3 text-left text-cream-100">Paket</th>
                  <th className="p-3 text-left text-cream-100">Harga</th>
                  <th className="p-3 text-left text-cream-100">Include</th>
                </tr>
              </thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Pas Foto</td>
                  <td className="p-3 font-bold text-gold-400">Rp40.000</td>
                  <td className="p-3">Pas foto formal, background pilihan, cetak 4R</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Self Photo ⭐ Best Deal</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Simple makeup, kostum adat Jawa, sesi 30 menit, semua file high-res via GDrive</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Foto Wisuda</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Toga, makeup, beberapa background, cetak & file digital</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Birthday / Anniversary</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Setup dekorasi, makeup, sesi foto spesial</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Foto Keluarga</td>
                  <td className="p-3 font-bold text-gold-400">Rp300.000</td>
                  <td className="p-3">Max 6 orang, photographer, cetak 4R & 10R</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Bronze</td>
                  <td className="p-3 font-bold text-gold-400">Rp400.000</td>
                  <td className="p-3">Sesi indoor, 1 set baju, makeup, editing</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Silver</td>
                  <td className="p-3 font-bold text-gold-400">Rp600.000</td>
                  <td className="p-3">Sesi indoor + outdoor, 2 set baju, makeup, editing</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Gold</td>
                  <td className="p-3 font-bold text-gold-400">Rp800.000</td>
                  <td className="p-3">Sesi indoor + outdoor, 3 set baju, makeup, editing premium</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Outdoor</td>
                  <td className="p-3 font-bold text-gold-400">Rp1.300.000</td>
                  <td className="p-3">Sesi outdoor di lokasi pilihan, full makeup, editing</td>
                </tr>
                <tr>
                  <td className="p-3">Wedding</td>
                  <td className="p-3 font-bold text-gold-400">Rp1.300.000</td>
                  <td className="p-3">Paket lengkap wedding, makeup, baju pengantin, editing premium</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Cara Booking dari Boyolali
          </h2>

          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Hubungi via WhatsApp</strong> — Kirim pesan ke nomor kami dengan informasi tanggal dan jenis foto yang diinginkan</li>
            <li><strong>Pilih paket</strong> — Tim kami akan membantu memilih paket yang sesuai kebutuhan dan budget</li>
            <li><strong>Bayar DP</strong> — Konfirmasi jadwal dengan membayar uang muka</li>
            <li><strong>Hadir di studio</strong> — Datang ke CeritaKita Studio di hari yang sudah dijadwalkan. Bawa outfit favorit jika mau!</li>
            <li><strong>Terima hasil</strong> — File digital dikirim via Google Drive maksimal 3 hari kerja</li>
          </ol>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Booking Studio Foto Sekarang
            </h3>
            <p className="text-cream-300 mb-4">
              Mau foto dari Boyolali? Langsung chat kami! Harga mulai Rp150K sudah termasuk makeup dan kostum adat Jawa. Jadwal terbatas, booking sekarang!
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20dari%20Boyolali%20mau%20booking%20sesi%20foto"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              BOOKING VIA WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Dimana studio foto terdekat dari Boyolali?</h3>
              <p className="text-cream-300">CeritaKita Studio berlokasi di Sukoharjo, hanya 30 menit dari pusat Boyolali via Jalan Raya Solo-Yogyakarta. Akses mudah dan parkir luas.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Berapa harga studio foto di dekat Boyolali?</h3>
              <p className="text-cream-300">CeritaKita Studio menawarkan harga mulai Rp150.000 untuk self photo, Rp40.000 untuk pas foto, hingga Rp1.300.000 untuk paket wedding. Sudah termasuk makeup dan editing.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah bisa booking studio foto dari Boyolali?</h3>
              <p className="text-cream-300">Bisa! Booking sangat mudah via WhatsApp. Banyak customer dari Boyolali yang sudah membuktikan kualitas layanan CeritaKita Studio.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Jenis foto apa saja yang tersedia?</h3>
              <p className="text-cream-300">Tersedia pas foto, self photo, foto wisuda, foto keluarga, prewedding (Bronze/Silver/Gold), outdoor, dan wedding. Semua paket include makeup dan kostum.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
