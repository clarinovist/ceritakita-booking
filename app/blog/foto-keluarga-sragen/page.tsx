import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Foto Keluarga Sragen: Abadikan Momen Berharga | CeritaKita Studio",
  description:
    "Foto keluarga dekat Sragen mulai Rp300K untuk 6 orang. Fotografer profesional. CeritaKita Studio Sukoharjo — 35 menit dari Sragen!",
  keywords:
    "foto keluarga sragen, foto family sragen, foto keluarga murah sragen, studio foto keluarga sragen, fotografer keluarga sragen",
  openGraph: {
    title: "Foto Keluarga Sragen — CeritaKita Studio",
    description:
      "Foto keluarga profesional dekat Sragen mulai Rp300K. Termasuk photographer, cetak 4R & 10R, editing profesional. Booking sekarang!",
    url: "https://ceritakitastudio.site/blog/foto-keluarga-sragen",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/foto-keluarga-sragen",
  },
};

export default function FotoKeluargaSragenPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Dimana tempat foto keluarga terdekat dari Sragen?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CeritaKita Studio berlokasi di Sukoharjo, hanya 35 menit dari pusat Sragen via Jalan Raya Solo-Sragen. Akses mudah dan parkir luas."
            }
          },
          {
            "@type": "Question",
            "name": "Berapa harga foto keluarga di dekat Sragen?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CeritaKita Studio menawarkan paket foto keluarga mulai Rp300.000 untuk maksimal 6 orang. Sudah termasuk fotografer profesional, cetak 4R dan 10R, serta editing."
            }
          },
          {
            "@type": "Question",
            "name": "Apakah bisa booking foto keluarga dari Sragen?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Bisa! Booking sangat mudah via WhatsApp. Banyak customer dari Sragen yang sudah membuktikan kualitas layanan CeritaKita Studio."
            }
          },
          {
            "@type": "Question",
            "name": "Berapa lama sesi foto keluarga dan kapan hasilnya siap?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sesi foto keluarga berlangsung sekitar 30-45 menit. Hasil foto digital dikirim via Google Drive maksimal 3 hari kerja setelah sesi. Cetak 4R dan 10R juga termasuk dalam paket."
            }
          }
        ]
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Foto Keluarga Sragen",
        "description": "Foto keluarga profesional di CeritaKita Studio Sukoharjo, dekat Sragen. Max 6 orang, photographer include, cetak 4R dan 10R.",
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
          <Link href="/" className="hover:text-gold-400">Home</Link>{"/"}{""}{" "}
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{"/"}{""}{" "}
          <span>Foto Keluarga Sragen</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Foto Keluarga di Sragen: Panduan Lengkap + Harga 2026
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 4 Agustus 2026 · Waktu baca: 4 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Mau <strong>foto keluarga di Sragen</strong> tapi bingung cari studio yang pas? CeritaKita Studio di Sukoharjo cuma <strong>35 menit dari pusat Sragen</strong> — dekat, nyaman, dan harga sangat terjangkau. Mulai dari Rp300 ribu untuk keluarga kecil hingga paket besar, kami siapabadikan momen berharga bersama keluargamu.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Kenapa Pilih CeritaKita Studio untuk Foto Keluarga?
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Jarak dekat</strong> — Cuma 35 menit dari Sragen via Jalan Raya Solo-Sragen</li>
            <li><strong>Fotografer profesional</strong> — Sudah berpengalaman memotret keluarga besar & kecil</li>
            <li><strong>Studio privat</strong> — Nggak digabung dengan customer lain, bebas berekspresi</li>
            <li><strong>Cetak 4R & 10R termasuk</strong> — Langsung dapat foto cetak siap pajang</li>
            <li><strong>Kostum & aksesoris</strong> — Tersedia kostum adat Jawa untuk foto keluarga</li>
            <li><strong>Hasil edit cepat</strong> — Maksimal 3 hari kerja, dikirim via Google Drive</li>
            <li><strong>Parkir luas</strong> dan akses mudah dari arah Sragen</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Harga Foto Keluarga 2026
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
                  <td className="p-3">Foto Keluarga ⭐ Best Deal</td>
                  <td className="p-3 font-bold text-gold-400">Rp300.000</td>
                  <td className="p-3">Max 6 orang, fotografer profesional, cetak 4R & 10R, editing</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Self Photo</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Simple makeup, kostum adat Jawa, sesi 30 menit, semua file high-res via GDrive</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Pas Foto</td>
                  <td className="p-3 font-bold text-gold-400">Rp40.000</td>
                  <td className="p-3">Pas foto formal, background pilihan, cetak 4R</td>
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
                <tr>
                  <td className="p-3">Wedding</td>
                  <td className="p-3 font-bold text-gold-400">Rp1.300.000</td>
                  <td className="p-3">Paket lengkap wedding, makeup, baju pengantin, editing premium</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Tips Foto Keluarga yang Memukau
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Koordinasikan outfit</strong> — Pilih warna senada agar foto terlihat serasi dan elegan</li>
            <li><strong>Jadwalkan di pagi hari</strong> — Anak-anak lebih fresh dan mood lebih baik di pagi hari</li>
            <li><strong>Bawa props favorit</strong> — Frame foto, bunga, atau mainan anak bisa tambah kesan personal</li>
            <li><strong>Tenangkan anak kecil</strong> — Sesi foto keluarga paling seru kalau semua happy & rileks</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Cara Booking dari Sragen
          </h2>

          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Hubungi via WhatsApp</strong> — Kirim pesan ke nomor kami dengan informasi tanggal dan jumlah anggota keluarga</li>
            <li><strong>Pilih paket</strong> — Tim kami akan membantu memilih paket yang sesuai kebutuhan dan budget</li>
            <li><strong>Bayar DP</strong> — Konfirmasi jadwal dengan membayar uang muka</li>
            <li><strong>Hadir di studio</strong> — Datang ke CeritaKita Studio di hari yang sudah dijadwalkan. Bawa outfit favorit!</li>
            <li><strong>Terima hasil</strong> — File digital via Google Drive + cetak 4R & 10R, maksimal 3 hari kerja</li>
          </ol>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Booking Foto Keluarga Sekarang
            </h3>
            <p className="text-cream-300 mb-4">
              Mau foto keluarga dari Sragen? Langsung chat kami! Harga mulai Rp300K sudah termasuk fotografer profesional dan cetak 4R & 10R. Jadwal terbatas, booking sekarang!
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20booking%20foto%20keluarga%20dari%20Sragen"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              BOOKING VIA WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Dimana tempat foto keluarga terdekat dari Sragen?</h3>
              <p className="text-cream-300">CeritaKita Studio berlokasi di Sukoharjo, hanya 35 menit dari pusat Sragen via Jalan Raya Solo-Sragen. Akses mudah dan parkir luas.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Berapa harga foto keluarga di dekat Sragen?</h3>
              <p className="text-cream-300">CeritaKita Studio menawarkan paket foto keluarga mulai Rp300.000 untuk maksimal 6 orang. Sudah termasuk fotografer profesional, cetak 4R dan 10R, serta editing.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah bisa booking foto keluarga dari Sragen?</h3>
              <p className="text-cream-300">Bisa! Booking sangat mudah via WhatsApp. Banyak customer dari Sragen yang sudah membuktikan kualitas layanan CeritaKita Studio.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Berapa lama sesi foto keluarga dan kapan hasilnya siap?</h3>
              <p className="text-cream-300">Sesi foto keluarga berlangsung sekitar 30-45 menit. Hasil foto digital dikirim via Google Drive maksimal 3 hari kerja setelah sesi. Cetak 4R dan 10R juga termasuk dalam paket.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
