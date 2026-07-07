import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Foto Profesional untuk CV Kerja: Tips & Harga 2026 | CeritaKita Studio",
  description: "Butuh foto profesional untuk CV? Mulai Rp40K di CeritaKita Studio. Tips pose, background, dan dresscode untuk foto CV.",
  keywords: "foto profesional cv kerja, foto cv, foto untuk lamaran kerja, foto profesional solo, foto linkedin, foto headshot profesional",
  openGraph: { title: "Foto Profesional untuk CV Kerja — CeritaKita Studio", description: "Tips dan harga foto profesional untuk CV kerja mulai Rp40K di CeritaKita Studio Solo.", url: "https://ceritakitastudio.site/blog/foto-studio-untuk-cv-kerja", siteName: "CeritaKita Studio", locale: "id_ID", type: "article" },
  alternates: { canonical: "https://ceritakitastudio.site/blog/foto-studio-untuk-cv-kerja" },
};

const faqData = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Berapa harga foto profesional untuk CV?", acceptedAnswer: { "@type": "Answer", text: "Di CeritaKita Studio, foto profesional untuk CV mulai Rp40.000. Foto sudah termasuk cetak dan file digital untuk keperluan lamaran kerja." } },
    { "@type": "Question", name: "Ukuran foto CV yang benar berapa?", acceptedAnswer: { "@type": "Answer", text: "Umumnya ukuran foto CV adalah 3x4 atau 4x6. Di CeritaKita Studio tersedia semua ukuran dan bisa disesuaikan dengan kebutuhan lamaran kerja Anda." } },
    { "@type": "Question", name: "Apa yang harus dipakai untuk foto CV?", acceptedAnswer: { "@type": "Answer", text: "Pakai baju formal atau semi-formal dengan warna solid (tidak motif ramai). Kemeja atau blazer recommended untuk kesan profesional." } },
    { "@type": "Question", name: "Apakah foto CV harus berlatar belakang tertentu?", acceptedAnswer: { "@type": "Answer", text: "Tidak ada ketentuan resmi, tapi background putih atau biru muda paling umum untuk foto CV di Indonesia. Di CeritaKita Studio tersedia berbagai pilihan background." } },
  ],
};

export default function FotoStudioUntukCvKerjaPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={faqData} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{' / '}<Link href="/blog" className="hover:text-gold-400">Blog</Link>{' / '}<span>Foto CV Kerja</span>
        </nav>
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">Foto Profesional untuk CV Kerja: Tips & Harga 2026</h1>
        <p className="text-cream-300 text-sm mb-8">Terakhir diperbarui: 18 Agustus 2026 · Waktu baca: 3 menit</p>
        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>Saat melamar kerja, foto profesional di CV jadi kesan pertama HR. Di <strong>CeritaKita Studio</strong>, foto profesional untuk CV mulai dari <strong>Rp40 ribu</strong> saja. Hasil rapi, profesional, dan siap kirim ke perusahaan impian Anda.</p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Tips Foto CV yang Tepat</h2>
          <div className="space-y-4">
            <div className="bg-olive-800 p-4 rounded-lg border border-cream-300/10">
              <h3 className="font-bold text-cream-100">👔 Dresscode yang Tepat</h3>
              <ul className="list-disc list-inside space-y-2 text-cream-300 mt-2">
                <li>Pakai <strong>kemeja atau blazer</strong> untuk kesan formal dan profesional</li>
                <li>Hindari baju dengan motif ramai — pilih warna solid (putih, biru navy, hitam)</li>
                <li>Untuk wanita, blouse polos atau blazer lebih disarankan daripada kaos</li>
                <li>Hindari aksesori berlebihan yang mengalihkan perhatian dari wajah</li>
              </ul>
            </div>
            <div className="bg-olive-800 p-4 rounded-lg border border-cream-300/10">
              <h3 className="font-bold text-cream-100">📸 Background Profesional</h3>
              <ul className="list-disc list-inside space-y-2 text-cream-300 mt-2">
                <li><strong>Background putih</strong> — paling netral, cocok untuk semua industri</li>
                <li><strong>Background biru muda</strong> — populer untuk lamaran kerja di Indonesia</li>
                <li><strong>Background abu-abu</strong> — modern dan elegan, cocok untuk startup</li>
                <li>Hindari background bermotif atau warna mencolok</li>
              </ul>
            </div>
            <div className="bg-olive-800 p-4 rounded-lg border border-cream-300/10">
              <h3 className="font-bold text-cream-100">🎭 Pose & Ekspresi</h3>
              <ul className="list-disc list-inside space-y-2 text-cream-300 mt-2">
                <li><strong>Ekspresi ramah</strong> — senyum tipis (bukan lebar) untuk kesan friendly tapi profesional</li>
                <li>Pandangan lurus ke kamera, bahu rata, dan posisi badan sedikit miring</li>
                <li>Hindari pose kaku — santai tapi tetap tegap</li>
                <li>Kacamata boleh dipakai selama tidak ada refleksi lampu studio</li>
              </ul>
            </div>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Harga Foto Profesional untuk CV</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead><tr className="border-b border-cream-300/20 bg-olive-800"><th className="p-3 text-left text-cream-100">Paket</th><th className="p-3 text-left text-cream-100">Harga</th><th className="p-3 text-left text-cream-100">Include</th></tr></thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10"><td className="p-3">Foto CV Standar</td><td className="p-3 font-bold text-gold-400">Rp40.000</td><td className="p-3">Foto 3x4 & 4x6, cetak + file digital</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Foto CV Premium</td><td className="p-3 font-bold text-gold-400">Rp75.000</td><td className="p-3">Retouching wajah, 3 background, file HD</td></tr>
                <tr><td className="p-3">Paket Lamaran Kerja</td><td className="p-3 font-bold text-gold-400">Rp100.000</td><td className="p-3">Foto CV + foto formal full body + file digital</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Mengapa Foto Profesional Penting untuk CV?</h2>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Kesan pertama HRD</strong> — Foto profesional membuat CV terlihat lebih serius dan terpercaya</li>
            <li><strong>Standar industri</strong> — Banyak perusahaan, terutama di sektor formal, memerlukan foto di CV</li>
            <li><strong>Branding diri</strong> — Foto bagus bisa dipakai juga untuk LinkedIn dan profil profesional</li>
            <li><strong>Kepercayaan diri</strong> — Dengan foto yang rapi, Anda lebih percaya diri mengirim lamaran</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>
          <div className="space-y-4">
            <div><h3 className="font-bold text-cream-100">Berapa harga foto profesional untuk CV?</h3><p className="text-cream-300">Mulai Rp40.000 untuk foto CV standar. Paket premium dengan retouching tersedia mulai Rp75.000.</p></div>
            <div><h3 className="font-bold text-cream-100">Ukuran foto CV yang benar berapa?</h3><p className="text-cream-300">Umumnya 3x4 atau 4x6. Di CeritaKita Studio tersedia semua ukuran dan bisa disesuaikan dengan kebutuhan.</p></div>
            <div><h3 className="font-bold text-cream-100">Apa yang harus dipakai untuk foto CV?</h3><p className="text-cream-300">Kemeja atau blazer dengan warna solid. Hindari motif ramai dan aksesori berlebihan.</p></div>
            <div><h3 className="font-bold text-cream-100">Background foto CV harus apa?</h3><p className="text-cream-300">Putih atau biru muda paling umum. Tersedia berbagai pilihan background di studio kami.</p></div>
          </div>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">Foto CV Sekarang</h3>
            <p className="text-cream-300 mb-4">Siap melamar kerja? Foto profesional Anda siap dalam 10-15 menit. Mulai Rp40K!</p>
            <a href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20butuh%20foto%20profesional%20untuk%20CV" className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors">CHAT WHATSAPP</a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Artikel Terkait</h2>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><Link href="/blog/pas-foto-solo" className="text-gold-400 hover:underline">Pas Foto Solo: Foto Dokumen Profesional</Link></li>
            <li><Link href="/blog/studio-foto-solo" className="text-gold-400 hover:underline">Studio Foto Murah Solo</Link></li>
            <li><Link href="/blog/self-photo-sukoharjo" className="text-gold-400 hover:underline">Self Photo Studio Sukoharjo</Link></li>
          </ul>
        </div>
      </article>
    </main>
  );
}
