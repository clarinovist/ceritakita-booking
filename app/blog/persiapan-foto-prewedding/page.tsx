import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Persiapan Foto Prewedding: Checklist Lengkap 2026 | CeritaKita Studio",
  description:
    "Mau foto prewedding? Ini checklist persiapan dari kostum hingga lokasi. Tips dari CeritaKita Studio Sukoharjo.",
  keywords:
    "persiapan foto prewedding, checklist prewedding, tips prewedding, persiapan prewedding, apa yang dibawa prewedding",
  openGraph: {
    title: "Persiapan Foto Prewedding — CeritaKita Studio",
    description:
      "Checklist lengkap persiapan foto prewedding 2026: budget, kostum, makeup, lokasi, props, hingga tips mental preparation. Dari CeritaKita Studio Sukoharjo.",
    url: "https://ceritakitastudio.site/blog/persiapan-foto-prewedding",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/persiapan-foto-prewedding",
  },
};

export default function PersiapanFotoPreweddingPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Berapa lama sebelum hari H harus siapkan foto prewedding?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Idealnya 2-3 bulan sebelum hari pernikahan. Waktu ini cukup untuk booking fotografer, fitting kostum, dan proses editing."
            }
          },
          {
            "@type": "Question",
            "name": "Budget minimal untuk foto prewedding?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Di CeritaKita Studio, paket prewedding mulai dari Rp400.000 sudah termasuk sesi indoor, 1 set baju, makeup, dan editing profesional."
            }
          },
          {
            "@type": "Question",
            "name": "Baju prewedding harus beli atau disewa?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tidak harus beli! CeritaKita Studio menyediakan kostum adat Jawa dan outfit prewedding yang bisa dipakai. Kamu juga bisa bawa outfit sendiri."
            }
          },
          {
            "@type": "Question",
            "name": "Apa yang harus dibawa saat sesi foto prewedding?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Bawa outfit cadangan, obat pribadi, air minum, tissue, dan aksesoris pendukung seperti payung atau bunga. Jangan lupa bawa senyum!"
            }
          }
        ]
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Paket Foto Prewedding CeritaKita Studio",
        "description": "Sesi foto prewedding profesional di CeritaKita Studio Sukoharjo. Include makeup, kostum, sesi indoor/outdoor, dan editing premium.",
        "brand": { "@type": "Brand", "name": "CeritaKita Studio" },
        "offers": {
          "@type": "Offer",
          "price": 400000,
          "priceCurrency": "IDR",
          "availability": "https://schema.org/InStock",
          "seller": { "@type": "Organization", "name": "CeritaKita Studio" }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "50"
        }
      }} />

      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">Home</Link>{"/"}{""}
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{"/"}{""}
          <span>Persiapan Foto Prewedding</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Persiapan Foto Prewedding: Checklist Lengkap 2026
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 11 Agustus 2026 · Waktu baca: 6 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Foto prewedding adalah momen spesial sebelum hari pernikahan yang wajib kamu abadikan. Tapi banyak calon pengantin yang bingung harus mulai dari mana. <strong>Checklist persiapan foto prewedding</strong> ini akan membantu kamu mempersiapkan semuanya dengan sempurna — mulai dari budget hingga mental preparation.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            1. Budget & Perencanaan Keuangan
          </h2>
          <p className="text-cream-300">
            Langkah pertama yang paling krusial: tentukan budget. Foto prewedding bisa bervariasi dari Rp400 ribu hingga jutaan rupiah, tergantung lokasi, jumlah set, dan fasilitas yang diinginkan.
          </p>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Tentukan range budget</strong> — Berapa yang sanggup kamu alokasikan untuk prewedding tanpa mengganggu anggaran pernikahan?</li>
            <li><strong>Pilih paket yang tepat</strong> — CeritaKita Studio menawarkan paket Bronze (Rp400K), Silver (Rp600K), dan Gold (Rp800K) yang sudah termasuk makeup dan editing.</li>
            <li><strong>Alokasikan dana cadangan</strong> — Siapkan 10-15% ekstra untuk kebutuhan tak terduga seperti perubahan lokasi atau outfit tambahan.</li>
            <li><strong>Booking lebih awal</strong> — Harga bisa lebih murah jika booking 2-3 bulan sebelum hari H.</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            2. Kostum & Outfit
          </h2>
          <p className="text-cream-300">
            Outfit adalah elemen visual utama dalam foto prewedding. Pemilihan kostum yang tepat akan membuat foto terlihat harmonis dan berkesan.
          </p>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Siapkan 2-3 set baju</strong> — Variasi outfit membuat foto prewedding tidak membosankan. Bisa kombinasi formal, kasual, dan adat.</li>
            <li><strong>Pilih warna senada</strong> — Koordinasi warna antara kamu dan pasangan agar foto terlihat serasi. Hindari warna mencolok yang terlalu ramai.</li>
            <li><strong>Coba sebelum hari H</strong> — Fitting baju minimal 1 minggu sebelum sesi foto untuk memastikan ukuran pas.</li>
            <li><strong>Manfaatkan kostum studio</strong> — CeritaKita Studio menyediakan kostum adat Jawa lengkap (kebaya, jarik, blangkon) yang bisa kamu pakai gratis.</li>
            <li><strong>Persiapkan outfit cadangan</strong> — Bawa 1-2 outfit tambahan untuk jaga-jaga.</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            3. Makeup & Penampilan
          </h2>
          <p className="text-cream-300">
            Makeup yang profesional akan membuat kamu tampil sempurna di depan kamera. Jangan remehkan persiapan ini!
          </p>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Gunakan makeup artist profesional</strong> — Tim MUA CeritaKita Studio sudah berpengalaman dan paham makeup untuk sesi foto.</li>
            <li><strong>Konsultasi sebelum hari H</strong> — Diskusikan desired look dengan MUA agar sesuai tema foto prewedding kamu.</li>
            <li><strong>Rawat kulit 1-2 minggu sebelumnya</strong> — Minum air yang cukup, tidur teratur, dan skincare rutin agar kulit glowing saat sesi foto.</li>
            <li><strong>Bawa skincare essentials</strong> — Lip blemish, blotting paper, dan setting spray untuk touch-up di tengah sesi.</li>
            <li><strong>Perhatikan perawatan rambut</strong> — Potong atau styling rambut 3-5 hari sebelum sesi foto.</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            4. Lokasi & Jadwal
          </h2>
          <p className="text-cream-300">
            Pemilihan lokasi yang tepat akan memperkuat cerita di balik foto prewedding kamu.
          </p>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Pilih lokasi sesuai tema</strong> — Studio indoor untuk tampilan elegan, atau outdoor untuk nuansa natural dan romantis.</li>
            <li><strong>Cek izin lokasi outdoor</strong> — Beberapa tempat membutuhkan izin foto komersial. Pastikan urus izin minimal 1 minggu sebelumnya.</li>
            <li><strong>Tentukan jadwal yang tepat</strong> — Golden hour (pagi atau sore hari) menghasilkan pencahayaan terbaik untuk foto outdoor.</li>
            <li><strong>Booking studio lebih awal</strong> — Jadwal weekend cepat penuh. Booking minimal 2 minggu sebelum hari yang diinginkan.</li>
            <li><strong>Pertimbangkan cuaca</strong> — Untuk outdoor, siapkan plan B jika hujan mendadak.</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            5. Props & Aksesoris
          </h2>
          <p className="text-cream-300">
            Props yang tepat bisa menambah dimensi dan cerita pada foto prewedding kamu. Tapi jangan berlebihan — yang penting bermakna.
          </p>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Bunga segar atau artificial</strong> — Bouquet kecil atau flower crown untuk sentuhan romantis.</li>
            <li><strong>Aksesoris personal</strong> — Bawa barang yang punya kenangan bersama pasangan, seperti buku, gitar, atau skateboard.</li>
            <li><strong>Payung atau kipas</strong> — Props praktis yang juga berguna jika panas atau hujan ringan.</li>
            <li><strong>Jangan terlalu banyak</strong> — Pilih 2-3 props favorit saja. Terlalu banyak props bisa mengalihkan fokus dari momen kamu dan pasangan.</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            6. Mental Preparation
          </h2>
          <p className="text-cream-300">
            Persiapan mental sama pentingnya dengan persiapan fisik. Foto prewedding seharusnya menyenangkan, bukan bikin stres!
          </p>
          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Practice di depan kamera</strong> — Latihan pose bersama pasangan di rumah agar lebih percaya diri saat sesi foto.</li>
            <li><strong>Komunikasikan ekspetasi</strong> — Diskusikan dengan pasangan tentang konsep, pose, dan suasana yang diinginkan.</li>
            <li><strong>Rileks dan nikmati momen</strong> — Jangan terlalu kaku. Biarkan fotografer membimbing kamu untuk hasil yang natural.</li>
            <li><strong>Jadwalkan istirahat yang cukup</strong> — Tidur minimal 7 jam malam sebelum sesi foto agar wajah segar dan energi maksimal.</li>
            <li><strong>Siapkan mental untuk outdoor</strong> — Jika sesi outdoor, siapkan diri untuk panas, debu, atau serangga. Bawa obat gosok jika perlu.</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Checklist Hari-H Foto Prewedding
          </h2>
          <div className="bg-olive-800 border border-cream-300/20 p-6 rounded-lg">
            <p className="font-bold text-cream-100 mb-4">Yang harus dibawa saat hari sesi foto:</p>
            <ul className="list-disc list-inside space-y-2 text-cream-300">
              <li>✅ Semua set outfit yang sudah dipilih (+ cadangan)</li>
              <li>✅ Aksesoris & props yang sudah disiapkan</li>
              <li>✅ Skincare & touch-up kit (lip blemish, blotting paper, setting spray)</li>
              <li>✅ Air minum & snack ringan</li>
              <li>✅ Obat-obatan pribadi</li>
              <li>✅ Sandal jepit / flat shoes untuk istirahat antar sesi</li>
              <li>✅ Tisu basah & tissue kering</li>
              <li>✅ Sunscreen (untuk sesi outdoor)</li>
              <li>✅ Uang tunai secukupnya (jika ada biaya tambahan)</li>
            </ul>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Daftar Harga Paket Prewedding 2026
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
                  <td className="p-3">Prewedding Bronze</td>
                  <td className="p-3 font-bold text-gold-400">Rp400.000</td>
                  <td className="p-3">Sesi indoor, 1 set baju, makeup, editing</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Silver</td>
                  <td className="p-3 font-bold text-gold-400">Rp600.000</td>
                  <td className="p-3">Sesi indoor + outdoor, 2 set baju, makeup, editing</td>
                </tr>
                <tr className="border-b border-cream-300/10">
                  <td className="p-3">Prewedding Gold ⭐ Best Seller</td>
                  <td className="p-3 font-bold text-gold-400">Rp800.000</td>
                  <td className="p-3">Sesi indoor + outdoor, 3 set baju, makeup, editing premium</td>
                </tr>
                <tr>
                  <td className="p-3">Outdoor</td>
                  <td className="p-3 font-bold text-gold-400">Rp1.300.000</td>
                  <td className="p-3">Sesi outdoor di lokasi pilihan, full makeup, editing</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Siap untuk Foto Prewedding?
            </h3>
            <p className="text-cream-300 mb-4">
              CeritaKita Studio siap membantu mewujudkan foto prewedding impian kamu. Mulai dari Rp400K sudah termasuk makeup, kostum, dan editing profesional. Chat kami untuk konsultasi gratis!
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20tanya%20tentang%20persiapan%20prewedding"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              KONSULTASI VIA WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Berapa lama sebelum hari H harus siapkan foto prewedding?</h3>
              <p className="text-cream-300">Idealnya 2-3 bulan sebelum hari pernikahan. Waktu ini cukup untuk booking fotografer, fitting kostum, dan proses editing.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Budget minimal untuk foto prewedding?</h3>
              <p className="text-cream-300">Di CeritaKita Studio, paket prewedding mulai dari Rp400.000 sudah termasuk sesi indoor, 1 set baju, makeup, dan editing profesional.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Baju prewedding harus beli atau disewa?</h3>
              <p className="text-cream-300">Tidak harus beli! CeritaKita Studio menyediakan kostum adat Jawa dan outfit prewedding yang bisa dipakai. Kamu juga bisa bawa outfit sendiri.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apa yang harus dibawa saat sesi foto prewedding?</h3>
              <p className="text-cream-300">Bawa outfit cadangan, obat pribadi, air minum, tissue, dan aksesoris pendukung seperti payung atau bunga. Jangan lupa bawa senyum!</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
