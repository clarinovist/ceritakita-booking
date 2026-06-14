import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Harga Prewedding Solo 2026 — Paket Mulai Rp2 Juta | CeritaKita Studio",
  description:
    "Daftar harga foto prewedding di Solo 2026. Paket indoor & outdoor mulai Rp2 juta. Include makeup, kostum, album. CeritaKita Studio Sukoharjo.",
  keywords:
    "harga prewedding solo, foto prewedding murah solo, paket prewedding sukoharjo, prewedding studio solo, fotografer prewedding solo, prewedding outdoor solo",
  openGraph: {
    title: "Harga Prewedding Solo 2026 — CeritaKita Studio",
    description:
      "Paket foto prewedding di Solo mulai Rp2 juta. Indoor & outdoor, include makeup, kostum, dan album.",
    url: "https://ceritakitastudio.site/blog/harga-prewedding-solo",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/harga-prewedding-solo",
  },
};

export default function HargaPreweddingSoloPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "Berapa harga prewedding di Solo?", "acceptedAnswer": {"@type": "Answer", "text": "Harga prewedding di Solo mulai dari Rp1,5 juta hingga Rp10 juta. Di CeritaKita Studio, paket studio mulai Rp2 juta."}}, {"@type": "Question", "name": "Berapa lama sesi foto prewedding?", "acceptedAnswer": {"@type": "Answer", "text": "Tergantung paket: studio 2 jam, outdoor 3-4 jam, premium/full day 8-10 jam."}}, {"@type": "Question", "name": "Kapan waktu terbaik foto prewedding?", "acceptedAnswer": {"@type": "Answer", "text": "Pagi hari (06.00-09.00) untuk cahaya golden hour, atau sore hari (15.00-17.00) untuk cahaya hangat. Hindari siang hari karena bayangan keras."}}, {"@type": "Question", "name": "Berapa lama hasil foto prewedding jadi?", "acceptedAnswer": {"@type": "Answer", "text": "File digital 1-2 minggu, album cetak 2-3 minggu setelah approval layout."}}]}} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" "}/{" "}
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{" "}/{" "}
          <span>Harga Prewedding Solo</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Harga Foto Prewedding Solo 2026: Panduan Lengkap + Tips Hemat
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 14 Juni 2026 · Waktu baca: 6 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Merencanakan foto <strong>prewedding di Solo</strong>? Harga prewedding di Solo Raya cukup bervariasi, mulai dari Rp1,5 juta hingga Rp10 juta tergantung paket dan lokasi. Di CeritaKita Studio, kami menawarkan paket prewedding yang terjangkau tanpa mengorbankan kualitas.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Daftar Harga Prewedding Solo 2026
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
                  <td className="p-3">Prewedding Studio</td>
                  <td className="p-3 font-bold text-gold-400">Rp2.000.000</td>
                  <td className="p-3">2 jam studio, makeup, 2 kostum, 20 foto edit, file GDrive</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Outdoor</td>
                  <td className="p-3 font-bold text-gold-400">Rp3.000.000</td>
                  <td className="p-3">3 lokasi outdoor, makeup, 3 kostum, 30 foto edit, file GDrive</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Premium</td>
                  <td className="p-3 font-bold text-gold-400">Rp5.000.000</td>
                  <td className="p-3">Studio + outdoor, makeup premium, 4 kostum, 50 foto edit, album, video</td>
                </tr>
                <tr>
                  <td className="p-3">Prewedding All-In</td>
                  <td className="p-3 font-bold text-gold-400">Rp8.000.000</td>
                  <td className="p-3">Full day, 5+ lokasi, makeup premium, unlimited kostum, 80 foto edit, album premium, cinematic video</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-cream-400 italic">
            * Harga dapat berubah sewaktu-waktu. Hubungi kami untuk harga terbaru dan promo spesial.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Rekomendasi Lokasi Prewedding di Solo
          </h2>

          <p>Solo dan sekitarnya punya banyak spot foto prewedding yang cantik:</p>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Keraton Surakarta</strong> — Nuansa kerajaan Jawa yang megah</li>
            <li><strong>Taman Sriwedari</strong> — Taman klasik dengan arsitektur colonial</li>
            <li><strong>Ngarsopuro Night Market</strong> — Spot urban yang instagramable</li>
            <li><strong>Balekambang Park</strong> — Taman hijau yang asri</li>
            <li><strong>Jurug Solo Zoo</strong> — Konsep playful dan fun</li>
            <li><strong>Grojogan Sewu, Tawangmangu</strong> — Air terjun alami di Karanganyar</li>
            <li><strong>Cetho & Sukuh Temple</strong> — Candi Hindu di lereng Gunung Lawu</li>
            <li><strong>De Tjolomadoe</strong> — Heritage sugar factory yang aesthetic</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Tips Memilih Fotografer Prewedding
          </h2>

          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Lihat portofolio</strong> — Pastikan style fotografer sesuai dengan yang kamu mau</li>
            <li><strong>Baca review</strong> — Cek testimoni dari pasangan yang sudah pernah foto</li>
            <li><strong>Tanya detail paket</strong> — Apa saja yang include, berapa foto edit, ada album atau tidak</li>
            <li><strong>Konsultasi dulu</strong> — Fotografer yang baik akan mau diskusi konsep sebelum hari H</li>
            <li><strong>Cek kelengkapan</strong> — Makeup artist, kostum, properti apakah include atau terpisah</li>
            <li><strong>Bandingkan harga</strong> — Jangan langsung pilih yang paling murah, tapi yang paling worth it</li>
          </ol>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Kenapa Prewedding di CeritaKita?
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Harga transparan</strong> — Nggak ada biaya tersembunyi</li>
            <li><strong>Konsultasi gratis</strong> — Diskusi konsep sebelum booking</li>
            <li><strong>Kostum lengkap</strong> — Adat Jawa, modern, casual, tersedia</li>
            <li><strong>Makeup profesional</strong> — Tim MUA berpengalaman untuk foto</li>
            <li><strong>Lokasi fleksibel</strong> — Studio, outdoor, atau kombinasi</li>
            <li><strong>Hasil edit berkualitas</strong> — Color grading profesional, retouching natural</li>
            <li><strong>Album premium</strong> — Hardcover, kualitas cetak terbaik</li>
          </ul>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Konsultasi Prewedding Gratis
            </h3>
            <p className="text-cream-300 mb-4">
              Ceritakan konsep prewedding impianmu, kami bantu wujudkan! Konsultasi gratis, tanpa komitmen.
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20tanya%20paket%20prewedding"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              KONSULTASI VIA WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Berapa harga prewedding di Solo?</h3>
              <p className="text-cream-300">Harga prewedding di Solo mulai dari Rp1,5 juta hingga Rp10 juta. Di CeritaKita Studio, paket studio mulai Rp2 juta.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Berapa lama sesi foto prewedding?</h3>
              <p className="text-cream-300">Tergantung paket: studio 2 jam, outdoor 3-4 jam, premium/full day 8-10 jam.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Kapan waktu terbaik foto prewedding?</h3>
              <p className="text-cream-300">Pagi hari (06.00-09.00) untuk cahaya golden hour, atau sore hari (15.00-17.00) untuk cahaya hangat. Hindari siang hari karena bayangan keras.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah bisa prewedding di luar kota Solo?</h3>
              <p className="text-cream-300">Bisa! Kami melayani prewedding di Semarang, Yogyakarta, dan kota lain di Jawa Tengah. Tambah biaya transport dan akomodasi.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Berapa lama hasil foto prewedding jadi?</h3>
              <p className="text-cream-300">File digital 1-2 minggu, album cetak 2-3 minggu setelah approval layout.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
