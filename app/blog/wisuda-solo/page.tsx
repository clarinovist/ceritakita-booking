import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Foto Wisuda Solo 2026 — Studio & Outdoor Mulai Rp150K | CeritaKita",
  description: "Foto wisuda di Solo mulai Rp150K. Studio & outdoor, include toga, background, cetak. Booking sekarang di CeritaKita Studio Sukoharjo.",
  keywords: "foto wisuda solo, studio foto wisuda solo, foto wisuda murah solo, paket foto wisuda sukoharjo, foto toga solo",
  openGraph: { title: "Foto Wisuda Solo 2026 — CeritaKita Studio", description: "Foto wisuda profesional di Solo mulai Rp150K. Studio & outdoor.", url: "https://ceritakitastudio.site/blog/wisuda-solo", siteName: "CeritaKita Studio", locale: "id_ID", type: "article" },
  alternates: { canonical: "https://ceritakitastudio.site/blog/wisuda-solo" },
};

const faqData = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Berapa harga foto wisuda di Solo?", acceptedAnswer: { "@type": "Answer", text: "Di CeritaKita Studio, foto wisuda indoor Rp150.000 dan outdoor Rp350.000 (diskon dari Rp500.000)." } },
    { "@type": "Question", name: "Apakah bisa foto wisuda outdoor?", acceptedAnswer: { "@type": "Answer", text: "Bisa! Kami melayani foto wisuda outdoor di lokasi pilihan kamu. Harga Rp350.000 sudah termasuk fotografer dan editing." } },
    { "@type": "Question", name: "Berapa lama hasil foto wisuda jadi?", acceptedAnswer: { "@type": "Answer", text: "File digital dikirim via Google Drive maksimal 3 hari kerja. Cetak bisa diambil di studio." } },
    { "@type": "Question", name: "Apakah ada paket foto wisuda berkelompok?", acceptedAnswer: { "@type": "Answer", text: "Ada! Hubungi kami via WhatsApp untuk harga paket wisuda berkelompok atau angkatan." } },
  ],
};

export default function WisudaSoloPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={faqData} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" / "}<Link href="/blog" className="hover:text-gold-400">Blog</Link>{" / "}<span>Wisuda</span>
        </nav>
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">Foto Wisuda Solo: Panduan Lengkap + Harga 2026</h1>
        <p className="text-cream-300 text-sm mb-8">Terakhir diperbarui: 14 Juni 2026 · Waktu baca: 4 menit</p>
        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>Wisuda adalah momen sekali seumur hidup yang layak diabadikan dengan foto profesional. Di <strong>CeritaKita Studio</strong>, foto wisuda di Solo mulai dari <strong>Rp150 ribu</strong> saja. Lokasi kami di Sukoharjo, mudah dijangkau dari UNS, UMS, ISI, dan kampus lain di Solo Raya.</p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Paket Foto Wisuda</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead><tr className="border-b border-cream-300/20 bg-olive-800"><th className="p-3 text-left text-cream-100">Paket</th><th className="p-3 text-left text-cream-100">Harga</th><th className="p-3 text-left text-cream-100">Include</th></tr></thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10"><td className="p-3">Indoor Wisuda</td><td className="p-3 font-bold text-gold-400">Rp150.000</td><td className="p-3">Studio, background wisuda, file digital</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Outdoor Wisuda</td><td className="p-3 font-bold text-gold-400">Rp350.000 <span className="text-cream-400 line-through text-xs">Rp500.000</span></td><td className="p-3">Lokasi outdoor, fotografer, editing, file GDrive</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Cute Pas Foto</td><td className="p-3 font-bold text-gold-400">Rp125.000 <span className="text-cream-400 line-through text-xs">Rp150.000</span></td><td className="p-3">Pas foto estetik untuk dokumen wisuda</td></tr>
                <tr><td className="p-3">Mini Album (10 lembar @4R)</td><td className="p-3 font-bold text-gold-400">Rp150.000</td><td className="p-3">Album kenangan wisuda</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Tips Foto Wisuda yang Instagramable</h2>
          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Pilih waktu terbaik</strong> — Pagi hari (07.00-09.00) untuk cahaya natural yang lembut</li>
            <li><strong>Siapkan toga lengkap</strong> — Pastikan toga rapi, topi tidak penyok</li>
            <li><strong>Bawa properti</strong> — Bunga, buku, atau plakat wisuda</li>
            <li><strong>Ajak keluarga/teman</strong> — Foto bareng lebih berkesan</li>
            <li><strong>Latihan senyum</strong> — Senyum natural lebih fotogenik dari senyum dipaksa</li>
          </ol>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>
          <div className="space-y-4">
            <div><h3 className="font-bold text-cream-100">Berapa harga foto wisuda di Solo?</h3><p className="text-cream-300">Di CeritaKita Studio, foto wisuda indoor Rp150.000 dan outdoor Rp350.000 (diskon dari Rp500.000).</p></div>
            <div><h3 className="font-bold text-cream-100">Apakah bisa foto wisuda outdoor?</h3><p className="text-cream-300">Bisa! Kami melayani foto wisuda outdoor di lokasi pilihan kamu. Harga Rp350.000 sudah termasuk fotografer dan editing.</p></div>
            <div><h3 className="font-bold text-cream-100">Berapa lama hasil foto wisuda jadi?</h3><p className="text-cream-300">File digital dikirim via Google Drive maksimal 3 hari kerja.</p></div>
            <div><h3 className="font-bold text-cream-100">Apakah ada paket wisuda berkelompok?</h3><p className="text-cream-300">Ada! Hubungi kami via WhatsApp untuk harga paket wisuda berkelompok atau angkatan.</p></div>
          </div>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">Booking Foto Wisuda</h3>
            <p className="text-cream-300 mb-4">Jadwal wisuda padat? Booking sekarang untuk amankan slot!</p>
            <a href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20booking%20foto%20wisuda" className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors">BOOKING VIA WHATSAPP</a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Artikel Terkait</h2>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><Link href="/blog/studio-foto-solo" className="text-gold-400 hover:underline">Studio Foto Murah Solo — Panduan Lengkap 2026</Link></li>
            <li><Link href="/blog/self-photo-sukoharjo" className="text-gold-400 hover:underline">Self Photo Studio Sukoharjo — Mulai Rp150K</Link></li>
            <li><Link href="/blog/foto-keluarga-solo" className="text-gold-400 hover:underline">Foto Keluarga Solo — Mulai Rp300K</Link></li>
            <li><Link href="/blog/pas-foto-solo" className="text-gold-400 hover:underline">Pas Foto Solo — Mulai Rp40K</Link></li>
          </ul>
        </div>
      </article>
    </main>
  );
}
