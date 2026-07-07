import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Tips Foto Studio Pertama Kali: Panduan Pemula 2026 | CeritaKita Studio",
  description:
    "Baru pertama kali foto studio? Ini tips lengkap agar hasilnya maksimal. Persiapan, pose, kostum, dan tips dari CeritaKita Studio.",
  keywords:
    "tips foto studio, foto studio pertama kali, tips foto pertama, persiapan foto studio, tips self photo, panduan foto studio pemula",
  openGraph: {
    title: "Tips Foto Studio Pertama Kali — CeritaKita Studio",
    description:
      "Baru pertama kali foto studio? Simak tips lengkap persiapan, pose, kostum, dan panduan pemula dari CeritaKita Studio.",
    url: "https://ceritakitastudio.site/blog/tips-foto-studio-pertama-kali",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/tips-foto-studio-pertama-kali",
  },
};

export default function TipsFotoStudioPertamaKaliPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Apakah harus bawa baju sendiri saat foto studio pertama kali?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tidak harus. CeritaKita Studio menyediakan kostum adat Jawa dan berbagai outfit menarik yang sudah termasuk dalam paket. Namun, kamu boleh membawa outfit sendiri jika ingin tampil lebih personal."
            }
          },
          {
            "@type": "Question",
            "name": "Berapa lama durasi sesi foto studio untuk pemula?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sesi foto standar di CeritaKita Studio berdurasi 30 menit. Untuk pemula, durasi ini cukup untuk mencoba berbagai pose dan background. Kamu juga bisa upgrade durasi jika butuh lebih banyak variasi."
            }
          },
          {
            "@type": "Question",
            "name": "Apakah perlu reservasi sebelum datang ke studio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sangat disarankan untuk reservasi terlebih dahulu via WhatsApp agar jadwalmu terjamin. Walk-in juga bisa, tapi tergantung ketersediaan slot di hari tersebut."
            }
          },
          {
            "@type": "Question",
            "name": "Bagaimana cara agar hasil foto terlihat natural dan tidak kaku?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Tentukan beberapa pose referensi dari Instagram atau Pinterest sebelum datang. Tenang dan rileks saat sesi, ikuti arahan fotografer, dan jangan ragu untuk bereksperimen dengan ekspresi wajah."
            }
          }
        ]
      }} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Foto Studio Pertama Kali",
        "description": "Sesi foto studio untuk pemula di CeritaKita Studio. Include makeup, kostum, sesi foto 30 menit, dan editing profesional. Cocok untuk yang baru pertama kali foto studio.",
        "brand": { "@type": "Brand", "name": "CeritaKita Studio" },
        "offers": {
          "@type": "Offer",
          "price": 150000,
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
          <Link href="/" className="hover:text-gold-400">Home</Link>{' '} /{' '}
          <Link href="/blog" className="hover:text-gold-400">Blog</Link>{' '} /{' '}
          <span>Tips Foto Studio Pertama Kali</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          Tips Foto Studio Pertama Kali: Panduan Lengkap untuk Pemula
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 11 Agustus 2026 · Waktu baca: 5 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Pertama kali mau foto studio tapi bingung harus mulai dari mana? Tenang, kamu nggak sendirian! Banyak orang merasa gugup dan bingung saat pertama kali foto studio. Padahal, dengan persiapan yang tepat, hasil foto pertamamu bisa terlihat <strong>profesional dan memukau</strong>. Berikut panduan lengkap dari <strong>CeritaKita Studio</strong> untuk pemula.
          </p>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            1. Persiapan Sebelum ke Studio
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Tentukan tujuan foto</strong> — Apakah untuk pas foto, profil LinkedIn, kenangan pribadi, atau ulang tahun? Tujuan yang jelas akan membantu memilih outfit dan pose yang tepat.</li>
            <li><strong>Cari referensi pose</strong> — Browsing Instagram, Pinterest, atau TikTok untuk pose-pose yang kamu suka. Simpan beberapa referensi untuk ditunjukkan ke fotografer.</li>
            <li><strong>Perawatan wajah</strong> — Beberapa hari sebelum sesi, rajin minum air putih dan gunakan moisturizer. Hindari produk wajah baru yang bisa menyebabkan iritasi.</li>
            <li><strong>Istirahat cukup</strong> — Tidur minimal 7 jam semalam sebelum sesi. Wajah yang segar dan fresh akan jauh lebih photogenic.</li>
            <li><strong>Hubungi studio</strong> — Konfirmasi jadwal dan tanyakan apa saja yang perlu dibawa. Di CeritaKita Studio, cukup chat WhatsApp untuk reservasi.</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            2. Tips Memilih Kostum &amp; Outfit
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Hindari motif ramai</strong> — Pakaian polos atau dengan motif simpel lebih mudah di-mix dengan background studio. Warna solid seperti putih, hitam, merah maroon, atau earth tones selalu aman.</li>
            <li><strong>Bawa 2-3 outfit</strong> — Bawa beberapa pilihan baju agar bisa berganti-ganti gaya selama sesi foto. Bawa juga outer seperti blazer atau cardigan untuk variasi.</li>
            <li><strong>Pakai baju yang nyaman</strong> — Kamu akan berpose dan bergerak cukup banyak. Pilih outfit yang nyaman dan nggak bikin kamu merasa canggung.</li>
            <li><strong>Pakai kostum studio</strong> — CeritaKita Studio menyediakan kostum adat Jawa dan berbagai outfit menarik yang sudah termasuk paket. Nggak perlu repot bawa!</li>
            <li><strong>Hindari accessories berlebihan</strong> — Jam tangan, kalung simpel, atau anting kecil oke. Tapi hindari accessories besar yang bisa mengalihkan perhatian dari wajah.</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            3. Tips Pose untuk Pemula
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Condongkan wajah sedikit ke atas</strong> — Sedikit mengangkat dagu ke atas akan mempertegas garis rahang dan menghindari efek &quot;double chin&quot;.</li>
            <li><strong>Rilekskan bahu</strong> — Bahu yang tegang bikin foto terlihat kaku. Tarik napas dalam, turunkan bahu, dan biarkan tubuh rileks.</li>
            <li><strong>Jangan langsung ke kamera</strong> — Coba arahkan pandangan ke arah lain, tersenyum tipis, atau tertawa kecil untuk hasil yang lebih natural dan candid.</li>
            <li><strong>Gunakan tangan</strong> — Letakkan tangan di pinggang, rambut, atau dagu untuk variasi pose. Tangan yang nggak ke mana-mana bisa bikin foto terlihat awkward.</li>
            <li><strong>Tersenyum dengan mata</strong> — Senyum yang tulus akan terlihat dari mata. Bayangkan ada teman yang bercerita lucu tepat di belakang kamera.</li>
            <li><strong>Ikuti arahan fotografer</strong> — Jangan ragu untuk bertanya. Fotografer profesional akan membantumu menemukan angle terbaik untuk wajahmu.</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            4. Tips Saat Sesi Foto Berlangsung
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Warm up dulu</strong> — Mulai dengan pose simpel dan pose yang sudah kamu latih di rumah. Nggak perlu langsung pose rumit.</li>
            <li><strong>Eksplorasi background</strong> — Manfaatkan semua background yang tersedia. Di CeritaKita Studio, ada berbagai setup yang bisa kamu coba.</li>
            <li><strong>Minta preview</strong> — Setelah beberapa shot, minta lihat hasilnya di layar kamera. Ini membantu kamu tahu apa yang perlu diperbaiki.</li>
            <li><strong>Banyak variasi pose</strong> — Jangan stuck di satu pose. Berubahlah antara berdiri, duduk, berdiri dengan satu tangan di pinggang, dan sebagainya.</li>
            <li><strong>Nikmati prosesnya</strong> — Jangan terlalu serius! Yang penting adalah momen dan pengalaman. Hasil yang natural datang dari kesenangan yang tulus.</li>
          </ul>

          <h2 className="font-display text-2xl text-gold-400 mt-12">
            5. Setelah Sesi Foto
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li><strong>Tunggu editing</strong> — Di CeritaKita Studio, file digital dikirim via Google Drive maksimal 3 hari kerja. Hasil editing sudah termasuk koreksi warna dan retouching.</li>
            <li><strong>Pilih foto terbaik</strong> — Biasanya ada beberapa foto yang perlu dipilih. Jangan ragu untuk minta bantuan tim kami dalam memilih.</li>
            <li><strong>Simpan file digital</strong> — Simpan file asli di beberapa tempat: hard disk, cloud storage, atau USB. Jangan hanya andalkan satu tempat.</li>
            <li><strong>Bagikan hasilnya</strong> — Upload ke media sosial, jadikan profil picture, atau cetak untuk dipajang. Hasil foto yang bagus layak untuk dibagikan!</li>
          </ul>

          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Siap Foto Studio Pertama Kali?
            </h3>
            <p className="text-cream-300 mb-4">
              Jangan tunda lagi! CeritaKita Studio siap membantu pengalaman foto pertamamu jadi menyenangkan dan hasilnya memukau. Mulai Rp150K sudah termasuk makeup, kostum, dan editing profesional.
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20baru%20pertama%20kali%20foto%20studio"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              BOOKING VIA WHATSAPP
            </a>
          </div>

          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">Apakah harus bawa baju sendiri saat foto studio pertama kali?</h3>
              <p className="text-cream-300">Tidak harus. CeritaKita Studio menyediakan kostum adat Jawa dan berbagai outfit menarik yang sudah termasuk dalam paket. Namun, kamu boleh membawa outfit sendiri jika ingin tampil lebih personal.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Berapa lama durasi sesi foto studio untuk pemula?</h3>
              <p className="text-cream-300">Sesi foto standar di CeritaKita Studio berdurasi 30 menit. Untuk pemula, durasi ini cukup untuk mencoba berbagai pose dan background. Kamu juga bisa upgrade durasi jika butuh lebih banyak variasi.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Apakah perlu reservasi sebelum datang ke studio?</h3>
              <p className="text-cream-300">Sangat disarankan untuk reservasi terlebih dahulu via WhatsApp agar jadwalmu terjamin. Walk-in juga bisa, tapi tergantung ketersediaan slot di hari tersebut.</p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">Bagaimana cara agar hasil foto terlihat natural dan tidak kaku?</h3>
              <p className="text-cream-300">Tentukan beberapa pose referensi dari Instagram atau Pinterest sebelum datang. Tenang dan rileks saat sesi, ikuti arahan fotografer, dan jangan ragu untuk bereksperimen dengan ekspresi wajah.</p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
