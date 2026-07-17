import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Foto Keluarga Adat Jawa: Harga Mulai 150RB, Hasil Profesional! | CeritaKita",
  description: "Mau foto keluarga adat Jawa yang worth it dan affordable? Simak tips, harga, dan rekomendasi studio foto Solo terbaik di sini!",
  keywords: "foto keluarga adat jawa, foto keluarga solo, studio foto adat jawa, harga foto keluarga adat",
  openGraph: {
    title: "Foto Keluarga Adat Jawa: Panduan Lengkap Harga, Tips, dan Rekomendasi Terbaik",
    description: "Foto keluarga adat Jawa yang worth it dan affordable? Simak tips, harga, dan rekomendasi studio foto Solo terbaik!",
    url: "https://ceritakitastudio.site/blog/foto-keluarga-adat-jawa",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: { canonical: "https://ceritakitastudio.site/blog/foto-keluarga-adat-jawa" },
};

const faqData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Berapa lama sesi foto keluarga?",
      acceptedAnswer: { "@type": "Answer", text: "Rata-rata 20-40 menit. Tergantung paket yang dipilih." },
    },
    {
      "@type": "Question",
      name: "Apakah bapak/suami perlu makeup?",
      acceptedAnswer: { "@type": "Answer", text: "Tidak. Bapak/suami cukup pakai kostum adat saja. Sudah gagah!" },
    },
    {
      "@type": "Question",
      name: "Anak usia berapa yang boleh ikut?",
      acceptedAnswer: { "@type": "Answer", text: "Semua usia boleh! Dari bayi sampai lansia." },
    },
    {
      "@type": "Question",
      name: "Berapa lama hasil foto jadi?",
      acceptedAnswer: { "@type": "Answer", text: "Biasanya 1-3 hari untuk editing, lalu dikirim via Gdrive." },
    },
    {
      "@type": "Question",
      name: "Bisa request pose tertentu?",
      acceptedAnswer: { "@type": "Answer", text: "Bisa! Minta aja ke fotografernya, mereka biasanya punya referensi pose yang bagus." },
    },
  ],
};

export default function FotoKeluargaAdatJawaPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={faqData} />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{" / "}
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{" / "}
          <span>Foto Keluarga Adat Jawa</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Foto Keluarga Adat Jawa: Panduan Lengkap Harga, Tips, dan Rekomendasi Terbaik
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 17 Juli 2026 · Waktu baca: 5 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Foto keluarga adat Jawa bukan sekadar tren sesaat. Ini adalah cara untuk{" "}
            <strong>mengabadikan momen kebersamaan</strong> sekaligus{" "}
            <strong>melestarikan budaya Jawa</strong>.
          </p>

          <p>
            Bayangkan wajah bahagia keluarga kamu mengenakan kebaya, batik, dan aksesoris
            tradisional Jawa. Momen ini akan menjadi kenangan berharga yang bisa dilihat
            bertahun-tahun kemudian.
          </p>

          <p>Tapi banyak orang masih berpikir:</p>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li>&quot;Foto keluarga adat Jawa pasti mahal&quot;</li>
            <li>&quot;Ribet harus sewa kostum sendiri&quot;</li>
            <li>&quot;Gak tau harus mulai dari mana&quot;</li>
          </ul>

          <p>
            Tenang, di artikel ini kamu akan menemukan <strong>semua jawabannya</strong>!
          </p>

          {/* HARGA */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Berapa Harga Foto Keluarga Adat Jawa?
          </h2>

          <p>Harga foto keluarga adat Jawa bervariasi tergantung beberapa faktor:</p>

          <h3 className="font-display text-xl text-gold-400 mt-8">
            Faktor yang Mempengaruhi Harga:
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-cream-300/20">
              <thead>
                <tr className="border-b border-cream-300/20 bg-olive-800">
                  <th className="p-3 text-left text-cream-100">Faktor</th>
                  <th className="p-3 text-left text-cream-100">Penjelasan</th>
                </tr>
              </thead>
              <tbody className="text-cream-300">
                <tr className="border-b border-cream-300/10">
                  <td className="p-3 font-bold">Jumlah orang</td>
                  <td className="p-3">Semakin banyak, semakin mahal</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3 font-bold">Durasi sesi</td>
                  <td className="p-3">20 menit vs 40 menit</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3 font-bold">Include makeup</td>
                  <td className="p-3">Untuk ibu dan anak perempuan</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3 font-bold">Kostum</td>
                  <td className="p-3">Disediakan studio atau bawa sendiri</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">Hasil foto</td>
                  <td className="p-3">Cetakan, file digital, atau keduanya</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-display text-xl text-gold-400 mt-8">
            Estimasi Harga di Solo:
          </h3>

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
                  <td className="p-3">Paket Dasar</td>
                  <td className="p-3 font-bold text-gold-400">Rp 150.000 - 250.000</td>
                  <td className="p-3">2 orang, makeup, kostum, 20 menit</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Paket Keluarga</td>
                  <td className="p-3 font-bold text-gold-400">Rp 350.000 - 600.000</td>
                  <td className="p-3">3-4 orang, makeup, kostum, 30 menit</td>
                </tr>
                <tr>
                  <td className="p-3">Paket Big Family</td>
                  <td className="p-3 font-bold text-gold-400">Rp 600.000 - 1.000.000</td>
                  <td className="p-3">5-10 orang, makeup, kostum, 40 menit</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-olive-800 border border-gold-400/30 p-4 rounded-lg mt-4">
            <p className="text-cream-100 font-bold">
              Tips Hemat: Pilih paket yang include semua (makeup + kostum + editing) supaya gak
              ada biaya tambahan yang mengejutkan!
            </p>
          </div>

          {/* TIPS */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Tips Foto Keluarga Adat Jawa yang Worth It
          </h2>

          <h3 className="font-display text-xl text-gold-400 mt-8">
            1. Pilih Studio yang Include Kostum
          </h3>
          <p>
            Ini tips paling penting! Kalau studio menyediakan kostum adat Jawa, kamu gak perlu
            repot sewa kostum sendiri, bayar biaya tambahan, atau bingung pilih kostum yang cocok.
          </p>
          <p>
            <strong>Contoh:</strong> Di Ceritakita Studio, semua paket sudah include kostum adat
            Jawa lengkap!
          </p>

          <h3 className="font-display text-xl text-gold-400 mt-8">
            2. Pastikan Include Makeup
          </h3>
          <p>Makeup profesional bukan cuma untuk perempuan. Tapi untuk foto keluarga adat Jawa:</p>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><strong>Ibu:</strong> Makeup full (supaya cantik dan anggun)</li>
            <li><strong>Anak perempuan:</strong> Makeup natural (supaya tetap imut)</li>
            <li><strong>Bapak/Suami:</strong> Kostum only (udah gagah tanpa makeup)</li>
          </ul>

          <h3 className="font-display text-xl text-gold-400 mt-8">
            3. Manfaatkan Waktu Sesi dengan Maksimal
          </h3>
          <p>Rata-rata sesi foto cuma 20-40 menit. Manfaatkan dengan:</p>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><strong>5 menit pertama:</strong> Adaptasi, cari angle yang cocok</li>
            <li><strong>10 menit berikutnya:</strong> Foto bareng keluarga</li>
            <li><strong>5-10 menit terakhir:</strong> Foto individu atau momen candid</li>
          </ul>

          <h3 className="font-display text-xl text-gold-400 mt-8">
            4. Pilih Background yang Sesuai
          </h3>
          <p>Background mempengaruhi suasana foto:</p>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><strong>Warna netral (putih/krem):</strong> Klasik dan elegan</li>
            <li><strong>Warna gelap (hitam/coklat):</strong> Dramatis dan berkesan</li>
            <li><strong>Background tradisional:</strong> Authentic dan budaya banget</li>
          </ul>

          <h3 className="font-display text-xl text-gold-400 mt-8">
            5. Koordinasi Warna Kostum
          </h3>
          <p>Supaya foto kelihatan harmonis:</p>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li>Pilih <strong>satu tema warna</strong> (misal: merah marun, biru dongker, atau hijau tosca)</li>
            <li><strong>Hindari</strong> warna yang terlalu mencolok berbeda</li>
            <li><strong>Tambahkan aksesoris</strong> seperti selendang atau jam tradisional</li>
          </ul>

          {/* CHECKLIST */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Checklist Sebelum Foto Keluarga Adat Jawa
          </h2>

          <p>Sebelum datang ke studio, pastikan kamu sudah:</p>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li><strong>Booking jadwal</strong> (jangan datang dadakan!)</li>
            <li><strong>Tentukan jumlah peserta</strong> (siapa saja yang ikut)</li>
            <li><strong>Pilih tema warna kostum</strong> (supaya matching)</li>
            <li><strong>Istirahat cukup</strong> (biar fresh saat foto)</li>
            <li><strong>Bawa moisturizer/lip balm</strong> (biar makeup tahan lama)</li>
            <li><strong>Siapkan referensi pose</strong> (dari Pinterest atau Instagram)</li>
          </ul>

          {/* REKOMENDASI */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Rekomendasi Studio Foto Keluarga Adat Jawa di Solo
          </h2>

          <p>
            Solo adalah kota terbaik untuk foto keluarga adat Jawa. Banyak studio yang menyediakan
            paket lengkap dengan harga terjangkau.
          </p>

          <h3 className="font-display text-xl text-gold-400 mt-8">
            Yang Perlu Diperhatikan Saat Memilih Studio:
          </h3>

          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Kelengkapan Kostum</strong> - Apakah sudah include atau harus bawa sendiri?</li>
            <li><strong>Fasilitas Makeup</strong> - Apakah ada MUA profesional?</li>
            <li><strong>Hasil Foto</strong> - Cek portfolio mereka di Instagram</li>
            <li><strong>Harga Transparan</strong> - Pastikan gak ada biaya tersembunyi</li>
            <li><strong>Lokasi</strong> - Mudah dijangkau dan ada parkir?</li>
          </ol>

          {/* CERITAKITA */}
          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-8">
            <h3 className="font-display text-xl text-gold-400 mb-4">
              Ceritakita Studio: Solusi Foto Keluarga Adat Jawa di Solo
            </h3>
            <p className="text-cream-300 mb-4">Kalau kamu cari studio yang:</p>
            <ul className="list-disc list-inside space-y-2 text-cream-300 mb-6">
              <li>Include kostum adat Jawa lengkap</li>
              <li>Include makeup profesional</li>
              <li>Harga mulai Rp 150.000 (untuk 2 orang)</li>
              <li>Hasil foto bagus dan editing profesional</li>
              <li>Lokasi strategis di Solo</li>
            </ul>

            <p className="text-cream-100 font-bold mb-4">Paket yang tersedia:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-cream-300/20">
                <thead>
                  <tr className="border-b border-cream-300/20 bg-olive-700">
                    <th className="p-3 text-left text-cream-100">Paket</th>
                    <th className="p-3 text-left text-cream-100">Harga</th>
                  </tr>
                </thead>
                <tbody className="text-cream-300">
                  <tr className="border-b border-cream-300/10">
                    <td className="p-3">Couple Only</td>
                    <td className="p-3 font-bold text-gold-400">Rp 150.000 (2 orang)</td>
                  </tr>
                  <tr className="border-b border-cream-300/10">
                    <td className="p-3">Couple + 1 Anak</td>
                    <td className="p-3 font-bold text-gold-400">Rp 250.000 (3 orang)</td>
                  </tr>
                  <tr className="border-b border-cream-300/10">
                    <td className="p-3">Couple + 2 Anak</td>
                    <td className="p-3 font-bold text-gold-400">Rp 350.000 (4 orang)</td>
                  </tr>
                  <tr>
                    <td className="p-3">Big Family</td>
                    <td className="p-3 font-bold text-gold-400">Rp 600.000 (6-10 orang)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">
            FAQ Foto Keluarga Adat Jawa
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Berapa lama sesi foto keluarga?</h3>
              <p className="text-cream-300">Rata-rata 20-40 menit. Tergantung paket yang dipilih.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah bapak/suami perlu makeup?</h3>
              <p className="text-cream-300">Tidak. Bapak/suami cukup pakai kostum adat saja. Sudah gagah!</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Anak usia berapa yang boleh ikut?</h3>
              <p className="text-cream-300">Semua usia boleh! Dari bayi sampai lansia.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Berapa lama hasil foto jadi?</h3>
              <p className="text-cream-300">Biasanya 1-3 hari untuk editing, lalu dikirim via Gdrive.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Bisa request pose tertentu?</h3>
              <p className="text-cream-300">Bisa! Minta aja ke fotografernya, mereka biasanya punya referensi pose yang bagus.</p>
            </div>
          </div>

          {/* KESIMPULAN */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">Kesimpulan</h2>

          <p>
            Foto keluarga adat Jawa yang worth it dan affordable itu <strong>ada</strong>!
            Kuncinya:
          </p>

          <ol className="list-decimal list-inside space-y-3 text-cream-300">
            <li><strong>Pilih studio yang include kostum + makeup</strong> (gak perlu biaya tambahan)</li>
            <li><strong>Manfaatkan waktu sesi dengan maksimal</strong></li>
            <li><strong>Koordinasi warna kostum</strong> supaya foto harmonis</li>
            <li><strong>Booking jadwal</strong> supaya gak kehabisan slot</li>
          </ol>

          <p className="mt-4">
            Jangan tunda lagi! Momen kebersamaan keluarga gak bisa diulang. Abadikan sekarang
            juga!
          </p>

          {/* CTA */}
          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Booking Foto Keluarga Adat Jawa
            </h3>
            <p className="text-cream-300 mb-4">
              Abadikan momen kebersamaan keluarga dengan kostum adat Jawa yang elegan!
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20booking%20foto%20keluarga%20adat%20jawa"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              BOOKING VIA WHATSAPP
            </a>
          </div>

          {/* ARTIKEL TERKAIT */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">Artikel Terkait</h2>
          <ul className="list-disc list-inside space-y-2 text-cream-300">
            <li>
              <Link href="/blog/foto-keluarga-solo" className="text-gold-400 hover:underline">
                Foto Keluarga Solo
              </Link>
            </li>
            <li>
              <Link href="/blog/studio-foto-solo" className="text-gold-400 hover:underline">
                Studio Foto Murah Solo
              </Link>
            </li>
            <li>
              <Link href="/blog/wisuda-solo" className="text-gold-400 hover:underline">
                Foto Wisuda Solo
              </Link>
            </li>
            <li>
              <Link href="/blog/harga-prewedding-solo" className="text-gold-400 hover:underline">
                Harga Prewedding Solo
              </Link>
            </li>
          </ul>
        </div>
      </article>
    </main>
  );
}
