import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Self Photo vs Foto Studio: Mana yang Lebih Cocok? | CeritaKita Studio",
  description:
    "Perbedaan self photo dan foto studio — mana yang lebih cocok untuk kamu? Bandingkan harga, pengalaman, dan hasil foto di CeritaKita Studio.",
  keywords:
    "perbedaan self photo dan foto studio, self photo vs foto studio, kelebihan self photo, foto studio vs self photo, self photo murah, foto studio profesional",
  openGraph: {
    title: "Self Photo vs Foto Studio: Mana yang Lebih Cocok? — CeritaKita Studio",
    description:
      "Bandingkan self photo dan foto studio dari segi harga, pengalaman, dan hasil. Temukan mana yang cocok untuk kebutuhanmu!",
    url: "https://ceritakitastudio.site/blog/perbedaan-self-photo-dan-foto-studio",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/perbedaan-self-photo-dan-foto-studio",
  },
};

export default function PerbedaanSelfPhotoDanFotoStudioPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Apa itu self photo dan bagaimana bedanya dengan foto studio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Self photo adalah sesi foto di studio di mana kamu mengambil foto sendiri menggunakan remote atau timer, tanpa fotografer profesional. Beda dengan foto studio tradisional yang ditangani langsung oleh fotografer yang mengarahkan pose dan komposisi."
            }
          },
          {
            "@type": "Question",
            "name": "Apakah self photo bisa menghasilkan foto yang bagus?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tentu bisa! Self photo di CeritaKita Studio sudah dilengkapi lighting profesional, background berkualitas tinggi, dan kamera beresolusi tinggi. Hasilnya tetap instagramable dan siap cetak."
            }
          },
          {
            "@type": "Question",
            "name": "Mana yang lebih murah, self photo atau foto studio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Self photo umumnya lebih terjangkau karena tidak membutuhkan fotografer. Di CeritaKita Studio, self photo mulai Rp150.000 sudah termasuk makeup, kostum adat Jawa, dan editing."
            }
          },
          {
            "@type": "Question",
            "name": "Untuk kebutuhan apa self photo lebih cocok?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Self photo cocok untuk konten sosial media, foto profil, foto solo atau bareng teman, dan foto candid yang natural. Untuk kebutuhan formal seperti prewedding atau foto keluarga besar, foto studio dengan fotografer lebih disarankan."
            }
          }
        ]
      }} />

      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" "}/{""}{" "}
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{" "}/{""}{" "}
          <span>Self Photo vs Foto Studio</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Self Photo vs Foto Studio: Mana yang Lebih Cocok untuk Kamu?
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 18 Agustus 2026 · Waktu baca: 4 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Bingung harus pilih <strong>self photo</strong> atau <strong>foto studio</strong> dengan fotografer? Keduanya punya kelebihan masing-masing. Di artikel ini, kami akan membahas perbedaan self photo dan foto studio secara lengkap — dari harga, pengalaman, hingga hasil akhirnya — supaya kamu bisa memilih yang paling cocok untuk kebutuhanmu.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Apa Itu Self Photo?
          </h2>
          <p>
            Self photo adalah sesi foto di mana kamu mengambil foto sendiri di dalam studio. Biasanya tersedia remote shutter atau timer, lighting profesional, dan background yang sudah disetup oleh tim studio. Kamu bebas berekspresi tanpa ada fotografer yang mengarahkan — jadi hasilnya lebih candid dan natural.
          </p>
          <p>
            Konsep ini makin populer di kalangan anak muda karena hasilnya yang instagramable dan harganya yang ramah di kantong. Di CeritaKita Studio, self photo sudah include <strong>makeup, kostum adat Jawa, dan editing profesional</strong>.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Apa Itu Foto Studio Tradisional?
          </h2>
          <p>
            Foto studio tradisional melibatkan fotografer profesional yang mengarahkan pose, komposisi, dan lighting selama sesi berlangsung. Cocok untuk kebutuhan formal seperti foto wisuda, keluarga, prewedding, atau pernikahan. Fotografer akan memastikan setiap detail terlihat sempurna.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Perbandingan: Self Photo vs Foto Studio
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead>
                <tr className="border-b border-cream-300/20 bg-olive-800">
                  <th className="p-3 text-left text-cream-100">Aspek</th>
                  <th className="p-3 text-left text-cream-100">Self Photo</th>
                  <th className="p-3 text-left text-cream-100">Foto Studio</th>
                </tr>
              </thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10">
                  <td className="p-3 font-bold">Harga</td>
                  <td className="p-3">Mulai Rp150.000</td>
                  <td className="p-3">Mulai Rp150.000 — Rp1.300.000</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3 font-bold">Fotografer</td>
                  <td className="p-3">Tidak ada — kamu selfie sendiri</td>
                  <td className="p-3">Fotografer profesional</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3 font-bold">Pose & Arah</td>
                  <td className="p-3">Bebas — berekspresi sesuka hati</td>
                  <td className="p-3">Diarahkan untuk hasil maksimal</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3 font-bold">Jenis Foto</td>
                  <td className="p-3">Solo, bareng teman, candid, konten sosmed</td>
                  <td className="p-3">Wisuda, keluarga, prewedding, wedding</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3 font-bold">Makeup & Kostum</td>
                  <td className="p-3">Include di CeritaKita Studio</td>
                  <td className="p-3">Include</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3 font-bold">Editing</td>
                  <td className="p-3">Include — file high-res via Google Drive</td>
                  <td className="p-3">Include — editing premium</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3 font-bold">Privasi</td>
                  <td className="p-3">Studio privat — bebas berekspresi</td>
                  <td className="p-3">Studio privat</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">Cocok Untuk</td>
                  <td className="p-3">Konten sosmed, foto profil, bersenang-senang</td>
                  <td className="p-3">Dokumentasi formal, momen spesial</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Kapan Harus Pilih Self Photo?
          </h2>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Budget terbatas</strong> — Self photo lebih terjangkau tanpa mengorbankan kualitas</li>
            <li><strong>Mau foto candid</strong> — Hasil lebih natural karena kamu yang atur sendiri</li>
            <li><strong>Iseng-iseng seru</strong> — Bareng teman, adik, atau pacar tanpa pressure</li>
            <li><strong>Butuh cepat</strong> — Tanpa antrian fotografer, langsung masuk studio</li>
            <li><strong>Konten sosmed</strong> — Background dan lighting sudah disetup, tinggal jepret</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Kapan Harus Pilih Foto Studio dengan Fotografer?
          </h2>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Acara formal</strong> — Wisuda, pernikahan, foto keluarga besar</li>
            <li><strong>Momen spesial</strong> — Prewedding, anniversary, birthday party</li>
            <li><strong>Hasil sempurna</strong> — Fotografer ahli mengatur pose dan komposisi</li>
            <li><strong>Banyak orang</strong> — Grup besar butuh koordinasi yang terarah</li>
            <li><strong>Butuh cetak berkualitas</strong> — Foto formal untuk frame atau album</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            CeritaKita Studio: Self Photo & Foto Studio
          </h2>
          <p>
            Di CeritaKita Studio, kamu nggak perlu bingung pilih salah satu. Kami menyediakan <strong>keduanya</strong>! Mulai dari self photo Rp150.000 hingga paket wedding Rp1.300.000, semua sudah termasuk makeup, kostum, dan editing profesional. Studio privat, lighting berkualitas, dan hasil yang siap upload ke Instagram.
          </p>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Mau Coba Self Photo atau Foto Studio?
            </h3>
            <p className="text-cream-300 mb-4">
              Chat kami sekarang! Tim CeritaKita Studio akan bantu pilih paket yang paling cocok untuk kebutuhanmu. Harga mulai Rp150K, sudah termasuk makeup dan kostum.
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20tanya%20self%20photo%20dan%20foto%20studio"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              TANYA VIA WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Apa itu self photo dan bagaimana bedanya dengan foto studio?</h3>
              <p className="text-cream-300">Self photo adalah sesi foto di studio di mana kamu mengambil foto sendiri menggunakan remote atau timer, tanpa fotografer profesional. Beda dengan foto studio tradisional yang ditangani langsung oleh fotografer yang mengarahkan pose dan komposisi.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah self photo bisa menghasilkan foto yang bagus?</h3>
              <p className="text-cream-300">Tentu bisa! Self photo di CeritaKita Studio sudah dilengkapi lighting profesional, background berkualitas tinggi, dan kamera beresolusi tinggi. Hasilnya tetap instagramable dan siap cetak.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Mana yang lebih murah, self photo atau foto studio?</h3>
              <p className="text-cream-300">Self photo umumnya lebih terjangkau karena tidak membutuhkan fotografer. Di CeritaKita Studio, self photo mulai Rp150.000 sudah termasuk makeup, kostum adat Jawa, dan editing.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Untuk kebutuhan apa self photo lebih cocok?</h3>
              <p className="text-cream-300">Self photo cocok untuk konten sosial media, foto profil, foto solo atau bareng teman, dan foto candid yang natural. Untuk kebutuhan formal seperti prewedding atau foto keluarga besar, foto studio dengan fotografer lebih disarankan.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
