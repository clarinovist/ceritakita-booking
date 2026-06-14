import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Self Photo Studio Sukoharjo — Mulai Rp150K | CeritaKita Studio",
  description:
    "Self photo studio di Sukoharjo mulai Rp150K. Include makeup, kostum adat Jawa, sesi foto privat. Booking sekarang di CeritaKita Studio!",
  keywords:
    "self photo studio sukoharjo, self photo solo, self photo murah solo, studio self photo terdekat, self photo couple solo, self photo keluarga sukoharjo",
  openGraph: {
    title: "Self Photo Studio Sukoharjo — CeritaKita Studio",
    description:
      "Pengalaman self photo seru di studio profesional. Mulai Rp150K sudah termasuk makeup dan kostum adat Jawa.",
    url: "https://ceritakitastudio.site/blog/self-photo-sukoharjo",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/self-photo-sukoharjo",
  },
};

export default function SelfPhotoSukoharjoPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" "}/{" "}
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{" "}/{" "}
          <span>Self Photo Sukoharjo</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Self Photo Studio di Sukoharjo: Seru, Mudah, Mulai Rp150K
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 14 Juni 2026 · Waktu baca: 4 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Ingin foto estetik tanpa rasa canggung? <strong>Self photo studio</strong> adalah solusinya! Di CeritaKita Studio Sukoharjo, kamu bisa bebas berekspresi di depan kamera profesional tanpa ada orang lain yang mengganggu. Mulai dari Rp150 ribu saja, kamu sudah dapat pengalaman self photo yang berkesan.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Apa Itu Self Photo Studio?
          </h2>

          <p>
            Self photo studio adalah konsep foto di mana kamu mengambil foto sendiri menggunakan remote shutter atau timer, tanpa fotografer yang berdiri di depanmu. Hasilnya? Foto yang lebih natural, ekspresif, dan bebas — karena kamu nggak merasa diawasi.
          </p>

          <p>
            Di CeritaKita Studio, self photo bukan berarti kamu ditinggal sendirian. Tim kami tetap siap membantu mengatur lighting, memberikan ide pose, dan memastikan hasil foto sempurna.
          </p>

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
                  <td className="p-3">Self Photo Basic</td>
                  <td className="p-3 font-bold text-gold-400">Rp150.000</td>
                  <td className="p-3">Makeup, kostum adat Jawa, sesi 30 menit, 5 foto edit</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Self Photo Couple</td>
                  <td className="p-3 font-bold text-gold-400">Rp200.000</td>
                  <td className="p-3">Makeup 2 orang, kostum, sesi 45 menit, 8 foto edit</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Self Photo Group (3-5 orang)</td>
                  <td className="p-3 font-bold text-gold-400">Rp250.000</td>
                  <td className="p-3">Makeup, kostum, sesi 60 menit, 10 foto edit</td>
                </tr>
                <tr>
                  <td className="p-3">Self Photo + Cetak</td>
                  <td className="p-3 font-bold text-gold-400">Rp200.000</td>
                  <td className="p-3">Paket Basic + cetak 4R & 10R + file GDrive</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Tips Self Photo yang Hasilnya Maksimal
          </h2>

          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Pilih kostum yang nyaman</strong> — Kamu akan banyak bergerak, jadi pastikan kostum nggak membatasi</li>
            <li><strong>Latihan pose di rumah</strong> — Cek referensi pose di Pinterest atau TikTok sebelum sesi</li>
            <li><strong>Bawa properti pribadi</strong> — Buku, bunga, atau aksesoris favorit bisa menambah kesan personal</li>
            <li><strong>Santai dan enjoy</strong> — Jangan terlalu kaku, biarkan ekspresi natural keluar</li>
            <li><strong>Ajak teman atau pasangan</strong> — Self photo berdua atau berkelompok biasanya lebih seru</li>
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
            <li><strong>Lokasi strategis</strong> — Dekat Solo, parkir luas, akses mudah</li>
          </ul>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Booking Self Photo Sekarang
            </h3>
            <p className="text-cream-300 mb-4">
              Promo spesial bulan ini! Self photo cuma Rp150K sudah termasuk makeup dan kostum adat Jawa. Jangan sampai kehabisan jadwal!
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
              <h3 className="font-bold text-cream-100">Berapa harga self photo di Sukoharjo?</h3>
              <p className="text-cream-300">Di CeritaKita Studio, self photo mulai dari Rp150.000 sudah termasuk makeup, kostum adat Jawa, sesi foto, dan editing.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah self photo bisa sendirian?</h3>
              <p className="text-cream-300">Bisa! Self photo dirancang untuk solo player. Kamu akan dapat remote shutter dan bisa foto sepuasnya.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Berapa lama sesi self photo?</h3>
              <p className="text-cream-300">Sesi basic 30 menit, couple 45 menit, group 60 menit. Waktu sudah termasuk ganti kostum dan makeup.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah hasilnya bisa langsung dibawa pulang?</h3>
              <p className="text-cream-300">File digital dikirim via Google Drive maksimal 3 hari kerja. Untuk cetak, bisa diambil di studio atau dikirim.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
