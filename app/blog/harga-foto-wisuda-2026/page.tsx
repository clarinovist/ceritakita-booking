import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Harga Foto Wisuda 2026: Perbandingan Solo Raya | CeritaKita Studio",
  description: "Daftar harga foto wisuda 2026 di Solo, Sukoharjo, Klaten, Wonogiri. Mulai Rp150K.",
  keywords: "harga foto wisuda 2026, harga foto wisuda solo, biaya foto wisuda, foto wisuda murah 2026, paket foto wisuda solo",
  openGraph: { title: "Harga Foto Wisuda 2026 — Perbandingan Solo Raya", description: "Daftar harga foto wisuda 2026 di Solo Raya. Mulai Rp150K.", url: "https://ceritakitastudio.site/blog/harga-foto-wisuda-2026", siteName: "CeritaKita Studio", locale: "id_ID", type: "article" },
  alternates: { canonical: "https://ceritakitastudio.site/blog/harga-foto-wisuda-2026" },
};

const faqData = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Berapa harga foto wisuda 2026 di Solo?", acceptedAnswer: { "@type": "Answer", text: "Harga foto wisuda di Solo mulai Rp150.000 untuk indoor studio dan Rp350.000 untuk outdoor. Sudah termasuk editing dan file digital." } },
    { "@type": "Question", name: "Apa yang termasuk dalam paket foto wisuda?", acceptedAnswer: { "@type": "Answer", text: "Paket indoor termasuk studio, background wisuda, dan file digital. Paket outdoor termasuk fotografer, lokasi, editing, dan file via Google Drive." } },
    { "@type": "Question", name: "Apakah ada harga khusus untuk foto wisuda berkelompok?", acceptedAnswer: { "@type": "Answer", text: "Ya, kami menyediakan harga khusus untuk pemesanan berkelompok. Hubungi kami via WhatsApp untuk mendapatkan penawaran terbaik." } },
    { "@type": "Question", name: "Bagaimana cara booking foto wisuda di CeritaKita?", acceptedAnswer: { "@type": "Answer", text: "Cukup klik tombol Booking via WhatsApp di bawah, pilih jadwal, dan lakukan pembayaran. Kami akan konfirmasi dalam 1×24 jam." } },
  ],
};

export default function HargaFotoWisuda2026Page() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={faqData} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{ " / " }<Link href="/blog" className="hover:text-gold-400">Blog</Link>{ " / " }<span>Harga Foto Wisuda</span>
        </nav>
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">Harga Foto Wisuda 2026: Perbandingan Lengkap Solo Raya</h1>
        <p className="text-cream-300 text-sm mb-8">Terakhir diperbarui: 18 Agustus 2026 · Waktu baca: 5 menit</p>
        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>Menjelang musim wisuda 2026, banyak lulusan yang mencari <strong>harga foto wisuda</strong> terbaik di Solo Raya. Mulai dari Sukoharjo, Klaten, hingga Wonogiri, tarif bisa bervariasi. Di artikel ini kami bandingkan harga berbagai paket agar kamu bisa pilih yang paling pas.</p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Daftar Harga Foto Wisuda 2026</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead><tr className="border-b border-cream-300/20 bg-olive-800"><th className="p-3 text-left text-cream-100">Paket</th><th className="p-3 text-left text-cream-100">Harga</th><th className="p-3 text-left text-cream-100">Include</th></tr></thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10"><td className="p-3">Foto Wisuda 2026 (Indoor)</td><td className="p-3 font-bold text-gold-400">Rp150.000</td><td className="p-3">Studio, background wisuda, file digital</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Outdoor Wisuda</td><td className="p-3 font-bold text-gold-400">Rp350.000 <span className="text-cream-400 line-through text-xs">Rp500.000</span></td><td className="p-3">Lokasi outdoor, fotografer, editing, file GDrive</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Cute Pas Foto</td><td className="p-3 font-bold text-gold-400">Rp125.000 <span className="text-cream-400 line-through text-xs">Rp150.000</span></td><td className="p-3">Pas foto estetik untuk dokumen wisuda</td></tr>
                <tr><td className="p-3">Mini Album (10 lembar @4R)</td><td className="p-3 font-bold text-gold-400">Rp150.000</td><td className="p-3">Album kenangan wisuda</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Perbandingan Harga Solo Raya</h2>
          <p>Harga foto wisuda di wilayah Solo Raya umumnya berkisar Rp100.000—Rp750.000 tergantung paket dan lokasi. Berikut perbandingan ringkas:</p>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><strong>Kota Solo</strong> — Rp150.000 (indoor) s/d Rp500.000 (outdoor premium)</li>
            <li><strong>Sukoharjo</strong> — Rp150.000 s/d Rp350.000 — lokasi studio kami, paling terjangkau</li>
            <li><strong>Klaten</strong> — Rp125.000 s/d Rp400.000 — banyak studio rumahan</li>
            <li><strong>Wonogiri</strong> — Rp100.000 s/d Rp350.000 — opsi budget-friendly</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Tips Hemat Foto Wisuda</h2>
          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Booking sebelum musim wisuda</strong> — Harga lebih stabil, jadwal lebih fleksibel</li>
            <li><strong>Pilih paket combo</strong> — Indoor + pas foto biasanya lebih irit</li>
            <li><strong>Ajak teman bareng</strong> — Harga berkelompok sering lebih murah per orang</li>
            <li><strong>Manfaatkan promo</strong> — Cek Instagram @ceritakita.studio untuk promo terbaru</li>
            <li><strong>Tentukan lokasi outdoor sebelumnya</strong> — Biaya transport tidak membengkak</li>
          </ol>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>
          <div className="space-y-4">
            <div><h3 className="font-bold text-cream-100">Berapa harga foto wisuda 2026 di Solo?</h3><p className="text-cream-300">Harga foto wisuda di Solo mulai Rp150.000 untuk indoor studio dan Rp350.000 untuk outdoor. Sudah termasuk editing dan file digital.</p></div>
            <div><h3 className="font-bold text-cream-100">Apa yang termasuk dalam paket foto wisuda?</h3><p className="text-cream-300">Paket indoor termasuk studio, background wisuda, dan file digital. Paket outdoor termasuk fotografer, lokasi, editing, dan file via Google Drive.</p></div>
            <div><h3 className="font-bold text-cream-100">Apakah ada harga khusus untuk foto wisuda berkelompok?</h3><p className="text-cream-300">Ya, kami menyediakan harga khusus untuk pemesanan berkelompok. Hubungi kami via WhatsApp untuk mendapatkan penawaran terbaik.</p></div>
            <div><h3 className="font-bold text-cream-100">Bagaimana cara booking foto wisuda di CeritaKita?</h3><p className="text-cream-300">Cukup klik tombol Booking via WhatsApp di bawah, pilih jadwal, dan lakukan pembayaran. Kami akan konfirmasi dalam 1×24 jam.</p></div>
          </div>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">Booking Foto Wisuda 2026</h3>
            <p className="text-cream-300 mb-4">Jadwal wisuda padat? Booking sekarang untuk amankan slot!</p>
            <a href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20tanya%20harga%20foto%20wisuda%202026" className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors">BOOKING VIA WHATSAPP</a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Artikel Terkait</h2>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><Link href="/blog/wisuda-solo" className="text-gold-400 hover:underline">Foto Wisuda Solo — Panduan Lengkap 2026</Link></li>
            <li><Link href="/blog/studio-foto-solo" className="text-gold-400 hover:underline">Studio Foto Murah Solo — Panduan Lengkap 2026</Link></li>
            <li><Link href="/blog/foto-keluarga-solo" className="text-gold-400 hover:underline">Foto Keluarga Solo — Mulai Rp300K</Link></li>
            <li><Link href="/blog/pas-foto-solo" className="text-gold-400 hover:underline">Pas Foto Solo — Mulai Rp40K</Link></li>
          </ul>
        </div>
      </article>
    </main>
  );
}
