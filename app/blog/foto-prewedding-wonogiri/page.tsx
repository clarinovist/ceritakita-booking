import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Foto Prewedding Wonogiri: Panduan + Harga 2026 | CeritaKita Studio",
  description:
    "Foto prewedding dekat Wonogiri mulai Rp400K. Indoor studio & outdoor. CeritaKita Studio Sukoharjo — 30 menit dari Wonogiri!",
  keywords:
    "foto prewedding wonogiri, prewedding wonogiri, foto prewedding murah wonogiri, studio prewedding wonogiri, fotografer prewedding wonogiri",
  openGraph: {
    title: "Foto Prewedding Wonogiri — CeritaKita Studio",
    description:
      "Foto prewedding profesional dekat Wonogiri mulai Rp400K. Indoor & outdoor. Termasuk makeup, kostum, dan editing. Booking sekarang!",
    url: "https://ceritakitastudio.site/blog/foto-prewedding-wonogiri",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/foto-prewedding-wonogiri",
  },
};

export default function FotoPreweddingWonogiriPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Berapa harga foto prewedding dekat Wonogiri?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CeritaKita Studio menawarkan paket prewedding mulai Rp400.000 (Bronze) hingga Rp1.300.000 (Outdoor). Sudah termasuk makeup, kostum, dan editing profesional."
            }
          },
          {
            "@type": "Question",
            "name": "Dimana studio prewedding terdekat dari Wonogiri?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CeritaKita Studio berlokasi di Sukoharjo, hanya 30 menit dari pusat Wonogiri. Akses mudah dari arah Wonogiri via Jalan Raya Wonogiri-Solo."
            }
          },
          {
            "@type": "Question",
            "name": "Apakah ada paket prewedding outdoor dari Wonogiri?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Ada! Paket Prewedding Outdoor seharga Rp1.300.000 termasuk sesi outdoor di lokasi pilihan, full makeup, kostum, dan editing premium. Bisa di Wonogiri atau Solo."
            }
          },
          {
            "@type": "Question",
            "name": "Bagaimana cara booking foto prewedding dari Wonogiri?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Booking mudah via WhatsApp! Kirim pesan, pilih paket (Bronze/Silver/Gold/Outdoor), bayar DP, dan datang di hari yang dijadwalkan. Hasil foto dikirim via Google Drive maksimal 3 hari kerja."
            }
          }
        ]
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Prewedding Studio Wonogiri",
        "description": "Sesi foto prewedding indoor di CeritaKita Studio Sukoharjo, dekat Wonogiri. Termasuk makeup, kostum, sesi foto 30 menit, dan editing profesional.",
        "brand": { "@type": "Brand", "name": "CeritaKita Studio" },
        "offers": {
          "@type": "Offer",
          "price": 400000,
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
        "name": "Prewedding Outdoor Wonogiri",
        "description": "Sesi foto prewedding outdoor di lokasi pilihan, dekat Wonogiri. Termasuk full makeup, kostum, sesi foto outdoor, dan editing premium.",
        "brand": { "@type": "Brand", "name": "CeritaKita Studio" },
        "offers": {
          "@type": "Offer",
          "price": 1300000,
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
          <Link href="/" className="hover:text-gold-400">Home</Link>{" "}/{""}{" "}
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{" "}/{""}{" "}
          <span>Foto Prewedding Wonogiri</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Foto Prewedding di Wonogiri: Panduan Lengkap + Harga 2026
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 28 Juli 2026 · Waktu baca: 5 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Mau <strong>foto prewedding</strong> tapi bingung cari studio yang murah dan bagus di Wonogiri? Kamu nggak perlu jauh-jauh ke Solo! CeritaKita Studio di Sukoharjo cuma <strong>30 menit dari pusat Wonogiri</strong> — dekat, mudah dijangkau, dan harga prewedding mulai dari <strong>Rp400 ribu</strong> aja. Mulai dari sesi indoor di studio hingga outdoor di lokasi pilihan, kami siap mengabadikan momen spesial kamu sebelum hari pernikahan.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Kenapa Pilih CeritaKita Studio untuk Prewedding dari Wonogiri?
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Jarak dekat</strong> — Cuma 30 menit dari Wonogiri via Jalan Raya Wonogiri-Solo</li>
            <li><strong>Harga prewedding paling terjangkau</strong> — mulai Rp400K untuk Bronze</li>
            <li><strong>Studio privat</strong> — Nggak digabung dengan customer lain, bebas berekspresi</li>
            <li><strong>Kostum prewedding lengkap</strong> — Kebaya, gaun, jas, jarik, dan aksesoris</li>
            <li><strong>Makeup profesional</strong> — Tim makeup artist berpengalaman untuk prewedding</li>
            <li><strong>Hasil edit cepat</strong> — Maksimal 3 hari kerja, dikirim via Google Drive</li>
            <li><strong>Parkir luas</strong> dan akses mudah dari arah Wonogiri</li>
            <li><strong>Opsi indoor & outdoor</strong> — Studio aesthetic atau sesi outdoor di lokasi pilihan</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Paket Foto Prewedding 2026
          </h2>

          <p>
            CeritaKita Studio menyediakan 4 paket prewedding yang bisa disesuaikan dengan kebutuhan dan budget kamu:
          </p>

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
                  <td className="p-3">Prewedding Bronze</td>
                  <td className="p-3 font-bold text-gold-400">Rp400.000</td>
                  <td className="p-3">Sesi indoor, 1 set baju, makeup, editing</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Silver ⭐ Best Deal</td>
                  <td className="p-3 font-bold text-gold-400">Rp600.000</td>
                  <td className="p-3">Sesi indoor + outdoor, 2 set baju, makeup, editing</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Gold</td>
                  <td className="p-3 font-bold text-gold-400">Rp800.000</td>
                  <td className="p-3">Sesi indoor + outdoor, 3 set baju, makeup, editing premium</td>
                </tr>
                <tr>
                  <td className="p-3">Outdoor Premium</td>
                  <td className="p-3 font-bold text-gold-400">Rp1.300.000</td>
                  <td className="p-3">Sesi outdoor di lokasi pilihan, full makeup, editing premium</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Lokasi Studio & Akses dari Wonogiri
          </h2>

          <p>
            CeritaKita Studio berlokasi strategis di Sukoharjo, dengan akses mudah dari Wonogiri. Dari pusat kota Wonogiri, kamu cukup <strong>30 menit berkendara</strong> melalui Jalan Raya Wonogiri-Solo. Parkir luas tersedia, jadi nggak perlu khawatir soal kendaraan.
          </p>

          <p>
            Untuk sesi outdoor, kami bisa accommodate di berbagai lokasi menarik di sekitar Wonogiri dan Solo — mulai dari taman, perkebunan, hingga spot estetik lainnya. Diskusikan keinginanmu dengan tim kami!
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Tips Foto Prewedding untuk Warga Wonogiri
          </h2>

          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Booking minimal 2 minggu sebelumnya</strong> — Jadwal weekend cepat penuh, pastikan kamu book lebih awal</li>
            <li><strong>Bawa outfit favorit</strong> — Selain kostum dari studio, kamu boleh bawa baju sendiri untuk variasi</li>
            <li><strong>Pilih paket sesuai kebutuhan</strong> — Bronze untuk yang simpel, Gold untuk yang mau banyak variasi</li>
            <li><strong>Komunikasikan konsep</strong> — Ceritakan tema atau konsep prewedding impian kamu ke tim kami</li>
            <li><strong>Istirahat cukup sebelum sesi</strong> — Tampil segar di depan kamera itu penting!</li>
          </ol>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Booking Prewedding Sekarang
            </h3>
            <p className="text-cream-300 mb-4">
              Mau foto prewedding dari Wonogiri? Langsung chat kami! Harga mulai Rp400K sudah termasuk makeup dan kostum. Jadwal terbatas, booking sekarang!
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20booking%20foto%20prewedding%20dari%20Wonogiri"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              BOOKING VIA WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Berapa harga foto prewedding dekat Wonogiri?</h3>
              <p className="text-cream-300">CeritaKita Studio menawarkan paket prewedding mulai Rp400.000 (Bronze) hingga Rp1.300.000 (Outdoor). Sudah termasuk makeup, kostum, dan editing profesional.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Dimana studio prewedding terdekat dari Wonogiri?</h3>
              <p className="text-cream-300">CeritaKita Studio berlokasi di Sukoharjo, hanya 30 menit dari pusat Wonogiri. Akses mudah dari arah Wonogiri via Jalan Raya Wonogiri-Solo.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah ada paket prewedding outdoor dari Wonogiri?</h3>
              <p className="text-cream-300">Ada! Paket Prewedding Outdoor seharga Rp1.300.000 termasuk sesi outdoor di lokasi pilihan, full makeup, kostum, dan editing premium. Bisa di Wonogiri atau Solo.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Bagaimana cara booking foto prewedding dari Wonogiri?</h3>
              <p className="text-cream-300">Booking mudah via WhatsApp! Kirim pesan, pilih paket (Bronze/Silver/Gold/Outdoor), bayar DP, dan datang di hari yang dijadwalkan. Hasil foto dikirim via Google Drive maksimal 3 hari kerja.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
