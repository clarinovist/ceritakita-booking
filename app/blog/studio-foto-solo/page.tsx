import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Studio Foto Murah Solo 2026 — Harga Mulai Rp150K | CeritaKita Studio",
  description:
    "Cari studio foto murah di Solo? CeritaKita Studio Sukoharjo mulai Rp150K. Self photo, prewedding, wisuda, family. Booking online atau WhatsApp.",
  keywords:
    "studio foto solo, studio foto murah solo, studio foto sukoharjo, self photo solo, foto prewedding solo, foto wisuda solo, foto keluarga solo, studio foto terdekat",
  openGraph: {
    title: "Studio Foto Murah Solo 2026 — CeritaKita Studio",
    description:
      "Studio foto profesional di Sukoharjo, dekat Solo. Self photo Rp150K, prewedding, wisuda, family. Booking sekarang!",
    url: "https://ceritakitastudio.site/blog/studio-foto-solo",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/studio-foto-solo",
  },
};

export default function StudioFotoSoloPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "Berapa harga self photo di Solo?", "acceptedAnswer": {"@type": "Answer", "text": "Di CeritaKita Studio, self photo mulai dari Rp150.000 sudah termasuk makeup, kostum adat Jawa, sesi foto, dan editing."}}, {"@type": "Question", "name": "Apakah ada studio foto murah dekat Solo?", "acceptedAnswer": {"@type": "Answer", "text": "Ya, CeritaKita Studio berlokasi di Sukoharjo, hanya 15 menit dari pusat kota Solo. Harga mulai Rp150K untuk self photo."}}, {"@type": "Question", "name": "Berapa lama proses editing foto?", "acceptedAnswer": {"@type": "Answer", "text": "Hasil edit maksimal 3 hari kerja. File dikirim via Google Drive dan bisa diambil langsung di studio."}}, {"@type": "Question", "name": "Apakah bisa booking online?", "acceptedAnswer": {"@type": "Answer", "text": "Bisa! Anda bisa booking melalui WhatsApp atau langsung di website kami di halaman Booking."}}]}} />
      <JsonLd data={{"@context": "https://schema.org", "@type": "Product", "name": "Self Photo Studio Solo", "description": "Self photo tanpa fotografer, sesi 30 menit, makeup, kostum adat Jawa, semua file high-res via Google Drive", "brand": {"@type": "Brand", "name": "CeritaKita Studio"}, "offers": {"@type": "Offer", "price": 150000, "priceCurrency": "IDR", "availability": "https://schema.org/InStock", "seller": {"@type": "Organization", "name": "CeritaKita Studio"}}, "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "50"}}} />
      <JsonLd data={{"@context": "https://schema.org", "@type": "Product", "name": "Foto Keluarga Solo", "description": "Foto keluarga max 6 orang, photographer, asisten, cetak 4R & 10R, file GDrive", "brand": {"@type": "Brand", "name": "CeritaKita Studio"}, "offers": {"@type": "Offer", "price": 300000, "priceCurrency": "IDR", "availability": "https://schema.org/InStock", "seller": {"@type": "Organization", "name": "CeritaKita Studio"}}, "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "50"}}} />
      <JsonLd data={{"@context": "https://schema.org", "@type": "Product", "name": "Prewedding Studio Solo", "description": "Prewedding Bronze: 15 foto edit, 1 jam studio, max 2 orang", "brand": {"@type": "Brand", "name": "CeritaKita Studio"}, "offers": {"@type": "Offer", "price": 400000, "priceCurrency": "IDR", "availability": "https://schema.org/InStock", "seller": {"@type": "Organization", "name": "CeritaKita Studio"}}, "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "50"}}} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        {/* Breadcrumb */}
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/blog" className="hover:text-gold-400">
            Blog
          </Link>{" "}
          / <span>Studio Foto Solo</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Studio Foto Murah di Solo: Panduan Lengkap 2026
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 14 Juni 2026 · Waktu baca: 5 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Mencari <strong>studio foto murah di Solo</strong> yang tetap
            berkualitas? CeritaKita Studio hadir di Sukoharjo dengan harga mulai
            Rp150 ribu saja. Lokasi kami hanya 15 menit dari pusat kota Solo,
            mudah diakses dari Karanganyar, Klaten, dan Wonogiri.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Kenapa Pilih CeritaKita Studio?
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li>
              <strong>Harga terjangkau</strong> — Self photo mulai Rp150K sudah
              termasuk makeup dan kostum adat Jawa
            </li>
            <li>
              <strong>Fotografer profesional</strong> — Tim berpengalaman yang
              siap mengarahkan gaya terbaik Anda
            </li>
            <li>
              <strong>Studio nyaman</strong> — Ruangan full AC dengan berbagai
              pilihan background
            </li>
            <li>
              <strong>Proses cepat</strong> — Preview foto instan, hasil edit
              maksimal 3 hari
            </li>
            <li>
              <strong>Privasi terjaga</strong> — Sesi foto privat, tidak
              digabung dengan customer lain
            </li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Daftar Harga Studio Foto Solo 2026
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
                  <td className="p-3">Pas foto dokumen (nikah, visa, kerja, ijazah)</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Self Photo ⭐</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Makeup, kostum adat Jawa, sesi 30 menit, semua file high-res</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Indoor Wisuda</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Studio, background wisuda, file digital</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Birthday</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Sesi foto spesial ulang tahun</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Foto Keluarga (6 orang)</td>
                  <td className="p-3 font-bold text-gold-400">Rp300.000</td>
                  <td className="p-3">Photographer, asisten, cetak 4R & 10R, file GDrive</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Bronze</td>
                  <td className="p-3 font-bold text-gold-400">Rp400.000</td>
                  <td className="p-3">15 foto edit, 1 jam studio, max 2 orang, 1 outfit</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Silver</td>
                  <td className="p-3 font-bold text-gold-400">Rp600.000</td>
                  <td className="p-3">Makeup & hairdo, fotografer, 10 foto edit, cetak 4R</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Gold</td>
                  <td className="p-3 font-bold text-gold-400">Rp800.000</td>
                  <td className="p-3">Paket lengkap prewedding premium</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Outdoor / On Location ⭐</td>
                  <td className="p-3 font-bold text-gold-400">Rp1.300.000 <span className="text-cream-400 line-through text-xs">Rp1.500.000</span></td>
                  <td className="p-3">30+ foto edit, 2 jam, 1 lokasi outdoor, file GDrive</td>
                </tr>
                <tr>
                  <td className="p-3">Wedding Gold</td>
                  <td className="p-3 font-bold text-gold-400">Rp1.300.000</td>
                  <td className="p-3">Full day, fotografer profesional, album</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-cream-400 italic">
            * Harga dapat berubah sewaktu-waktu. Hubungi kami untuk harga
            terbaru dan promo bulan ini.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Lokasi Studio Foto Kami
          </h2>

          <p>
            CeritaKita Studio berlokasi di{" "}
            <strong>
              Jl. Pahlawan No.8, Triyagan, Kec. Mojolaban, Kabupaten Sukoharjo,
              Jawa Tengah 57554
            </strong>
            . Lokasi strategis, mudah dijangkau dari:
          </p>

          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li>Kota Solo (±15 menit)</li>
            <li>Karanganyar (±20 menit)</li>
            <li>Klaten (±25 menit)</li>
            <li>Wonogiri (±30 menit)</li>
            <li>Sragen (±35 menit)</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Cara Booking
          </h2>

          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li>
              Pilih paket foto yang sesuai (self photo, family, prewedding, dll)
            </li>
            <li>Hubungi kami via WhatsApp untuk cek jadwal tersedia</li>
            <li>Tentukan tanggal dan waktu sesi foto</li>
            <li>Lakukan pembayaran DP untuk konfirmasi booking</li>
            <li>Datang ke studio sesuai jadwal yang sudah disepakati</li>
          </ol>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Booking Sekarang
            </h3>
            <p className="text-cream-300 mb-4">
              Jangan lewatkan promo bulan ini! Self photo cuma Rp150K sudah
              termasuk makeup dan kostum adat Jawa.
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20tertarik%20booking%20sesi%20foto"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              CHAT WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Pertanyaan Umum (FAQ)
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">
                Berapa harga self photo di Solo?
              </h3>
              <p className="text-cream-300">
                Di CeritaKita Studio, self photo mulai dari Rp150.000 sudah
                termasuk makeup, kostum adat Jawa, sesi foto, dan editing.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">
                Apakah ada studio foto murah dekat Solo?
              </h3>
              <p className="text-cream-300">
                Ya, CeritaKita Studio berlokasi di Sukoharjo, hanya 15 menit
                dari pusat kota Solo. Harga mulai Rp150K untuk self photo.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">
                Berapa lama proses editing foto?
              </h3>
              <p className="text-cream-300">
                Hasil edit maksimal 3 hari kerja. File dikirim via Google Drive
                dan bisa diambil langsung di studio.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">
                Apakah bisa booking online?
              </h3>
              <p className="text-cream-300">
                Bisa! Anda bisa booking melalui WhatsApp atau langsung di
                website kami di halaman Booking.
              </p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
