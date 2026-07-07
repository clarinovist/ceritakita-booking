import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Foto Wisuda Sragen: Panduan Lengkap + Harga 2026 | CeritaKita Studio",
  description:
    "Foto wisuda di Sragen mulai Rp150K. Studio & outdoor, hasil profesional. CeritaKita Studio Sukoharjo — 35 menit dari Sragen!",
  keywords:
    "foto wisuda sragen, wisuda sragen, foto wisuda murah sragen, studio foto wisuda sragen, fotografer wisuda sragen",
  openGraph: {
    title: "Foto Wisuda Sragen — CeritaKita Studio",
    description:
      "Foto wisuda profesional dekat Sragen mulai Rp150K. Toga, makeup, beberapa background, cetak & file digital. Booking sekarang!",
    url: "https://ceritakitastudio.site/blog/foto-wisuda-sragen",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/foto-wisuda-sragen",
  },
};

export default function FotoWisudaSragenPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Dimana tempat foto wisuda terbaik dekat Sragen?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CeritaKita Studio berlokasi di Sukoharjo, hanya 35 menit dari pusat Sragen. Studio privat dengan berbagai background, toga lengkap, dan makeup profesional."
            }
          },
          {
            "@type": "Question",
            "name": "Berapa harga foto wisuda di Sragen?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CeritaKita Studio menawarkan foto wisuda mulai Rp150.000 sudah termasuk toga, makeup, beberapa background, cetak, dan file digital high-res."
            }
          },
          {
            "@type": "Question",
            "name": "Apakah bisa foto wisuda outdoor dari Sragen?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Bisa! CeritaKita Studio menyediakan paket foto wisuda outdoor. Bisa di lokasi kampus atau tempat outdoor pilihan. Harga mulai Rp1.300.000."
            }
          },
          {
            "@type": "Question",
            "name": "Bagaimana cara booking foto wisuda dari Sragen?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sangat mudah! Hubungi kami via WhatsApp, pilih paket dan tanggal, bayar DP, lalu hadir di studio. File foto dikirim via Google Drive maksimal 3 hari kerja."
            }
          }
        ]
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Foto Wisuda Sragen",
        "description": "Sesi foto wisuda profesional di CeritaKita Studio Sukoharjo, dekat Sragen. Termasuk toga, makeup, beberapa background, cetak, dan file digital high-res.",
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

      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{"/"}{" "}
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{"/"}{" "}
          <span>Foto Wisuda Sragen</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Foto Wisuda di Sragen: Panduan Lengkap + Harga 2026
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 28 Juli 2026 · Waktu baca: 4 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Cari <strong>foto wisuda terbaik di Sragen</strong>? Kamu nggak perlu bingung! CeritaKita Studio di Sukoharjo cuma <strong>35 menit dari pusat Sragen</strong> — dekat, mudah dijangkau, dan harga sangat terjangkau. Mulai dari Rp150 ribu untuk foto wisuda lengkap dengan toga, makeup, dan editing profesional, kami siap mengabadikan momen wisuda kamu.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Kenapa Pilih CeritaKita Studio untuk Foto Wisuda dari Sragen?
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Jarak dekat</strong> — Cuma 35 menit dari Sragen, akses mudah dari arah timur Solo</li>
            <li><strong>Harga terjangkau</strong> — Mulai Rp150K untuk foto wisuda lengkap</li>
            <li><strong>Toga & properti wisuda lengkap</strong> — Tinggal datang, nggak perlu repot bawa</li>
            <li><strong>Makeup profesional</strong> — Tim makeup artist berpengalaman untuk tampil sempurna</li>
            <li><strong>Berbagai background</strong> — Pilih background sesuai selera, indoor maupun outdoor</li>
            <li><strong>Hasil edit cepat</strong> — Maksimal 3 hari kerja, file high-res via Google Drive</li>
            <li><strong>Studio privat</strong> — Nggak digabung dengan customer lain, nyaman dan privat</li>
            <li><strong>Parkir luas</strong> dan akses mudah dari arah Sragen</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Daftar Harga Foto Wisuda 2026
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
                  <td className="p-3">Foto Wisuda ⭐ Populer</td>
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
            Cara Booking Foto Wisuda dari Sragen
          </h2>

          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Hubungi via WhatsApp</strong> — Kirim pesan ke nomor kami dengan informasi tanggal dan kebutuhan foto wisuda</li>
            <li><strong>Pilih paket</strong> — Tim kami akan membantu memilih paket yang sesuai kebutuhan dan budget</li>
            <li><strong>Bayar DP</strong> — Konfirmasi jadwal dengan membayar uang muka</li>
            <li><strong>Hadir di studio</strong> — Datang ke CeritaKita Studio di hari yang sudah dijadwalkan. Toga dan properti sudah disediakan!</li>
            <li><strong>Terima hasil</strong> — File digital dikirim via Google Drive maksimal 3 hari kerja</li>
          </ol>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Booking Foto Wisuda Sekarang
            </h3>
            <p className="text-cream-300 mb-4">
              Mau foto wisuda dari Sragen? Langsung chat kami! Harga mulai Rp150K sudah termasuk toga, makeup, dan editing profesional. Jadwal terbatas, booking sekarang!
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20booking%20foto%20wisuda%20dari%20Sragen"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              BOOKING VIA WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Dimana tempat foto wisuda terbaik dekat Sragen?</h3>
              <p className="text-cream-300">CeritaKita Studio berlokasi di Sukoharjo, hanya 35 menit dari pusat Sragen. Studio privat dengan berbagai background, toga lengkap, dan makeup profesional.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Berapa harga foto wisuda di Sragen?</h3>
              <p className="text-cream-300">CeritaKita Studio menawarkan foto wisuda mulai Rp150.000 sudah termasuk toga, makeup, beberapa background, cetak, dan file digital high-res.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah bisa foto wisuda outdoor dari Sragen?</h3>
              <p className="text-cream-300">Bisa! CeritaKita Studio menyediakan paket foto wisuda outdoor. Bisa di lokasi kampus atau tempat outdoor pilihan. Harga mulai Rp1.300.000.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Bagaimana cara booking foto wisuda dari Sragen?</h3>
              <p className="text-cream-300">Sangat mudah! Hubungi kami via WhatsApp, pilih paket dan tanggal, bayar DP, lalu hadir di studio. File foto dikirim via Google Drive maksimal 3 hari kerja.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
