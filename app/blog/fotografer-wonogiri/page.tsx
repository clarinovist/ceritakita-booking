import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Fotografer Wonogiri: Jasa Foto Profesional Mulai Rp150K | CeritaKita Studio",
  description:
    "Butuh fotografer di Wonogiri? CeritaKita Studio Sukoharjo sediakan fotografer profesional mulai Rp150K. Self photo, wisuda, prewedding, keluarga.",
  keywords:
    "fotografer wonogiri, jasa foto wonogiri, fotografer profesional wonogiri, fotografer murah wonogiri, jasa fotografer wonogiri, fotografer wedding wonogiri",
  openGraph: {
    title: "Fotografer Wonogiri — CeritaKita Studio",
    description:
      "Jasa fotografer profesional dekat Wonogiri mulai Rp150K. Termasuk makeup, kostum adat Jawa, dan editing profesional. Booking sekarang!",
    url: "https://ceritakitastudio.site/blog/fotografer-wonogiri",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/fotografer-wonogiri",
  },
};

export default function FotograferWonogiriPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Dimana saya bisa cari fotografer terbaik dari Wonogiri?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CeritaKita Studio berlokasi di Sukoharjo, hanya 30 menit dari Wonogiri. Kami menyediakan fotografer profesional dengan peralatan lengkap dan studio privat yang nyaman."
            }
          },
          {
            "@type": "Question",
            "name": "Berapa biaya jasa fotografer dari Wonogiri?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "CeritaKita Studio menawarkan jasa fotografer mulai Rp150.000 untuk self photo, Rp40.000 untuk pas foto, hingga Rp1.300.000 untuk paket wedding. Sudah termasuk makeup dan editing profesional."
            }
          },
          {
            "@type": "Question",
            "name": "Apakah fotografer melayani di luar studio di Wonogiri?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Ya! Selain sesi studio, kami juga melayani outdoor photo session di lokasi pilihan Anda di sekitar Wonogiri atau Solo Raya. Kami bisa datang ke lokasi dengan tim dan peralatan lengkap."
            }
          },
          {
            "@type": "Question",
            "name": "Jenis foto apa saja yang ditawarkan fotografer Wonogiri?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tersedia pas foto, self photo, foto wisuda, foto keluarga, prewedding (Bronze/Silver/Gold), outdoor, dan wedding. Semua paket include makeup, kostum, dan editing profesional."
            }
          }
        ]
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Fotografer Wonogiri",
        "description": "Jasa fotografer profesional dari CeritaKita Studio Sukoharjo untuk klien Wonogiri. Termasuk makeup, kostum adat Jawa, sesi foto 30 menit, dan editing profesional.",
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
        "name": "Foto Wedding Wonogiri",
        "description": "Paket fotografer wedding profesional dari CeritaKita Studio untuk klien Wonogiri. Makeup, baju pengantin, dan editing premium.",
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
          <span>Fotografer Wonogiri</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Fotografer Profesional di Wonogiri: Panduan + Harga 2026
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 21 Juli 2026 · Waktu baca: 5 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Butuh <strong>fotografer profesional di Wonogiri</strong>? Kamu nggak perlu repot cari ke kota besar! CeritaKita Studio di Sukoharjo hadir sebagai solusi fotografer terpercaya cuma <strong>30 menit dari Wonogiri</strong> — dekat, terjangkau, dan berpengalaman. Dari self photo hingga wedding, fotografer kami siap mengabadikan momen spesial kamu dengan hasil terbaik.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Kenapa Pilih Fotografer CeritaKita Studio untuk Warga Wonogiri?
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Fotografer berpengalaman</strong> — Tim profesional yang sudah menangani ratusan sesi foto dari berbagai daerah</li>
            <li><strong>Jarak dekat dari Wonogiri</strong> — Cuma 30 menit via Jalan Raya Solo-Wonogiri</li>
            <li><strong>Harga paling terjangkau</strong> di Solo Raya — mulai Rp40K untuk pas foto</li>
            <li><strong>Studio privat</strong> — Nggak digabung dengan customer lain, bebas berekspresi</li>
            <li><strong>Kostum adat Jawa lengkap</strong> — Kebaya, jarik, blangkon, dan aksesoris</li>
            <li><strong>Makeup profesional</strong> — Tim makeup artist berpengalaman</li>
            <li><strong>Hasil edit cepat</strong> — Maksimal 3 hari kerja, dikirim via Google Drive</li>
            <li><strong>Parkir luas</strong> dan akses mudah dari arah Wonogiri</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Daftar Harga Jasa Fotografer 2026
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
            Cara Booking Fotografer dari Wonogiri
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
              Booking Fotografer Sekarang
            </h3>
            <p className="text-cream-300 mb-4">
              Butuh fotografer dari Wonogiri? Langsung chat kami! Harga mulai Rp150K sudah termasuk makeup dan kostum adat Jawa. Jadwal terbatas, booking sekarang!
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20butuh%20fotografer%20di%20Wonogiri"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              BOOKING VIA WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Dimana saya bisa cari fotografer terbaik dari Wonogiri?</h3>
              <p className="text-cream-300">CeritaKita Studio berlokasi di Sukoharjo, hanya 30 menit dari Wonogiri. Kami menyediakan fotografer profesional dengan peralatan lengkap dan studio privat yang nyaman.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Berapa biaya jasa fotografer dari Wonogiri?</h3>
              <p className="text-cream-300">CeritaKita Studio menawarkan jasa fotografer mulai Rp150.000 untuk self photo, Rp40.000 untuk pas foto, hingga Rp1.300.000 untuk paket wedding. Sudah termasuk makeup dan editing profesional.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah fotografer melayani di luar studio di Wonogiri?</h3>
              <p className="text-cream-300">Ya! Selain sesi studio, kami juga melayani outdoor photo session di lokasi pilihan Anda di sekitar Wonogiri atau Solo Raya. Kami bisa datang ke lokasi dengan tim dan peralatan lengkap.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Jenis foto apa saja yang ditawarkan fotografer Wonogiri?</h3>
              <p className="text-cream-300">Tersedia pas foto, self photo, foto wisuda, foto keluarga, prewedding (Bronze/Silver/Gold), outdoor, dan wedding. Semua paket include makeup, kostum, dan editing profesional.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
