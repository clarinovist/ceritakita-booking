import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Foto Wisuda Solo 2026: Panduan Terbaru + Harga | CeritaKita Studio",
  description: "Foto wisuda di Solo 2026 mulai Rp150K. Tips persiapan, rekomendasi studio, harga lengkap. CeritaKita Studio Sukoharjo!",
  keywords: "foto wisuda solo 2026, foto wisuda solo, wisuda solo 2026, studio foto wisuda solo, foto wisuda murah solo",
  openGraph: { title: "Foto Wisuda Solo 2026 — CeritaKita Studio", description: "Foto wisuda profesional di Solo 2026 mulai Rp150K. Tips, harga, booking.", url: "https://ceritakitastudio.site/blog/foto-wisuda-solo-2026", siteName: "CeritaKita Studio", locale: "id_ID", type: "article" },
  alternates: { canonical: "https://ceritakitastudio.site/blog/foto-wisuda-solo-2026" },
};

const faqData = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Kapan jadwal foto wisuda 2026 di Solo mulai dibuka?", acceptedAnswer: { "@type": "Answer", text: "Booking foto wisuda 2026 sudah dibuka sekarang di CeritaKita Studio. Jadwal wisuda UNS, UMS, ISI Solo biasanya mulai Agustus–September 2026. Kami sarankan booking minimal 2 minggu sebelum hari wisuda untuk amankan slot." } },
    { "@type": "Question", name: "Berapa harga foto wisuda Solo 2026?", acceptedAnswer: { "@type": "Answer", text: "Harga foto wisuda 2026 di CeritaKita Studio mulai Rp150.000 untuk indoor dan Rp350.000 untuk outdoor. Sudah termasuk studio, background wisuda, dan file digital." } },
    { "@type": "Question", name: "Bagaimana cara persiapan foto wisuda 2026?", acceptedAnswer: { "@type": "Answer", text: "Persiapan foto wisuda 2026: (1) Booking 2 minggu sebelum jadwal, (2) Siapkan toga dan topi wisuda, (3) Pilih outfit di balik toga, (4) Latihan pose dan senyum, (5) Bawa properti seperti bunga atau plakat." } },
    { "@type": "Question", name: "Berapa lama hasil foto wisuda 2026 jadi?", acceptedAnswer: { "@type": "Answer", text: "File digital foto wisuda 2026 dikirim via Google Drive maksimal 3 hari kerja. Untuk cetak fisik, bisa diambil langsung di studio CeritaKita Sukoharjo." } },
  ],
};

export default function FotoWisudaSolo2026Page() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={faqData} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" / "}<Link href="/blog" className="hover:text-gold-400">Blog</Link>{" / "}<span>Foto Wisuda Solo 2026</span>
        </nav>
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">Foto Wisuda Solo 2026: Panduan Terbaru + Harga Lengkap</h1>
        <p className="text-cream-300 text-sm mb-8">Terakhir diperbarui: 4 Agustus 2026 · Waktu baca: 5 menit</p>
        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>Momen wisuda 2026 sudah di depan mata! Kalau kamu mahasiswa UNS, UMS, ISI, atau kampus lain di Solo Raya yang akan wisuda tahun ini, jangan sampai melewatkan momen berharga tanpa foto profesional. Di <strong>CeritaKita Studio</strong>, foto wisuda di Solo mulai dari <strong>Rp150 ribu</strong> — lengkap dengan studio, background, dan file digital.</p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Jadwal Wisuda Solo 2026</h2>
          <p className="text-cream-300">Berikut estimasi jadwal wisuda di beberapa kampus besar Solo untuk tahun 2026:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead><tr className="border-b border-cream-300/20 bg-olive-800"><th className="p-3 text-left text-cream-100">Kampus</th><th className="p-3 text-left text-cream-100">Estimasi Wisuda</th><th className="p-3 text-left text-cream-100">Lokasi</th></tr></thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10"><td className="p-3">UNS (Universitas Sebelas Maret)</td><td className="p-3 font-bold text-gold-400">Agustus–September 2026</td><td className="p-3">Gedung Soepomo, Kampus Kentingan</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">UMS (Universitas Muhammadiyah Surakarta)</td><td className="p-3 font-bold text-gold-400">Agustus–September 2026</td><td className="p-3">Gedung Muhammadiyah Convention Center</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">ISI Surakarta</td><td className="p-3 font-bold text-gold-400">September 2026</td><td className="p-3">Gedung Kesenian, Kampus ISI</td></tr>
                <tr><td className="p-3">Universitas Slamet Riyadi</td><td className="p-3 font-bold text-gold-400">Oktober 2026</td><td className="p-3">Kampus Unisri</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-cream-300 text-sm italic">*Jadwal bersifat estimasi, cek pengumuman resmi kampus masing-masing.</p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Harga Foto Wisuda Solo 2026</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead><tr className="border-b border-cream-300/20 bg-olive-800"><th className="p-3 text-left text-cream-100">Paket</th><th className="p-3 text-left text-cream-100">Harga</th><th className="p-3 text-left text-cream-100">Include</th></tr></thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10"><td className="p-3">Indoor Wisuda 2026</td><td className="p-3 font-bold text-gold-400">Rp150.000</td><td className="p-3">Studio, background wisuda, 5 file digital editing</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Outdoor Wisuda 2026</td><td className="p-3 font-bold text-gold-400">Rp350.000 <span className="text-cream-400 line-through text-xs">Rp500.000</span></td><td className="p-3">Lokasi outdoor, fotografer, 10 file editing, Google Drive</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Pas Foto Wisuda 2026</td><td className="p-3 font-bold text-gold-400">Rp125.000 <span className="text-cream-400 line-through text-xs">Rp150.000</span></td><td className="p-3">Pas foto 4x6 estetik untuk dokumen wisuda</td></tr>
                <tr><td className="p-3">Mini Album Kenangan (10 lembar @4R)</td><td className="p-3 font-bold text-gold-400">Rp150.000</td><td className="p-3">Album kenangan wisuda hardcover</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Tips Persiapan Foto Wisuda 2026</h2>
          <p className="text-cream-300">Agar hasil foto wisuda 2026 kamu maksimal, simak tips berikut:</p>

          <h3 className="font-display text-xl text-cream-100 mt-8">1. Persiapan Diri</h3>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><strong>Kondisi kulit</strong> — Rawat kulit 1-2 minggu sebelum foto: minum air putih cukup, tidur teratur, gunakan moisturizer</li>
            <li><strong>Makeup</strong> — Untuk cewek, bawa makeup artist atau bawa sendiri; cowok bisa pakai BB cream ringan</li>
            <li><strong>Latihan pose</strong> — Cari referensi pose wisuda di Pinterest/Instagram sebelum hari H</li>
          </ul>

          <h3 className="font-display text-xl text-cream-100 mt-8">2. Kostum & Toga</h3>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><strong>Toga harus rapi</strong> — Setrika sehari sebelum, pastikan topi wisuda tidak penyok</li>
            <li><strong>Outfit di balik toga</strong> — Pakai baju yang kontras (putih/krem) supaya terlihat kalau toga dibuka sebagian</li>
            <li><strong>Sepatu</strong> — Pilih sepatu yang nyaman tapi tetap formal (heels untuk cewek, pantofel untuk cowok)</li>
            <li><strong>Aksesoris</strong> — Jam tangan, bros, atau kalung tipis bisa menambah elegan</li>
          </ul>

          <h3 className="font-display text-xl text-cream-100 mt-8">3. Waktu Terbaik Foto</h3>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><strong>Pagi hari (07.00-09.00)</strong> — Cahaya natural terbaik, kulit glow, background cerah</li>
            <li><strong>Golden hour (16.00-17.30)</strong> — Untuk foto outdoor, cahaya warm yang sangat flattering</li>
            <li><strong>Hindari jam 11.00-14.00</strong> — Cahaya terlalu terik, bayangan tajam, wajah kusam</li>
            </ul>

          <h3 className="font-display text-xl text-cream-100 mt-8">4. Properti yang Wajib Dibawa</h3>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li>Bunga segar atau bouquet bunga untuk foto candid</li>
            <li>Buku tebal atau laptop sebagai aksesoris studi</li>
            <li>Plakat atau spanduk wisuda (biasanya disediakan kampus)</li>
            <li>Handphone untuk foto behind the scenes</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Rekomendasi Studio Foto Wisuda Solo 2026</h2>
          <p className="text-cream-300">Solo punya banyak studio foto wisuda, tapi CeritaKita Studio di Sukoharjo jadi pilihan utama karena:</p>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><strong>Lokasi strategis</strong> — Dekat dari UNS, UMS, ISI, dan kampus Solo lainnya</li>
            <li><strong>Harga terjangkau</strong> — Mulai Rp150K, sudah termasuk editing</li>
            <li><strong>Background beragam</strong> — Tersedia background klasik, minimalis, dan aesthetic</li>
            <li><strong>Fotografer profesional</strong> — Pengalaman foto wisuda 5+ tahun</li>
            <li><strong>Fast turnaround</strong> — File digital ready dalam 3 hari kerja</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ Foto Wisuda Solo 2026</h2>
          <div className="space-y-4">
            <div><h3 className="font-bold text-cream-100">Kapan jadwal foto wisuda 2026 di Solo mulai dibuka?</h3><p className="text-cream-300">Booking foto wisuda 2026 sudah dibuka sekarang di CeritaKita Studio. Jadwal wisuda UNS, UMS, ISI Solo biasanya mulai Agustus–September 2026. Kami sarankan booking minimal 2 minggu sebelum hari wisuda untuk amankan slot.</p></div>
            <div><h3 className="font-bold text-cream-100">Berapa harga foto wisuda Solo 2026?</h3><p className="text-cream-300">Harga foto wisuda 2026 di CeritaKita Studio mulai Rp150.000 untuk indoor dan Rp350.000 untuk outdoor. Sudah termasuk studio, background wisuda, dan file digital.</p></div>
            <div><h3 className="font-bold text-cream-100">Bagaimana cara persiapan foto wisuda 2026?</h3><p className="text-cream-300">Persiapan foto wisuda 2026: (1) Booking 2 minggu sebelum jadwal, (2) Siapkan toga dan topi wisuda, (3) Pilih outfit di balik toga, (4) Latihan pose dan senyum, (5) Bawa properti seperti bunga atau plakat.</p></div>
            <div><h3 className="font-bold text-cream-100">Berapa lama hasil foto wisuda 2026 jadi?</h3><p className="text-cream-300">File digital foto wisuda 2026 dikirim via Google Drive maksimal 3 hari kerja. Untuk cetak fisik, bisa diambil langsung di studio CeritaKita Sukoharjo.</p></div>
          </div>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">📸 Foto Wisuda Solo 2026 — Rp150K</h3>
            <p className="text-cream-300 mb-4">Rating ⭐ 4.8/5 dari wisudawan. Booking sekarang untuk amankan slot jadwal wisuda 2026!</p>
            <a href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20booking%20foto%20wisuda%202026" className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors">BOOKING VIA WHATSAPP</a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Artikel Terkait</h2>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><Link href="/blog/wisuda-solo" className="text-gold-400 hover:underline">Foto Wisuda Solo — Panduan Lengkap 2026</Link></li>
            <li><Link href="/blog/studio-foto-solo" className="text-gold-400 hover:underline">Studio Foto Murah Solo — Panduan Lengkap 2026</Link></li>
            <li><Link href="/blog/self-photo-sukoharjo" className="text-gold-400 hover:underline">Self Photo Studio Sukoharjo — Mulai Rp150K</Link></li>
            <li><Link href="/blog/pas-foto-solo" className="text-gold-400 hover:underline">Pas Foto Solo — Mulai Rp40K</Link></li>
          </ul>
        </div>
      </article>
    </main>
  );
}
