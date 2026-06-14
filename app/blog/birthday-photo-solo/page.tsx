import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Foto Birthday Solo 2026 — Sesi Ulang Tahun Mulai Rp150K | CeritaKita",
  description: "Foto birthday di Solo mulai Rp150K. Sesi foto ulang tahun seru di studio. CeritaKita Studio Sukoharjo.",
  keywords: "foto birthday solo, foto ulang tahun solo, studio foto birthday sukoharjo, foto ultah murah solo",
  openGraph: { title: "Foto Birthday Solo 2026 — CeritaKita Studio", description: "Foto ulang tahun seru di studio mulai Rp150K.", url: "https://ceritakitastudio.site/blog/birthday-photo-solo", siteName: "CeritaKita Studio", locale: "id_ID", type: "article" },
  alternates: { canonical: "https://ceritakitastudio.site/blog/birthday-photo-solo" },
};

const faqData = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Berapa harga foto birthday di Solo?", acceptedAnswer: { "@type": "Answer", text: "Di CeritaKita Studio, foto birthday mulai Rp150.000 sudah termasuk sesi foto di studio." } },
    { "@type": "Question", name: "Apakah bisa bawa kue dan dekorasi sendiri?", acceptedAnswer: { "@type": "Answer", text: "Bisa! Kamu bebas bawa kue, balon, dekorasi, dan properti pribadi untuk sesi foto birthday." } },
    { "@type": "Question", name: "Berapa lama sesi foto birthday?", acceptedAnswer: { "@type": "Answer", text: "Sesi foto birthday 30 menit, cukup untuk berbagai pose dan gaya." } },
    { "@type": "Question", name: "Apakah bisa foto birthday untuk anak-anak?", acceptedAnswer: { "@type": "Answer", text: "Bisa! Studio kami nyaman untuk anak-anak. Staff kami berpengalaman menangani sesi foto anak." } },
  ],
};

export default function BirthdayPhotoSoloPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={faqData} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" / "}<Link href="/blog" className="hover:text-gold-400">Blog</Link>{" / "}<span>Birthday</span>
        </nav>
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">Foto Birthday Solo: Abadikan Momen Spesial Ulang Tahun</h1>
        <p className="text-cream-300 text-sm mb-8">Terakhir diperbarui: 14 Juni 2026 · Waktu baca: 3 menit</p>
        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>Ulang tahun hanya sekali setiap tahun — abadikan dengan foto profesional! Di <strong>CeritaKita Studio</strong>, sesi foto birthday di Solo mulai dari <strong>Rp150 ribu</strong>. Cocok untuk ulang tahun anak, dewasa, atau foto couple anniversary.</p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Paket Foto Birthday</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead><tr className="border-b border-cream-300/20 bg-olive-800"><th className="p-3 text-left text-cream-100">Paket</th><th className="p-3 text-left text-cream-100">Harga</th><th className="p-3 text-left text-cream-100">Include</th></tr></thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10"><td className="p-3">Birthday Photo</td><td className="p-3 font-bold text-gold-400">Rp150.000</td><td className="p-3">Sesi 30 menit, file digital via GDrive</td></tr>
                <tr className="border-b border-cream-300/10"><td className="p-3">Birthday + Family</td><td className="p-3 font-bold text-gold-400">Rp300.000</td><td className="p-3">Foto bareng keluarga (max 6 orang), cetak 4R & 10R</td></tr>
                <tr><td className="p-3">Mini Album (10 lembar @4R)</td><td className="p-3 font-bold text-gold-400">Rp150.000</td><td className="p-3">Album kenangan birthday</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Ide Foto Birthday yang Seru</h2>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Confetti & balon</strong> — Setup studio dengan dekorasi colorful</li>
            <li><strong>Cake smash</strong> — Untuk anak-anak, biarkan mereka bermain dengan kue</li>
            <li><strong>Theme party</strong> — Princess, superhero, atau tema favorit</li>
            <li><strong>Couple anniversary</strong> — Foto romantis untuk pasangan</li>
            <li><strong>Before-after</strong> — Bandingkan foto birthday tahun ini vs tahun lalu</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>
          <div className="space-y-4">
            <div><h3 className="font-bold text-cream-100">Berapa harga foto birthday?</h3><p className="text-cream-300">Mulai Rp150.000 sudah termasuk sesi foto 30 menit dan file digital.</p></div>
            <div><h3 className="font-bold text-cream-100">Bisa bawa kue dan dekorasi?</h3><p className="text-cream-300">Bisa! Kamu bebas bawa kue, balon, dekorasi, dan properti pribadi.</p></div>
            <div><h3 className="font-bold text-cream-100">Berapa lama sesi foto?</h3><p className="text-cream-300">30 menit, cukup untuk berbagai pose dan gaya.</p></div>
            <div><h3 className="font-bold text-cream-100">Bisa untuk anak-anak?</h3><p className="text-cream-300">Bisa! Studio kami nyaman untuk anak-anak.</p></div>
          </div>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">Booking Foto Birthday</h3>
            <p className="text-cream-300 mb-4">Buat ulang tahunmu lebih berkesan dengan foto profesional!</p>
            <a href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20booking%20foto%20birthday" className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors">BOOKING VIA WHATSAPP</a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">Artikel Terkait</h2>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><Link href="/blog/studio-foto-solo" className="text-gold-400 hover:underline">Studio Foto Murah Solo</Link></li>
            <li><Link href="/blog/foto-keluarga-solo" className="text-gold-400 hover:underline">Foto Keluarga Solo</Link></li>
            <li><Link href="/blog/self-photo-sukoharjo" className="text-gold-400 hover:underline">Self Photo Studio Sukoharjo</Link></li>
          </ul>
        </div>
      </article>
    </main>
  );
}
