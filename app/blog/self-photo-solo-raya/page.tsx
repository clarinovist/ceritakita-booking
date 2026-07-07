import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Self Photo Solo Raya: Panduan Lengkap 2026 | CeritaKita Studio",
  description:
    "Self photo terjangkau di Solo Raya mulai Rp150K. Sukoharjo, Klaten, Wonogiri, Sragen, Karanganyar, Boyolali. Booking sekarang di CeritaKita Studio!",
  keywords:
    "self photo solo raya, self photo solo, self photo sukoharjo, self photo klaten, self photo wonogiri, studio self photo solo",
  openGraph: {
    title: "Self Photo Solo Raya — CeritaKita Studio",
    description:
      "Panduan lengkap self photo di Solo Raya. Mulai Rp150K sudah termasuk makeup dan kostum adat Jawa. Melayani Sukoharjo, Klaten, Wonogiri, Sragen, Karanganyar, Boyolali.",
    url: "https://ceritakitastudio.site/blog/self-photo-solo-raya",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/self-photo-solo-raya",
  },
};

export default function SelfPhotoSoloRayaPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "Berapa harga self photo di Solo Raya?", "acceptedAnswer": {"@type": "Answer", "text": "Di CeritaKita Studio, self photo mulai dari Rp150.000 sudah termasuk makeup, kostum adat Jawa, sesi foto, dan editing. Harga berlaku untuk seluruh area Solo Raya."}}, {"@type": "Question", "name": "Self photo di Solo Raya yang mana?", "acceptedAnswer": {"@type": "Answer", "text": "CeritaKita Studio berlokasi di Sukoharjo, strategis di tengah Solo Raya. Waktu tempuh dari Klaten sekitar 30 menit, Wonogiri 45 menit, Sragen 50 menit, Karanganyar 20 menit, dan Boyolali 40 menit."}}, {"@type": "Question", "name": "Apakah self photo bisa sendirian?", "acceptedAnswer": {"@type": "Answer", "text": "Bisa! Self photo dirancang untuk solo player. Kamu akan dapat remote shutter dan bisa foto sepuasnya tanpa merasa diawasi."}}, {"@type": "Question", "name": "Bagaimana cara booking self photo?", "acceptedAnswer": {"@type": "Answer", "text": "Booking sangat mudah! Kirim pesan WhatsApp ke CeritaKita Studio, pilih tanggal dan waktu yang diinginkan. Kami sarankan booking 1-2 hari sebelumnya untuk mendapatkan slot terbaik."}}]}} />
      <JsonLd data={{"@context": "https://schema.org", "@type": "Product", "name": "Self Photo Solo Raya", "description": "Self photo tanpa fotografer, sesi 30 menit, makeup, kostum adat Jawa, semua file high-res. Melayani seluruh Solo Raya.", "brand": {"@type": "Brand", "name": "CeritaKita Studio"}, "offers": {"@type": "Offer", "price": 150000, "priceCurrency": "IDR", "availability": "https://schema.org/InStock", "seller": {"@type": "Organization", "name": "CeritaKita Studio"}}, "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "50"}}} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" "}/{\" \"}
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{" "}/{\" \"}
          <span>Self Photo Solo Raya</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Self Photo di Solo Raya: Panduan Lengkap + Harga 2026
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          11 Agustus 2026 · Waktu baca: 4 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Kamu tinggal di <strong>Solo Raya</strong> dan sedang cari self photo studio yang terjangkau? Kabar baiknya, <strong>CeritaKita Studio</strong> hadir untuk melayani seluruh kota dan kabupaten di Solo Raya — dari Sukoharjo, Klaten, Wonogiri, Sragen, Karanganyar, hingga Boyolali. Mulai dari Rp150 ribu saja, kamu sudah bisa menikmati pengalaman self photo profesional.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Self Photo Studio Terjangkau di Solo Raya
          </h2>
          <p>
            Self photo studio adalah konsep foto di mana kamu mengambil foto sendiri menggunakan remote shutter atau timer, tanpa fotografer yang berdiri di depanmu. Hasilnya lebih natural, ekspresif, dan bebas — karena kamu nggak merasa diawasi. Di CeritaKita Studio, kami memastikan kamu tetap mendapat bantuan dari tim profesional untuk lighting, ide pose, dan hasil foto yang sempurna.
          </p>
          <p>
            Studio kami berlokasi di Sukoharjo, strategis di tengah Solo Raya. Dengan akses jalan yang mudah dan parkir yang luas, kami menjadi pilihan utama bagi warga dari berbagai kota di sekitar Solo.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Jarak & Waktu Tempuh ke Studio
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead>
                <tr className="border-b border-cream-300/20 bg-olive-800">
                  <th className="p-3 text-left text-cream-100">Asal Kota</th>
                  <th className="p-3 text-left text-cream-100">Estimasi Waktu</th>
                  <th className="p-3 text-left text-cream-100">Catatan</th>
                </tr>
              </thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Sukoharjo</td>
                  <td className="p-3 font-bold text-gold-400">~10 menit</td>
                  <td className="p-3">Lokasi studio, paling dekat</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Karanganyar</td>
                  <td className="p-3 font-bold text-gold-400">~20 menit</td>
                  <td className="p-3">Via Jalan Raya Solo-Jawa Tengah</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Klaten</td>
                  <td className="p-3 font-bold text-gold-400">~30 menit</td>
                  <td className="p-3">Via Jalan Raya Solo-Klaten</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Boyolali</td>
                  <td className="p-3 font-bold text-gold-400">~40 menit</td>
                  <td className="p-3">Via Jalan Raya Boyolali-Solo</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Wonogiri</td>
                  <td className="p-3 font-bold text-gold-400">~45 menit</td>
                  <td className="p-3">Via Jalan Raya Solo-Wonogiri</td>
                </tr>
                <tr>
                  <td className="p-3">Sragen</td>
                  <td className="p-3 font-bold text-gold-400">~50 menit</td>
                  <td className="p-3">Via Jalan Raya Solo-Sragen</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Paket Self Photo Kami
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
                  <td className="p-3">Self Photo ⭐ Best Deal</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Simple makeup, kostum adat Jawa, sesi 30 menit, semua file high-res via GDrive</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Self Photo + Cute Pas Foto</td>
                  <td className="p-3 font-bold text-gold-400">Rp125.000 <span className="text-cream-400 line-through text-xs">Rp150.000</span></td>
                  <td className="p-3">Paket combo self photo + pas foto estetik</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Self Photo + Family</td>
                  <td className="p-3 font-bold text-gold-400">Rp300.000</td>
                  <td className="p-3">Foto bareng keluarga (max 6 orang), photographer, cetak 4R & 10R</td>
                </tr>
                <tr>
                  <td className="p-3">Mini Album (10 lembar @4R)</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Tambahan album untuk hasil foto self photo kamu</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Tips Self Photo untuk Warga Solo Raya
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Manfaatkan waktu perjalanan</strong> — Berangkat lebih awal agar nggak terburu-buru dan bisa menikmati sesi tanpa stres</li>
            <li><strong>Latihan pose di rumah</strong> — Cek referensi pose di Pinterest atau TikTok sebelum sesi</li>
            <li><strong>Bawa properti pribadi</strong> — Buku, bunga, atau aksesoris favorit bisa menambah kesan personal</li>
            <li><strong>Ajak teman atau keluarga</strong> — Self photo berdua atau berkelompok biasanya lebih seru, apalagi kalau datang dari kota yang sama</li>
            <li><strong>Santai dan enjoy</strong> — Jangan terlalu kaku, biarkan ekspresi natural keluar</li>
          </ol>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Kenapa Self Photo di CeritaKita?
          </h2>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Harga paling terjangkau</strong> di Solo Raya — mulai Rp150K all-in</li>
            <li><strong>Studio privat</strong> — Nggak digabung dengan customer lain, bebas berekspresi</li>
            <li><strong>Kostum adat Jawa lengkap</strong> — Kebaya, jarik, blangkon, dll</li>
            <li><strong>Makeup profesional</strong> — Tim makeup artist berpengalaman</li>
            <li><strong>Hasil edit cepat</strong> — Maksimal 3 hari, dikirim via Google Drive</li>
            <li><strong>Lokasi strategis</strong> — Di tengah Solo Raya, mudah diakses dari semua arah</li>
          </ul>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Booking Self Photo Sekarang
            </h3>
            <p className="text-cream-300 mb-4">
              Melayani seluruh Solo Raya! Self photo cuma Rp150K sudah termasuk makeup dan kostum adat Jawa. Kirim pesan sekarang untuk booking jadwal terbaikmu.
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20booking%20self%20photo"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              BOOKING VIA WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Berapa harga self photo di Solo Raya?</h3>
              <p className="text-cream-300">Di CeritaKita Studio, self photo mulai dari Rp150.000 sudah termasuk makeup, kostum adat Jawa, sesi foto, dan editing. Harga berlaku untuk seluruh area Solo Raya.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Self photo di Solo Raya yang mana?</h3>
              <p className="text-cream-300">CeritaKita Studio berlokasi di Sukoharjo, strategis di tengah Solo Raya. Waktu tempuh dari Klaten sekitar 30 menit, Wonogiri 45 menit, Sragen 50 menit, Karanganyar 20 menit, dan Boyolali 40 menit.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah self photo bisa sendirian?</h3>
              <p className="text-cream-300">Bisa! Self photo dirancang untuk solo player. Kamu akan dapat remote shutter dan bisa foto sepuasnya tanpa merasa diawasi.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Bagaimana cara booking self photo?</h3>
              <p className="text-cream-300">Booking sangat mudah! Kirim pesan WhatsApp ke CeritaKita Studio, pilih tanggal dan waktu yang diinginkan. Kami sarankan booking 1-2 hari sebelumnya untuk mendapatkan slot terbaik.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
