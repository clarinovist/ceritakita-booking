import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Studio Foto Wonogiri: Panduan Lengkap + Harga 2026 | CeritaKita Studio",
  description:
    "Studio foto Wonogiri terdekat mulai Rp40K. Pas foto, self photo, wisuda, prewedding. Booking sekarang di CeritaKita Studio Sukoharjo!",
  keywords:
    "studio foto wonogiri, foto studio wonogiri, studio foto murah wonogiri, self photo wonogiri, foto wisuda wonogiri, foto prewedding wonogiri, fotografer wonogiri",
  openGraph: {
    title: "Studio Foto Wonogiri: Panduan Lengkap + Harga 2026 | CeritaKita Studio",
    description:
      "Panduan lengkap studio foto terdekat dari Wonogiri. Mulai Rp40K, pelayanan profesional, hasil berkualitas tinggi.",
    url: "https://ceritakitastudio.site/blog/studio-foto-wonogiri",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/studio-foto-wonogiri",
  },
};

export default function StudioFotoWonogiriPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "Apakah ada studio foto di Wonogiri?", "acceptedAnswer": {"@type": "Answer", "text": "Studio foto terdekat dari Wonogiri adalah CeritaKita Studio di Sukoharjo, hanya 30 menit perjalanan. Kami melayani pas foto, self photo, wisuda, keluarga, hingga prewedding."}}, {"@type": "Question", "name": "Berapa harga pas foto di CeritaKita Studio?", "acceptedAnswer": {"@type": "Answer", "text": "Harga pas foto mulai dari Rp40.000 untuk 6 lembar. Sudah termasuk editing dan background pilihan."}}, {"@type": "Question", "name": "Bagaimana cara booking dari Wonogiri?", "acceptedAnswer": {"@type": "Answer", "text": "Cukup hubungi kami via WhatsApp di 0851-9083-2058. Pilih tanggal dan paket, lalu konfirmasi via transfer atau bayar di tempat. Kami juga melayani booking online via website."}}, {"@type": "Question", "name": "Apakah bisa foto prewedding dari Wonogiri?", "acceptedAnswer": {"@type": "Answer", "text": "Bisa! CeritaKita Studio melayani prewedding indoor mulai Rp400.000 dan outdoor mulai Rp1.300.000. Banyak pasangan dari Wonogiri yang sudah mempercayakan momen prewedding mereka kepada kami."}}]}} />
      <JsonLd data={{"@context": "https://schema.org", "@type": "Product", "name": "Studio Foto Wonogiri", "description": "Self photo dan pas foto profesional, sesi 30 menit, editing, file high-res", "brand": {"@type": "Brand", "name": "CeritaKita Studio"}, "offers": {"@type": "Offer", "price": 150000, "priceCurrency": "IDR", "availability": "https://schema.org/InStock", "seller": {"@type": "Organization", "name": "CeritaKita Studio"}}, "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "50"}}} />
      <JsonLd data={{"@context": "https://schema.org", "@type": "Product", "name": "Foto Keluarga Wonogiri", "description": "Foto keluarga dengan fotografer profesional, max 6 orang, cetak 4R & 10R", "brand": {"@type": "Brand", "name": "CeritaKita Studio"}, "offers": {"@type": "Offer", "price": 300000, "priceCurrency": "IDR", "availability": "https://schema.org/InStock", "seller": {"@type": "Organization", "name": "CeritaKita Studio"}}, "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "50"}}} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" "}/{ " " }
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{" "}/{ " " }
          <span>Studio Foto Wonogiri</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Studio Foto di Wonogiri: Panduan Lengkap + Harga 2026
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 7 Juli 2026 · Waktu baca: 5 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Mencari <strong>studio foto di Wonogiri</strong> yang berkualitas dengan harga terjangkau? CeritaKita Studio Sukoharjo adalah pilihan terbaik untuk warga Wonogiri yang ingin mendapatkan hasil foto profesional. Hanya 30 menit perjalanan dari Wonogiri, kamu sudah bisa menikmati layanan studio foto lengkap — mulai dari pas foto, self photo, wisuda, keluarga, hingga prewedding.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Kenapa Pilih CeritaKita Studio dari Wonogiri?
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Lokasi strategis</strong> — CeritaKita Studio berada di Sukoharjo, hanya 30 menit dari Wonogiri melalui Jalan Solo–Wonogiri</li>
            <li><strong>Harga paling terjangkau</strong> di Solo Raya — mulai Rp40K untuk pas foto, Rp150K untuk self photo</li>
            <li><strong>Layanan lengkap</strong> — Pas foto, self photo, wisuda, keluarga, birthday, prewedding, outdoor, dan wedding</li>
            <li><strong>Studio privat</strong> — Nggak digabung dengan customer lain, bebas berekspresi</li>
            <li><strong>Kostum adat Jawa lengkap</strong> — Kebaya, jarik, blangkon, dan berbagai aksesoris tradisional</li>
            <li><strong>Makeup profesional</strong> — Tim makeup artist berpengalaman siap mempercantikmu</li>
            <li><strong>Hasil edit cepat</strong> — Maksimal 3 hari kerja, dikirim via Google Drive</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Daftar Harga Lengkap
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
                  <td className="p-3">6 lembar, editing, background pilihan</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Self Photo ⭐ Best Deal</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Simple makeup, kostum adat Jawa, sesi 30 menit, semua file high-res via GDrive</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Wisuda</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Foto wisuda dengan toga, editing, file digital</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Birthday</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Foto ulang tahun dengan dekorasi, editing, file digital</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Family</td>
                  <td className="p-3 font-bold text-gold-400">Rp300.000</td>
                  <td className="p-3">Foto keluarga (max 6 orang), photographer, cetak 4R & 10R</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Bronze</td>
                  <td className="p-3 font-bold text-gold-400">Rp400.000</td>
                  <td className="p-3">Studio indoor, 1 set baju, editing, file digital</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Silver</td>
                  <td className="p-3 font-bold text-gold-400">Rp600.000</td>
                  <td className="p-3">Studio indoor, 2 set baju, makeup, editing, file digital</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Gold</td>
                  <td className="p-3 font-bold text-gold-400">Rp800.000</td>
                  <td className="p-3">Studio indoor, 3 set baju, makeup, editing, album mini</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Outdoor</td>
                  <td className="p-3 font-bold text-gold-400">Rp1.300.000</td>
                  <td className="p-3">Lokasi outdoor pilihan, 2 set baju, makeup, editing, file digital</td>
                </tr>
                <tr>
                  <td className="p-3">Wedding</td>
                  <td className="p-3 font-bold text-gold-400">Rp1.300.000</td>
                  <td className="p-3">Foto wedding lengkap, editing, file digital, album</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Cara Booking dari Wonogiri
          </h2>

          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Hubungi kami via WhatsApp</strong> — Kirim pesan ke 0851-9083-2058 dengan menyebutkan paket yang diinginkan dan tanggal yang diinginkan</li>
            <li><strong>Pilih paket dan jadwal</strong> — Tim kami akan merespons dengan pilihan jadwal yang tersedia</li>
            <li><strong>Konfirmasi booking</strong> — Lakukan pembayaran DP atau bayar langsung di tempat</li>
            <li><strong>Hari H</strong> — Datang ke studio sesuai jadwal, bawa dokumen yang diperlukan (jika pas foto/wisuda)</li>
            <li><strong>Terima hasil</strong> — File digital dikirim via Google Drive maksimal 3 hari kerja</li>
          </ol>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Booking Studio Foto Sekarang
            </h3>
            <p className="text-cream-300 mb-4">
              Mau foto dari Wonogiri? CeritaKita Studio hanya 30 menit perjalanan! Booking sekarang dapat harga spesial. Mulai Rp40K untuk pas foto, Rp150K untuk self photo. Jangan sampai kehabisan jadwal!
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20dari%20Wonogiri%20mau%20booking%20sesi%20foto"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              BOOKING VIA WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Apakah ada studio foto di Wonogiri?</h3>
              <p className="text-cream-300">Studio foto terdekat dari Wonogiri adalah CeritaKita Studio di Sukoharjo, hanya 30 menit perjalanan. Kami melayani pas foto, self photo, wisuda, keluarga, hingga prewedding.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Berapa harga pas foto di CeritaKita Studio?</h3>
              <p className="text-cream-300">Harga pas foto mulai dari Rp40.000 untuk 6 lembar. Sudah termasuk editing dan background pilihan.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Bagaimana cara booking dari Wonogiri?</h3>
              <p className="text-cream-300">Cukup hubungi kami via WhatsApp di 0851-9083-2058. Pilih tanggal dan paket, lalu konfirmasi via transfer atau bayar di tempat. Kami juga melayani booking online via website.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah bisa foto prewedding dari Wonogiri?</h3>
              <p className="text-cream-300">Bisa! CeritaKita Studio melayani prewedding indoor mulai Rp400.000 dan outdoor mulai Rp1.300.000. Banyak pasangan dari Wonogiri yang sudah mempercayakan momen prewedding mereka kepada kami.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
