import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "20 Ide Pose Self Photo Studio yang Instagramable | CeritaKita Studio",
  description:
    "Kumpulan 20 ide pose self photo studio yang Instagramable — pose solo, couple, keluarga, fun, dan elegant. Praktik langsung di CeritaKita Studio!",
  keywords:
    "ide pose self photo, pose self photo, pose foto studio, inspirasi pose foto, pose instagramable",
  openGraph: {
    title: "20 Ide Pose Self Photo Studio yang Instagramable | CeritaKita Studio",
    description:
      "Kumpulan ide pose self photo studio yang Instagramable untuk solo, couple, keluarga, dan grup.",
    url: "https://ceritakitastudio.site/blog/ide-pose-self-photo",
    siteName: "CeritaKita Studio",
    locale: "id_ID",
    type: "article",
  },
  alternates: {
    canonical: "https://ceritakitastudio.site/blog/ide-pose-self-photo",
  },
};

export default function IdePoseSelfPhotoPage() {
  return (
    <main className="bg-olive-900 min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Pose self photo apa yang paling mudah untuk pemula?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Pose berdiri dengan tangan di saku atau duduk santai di kursi adalah yang paling mudah untuk pemula. Mulai dari pose simpel sebelum bervariasi ke pose yang lebih ekspresif.",
              },
            },
            {
              "@type": "Question",
              name: "Bagaimana cara membuat foto self photo terlihat natural?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Jangan terlalu kaku — gunakan properti seperti buku atau bunga, lakukan gerakan kecil seperti membenarkan rambut atau tertawa, dan coba variasi angle dari depan, samping, dan belakang.",
              },
            },
            {
              "@type": "Question",
              name: "Apakah pose self photo berbeda untuk solo dan couple?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Ya, solo lebih fokus pada ekspresi diri dan gerakan, sedangkan couple membutuhkan interaksi seperti berhadapan, merangkul, atau melihat ke arah yang sama. Keduanya sama-sama seru!",
              },
            },
            {
              "@type": "Question",
              name: "Berapa banyak pose yang bisa dicoba dalam satu sesi?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Dalam sesi 30 menit, kamu bisa mencoba 8-12 pose berbeda. Jika ambil paket couple atau group, waktu lebih panjang dan variasi pose lebih banyak.",
              },
            },
          ],
        }}
      />
      <article className="max-w-4xl mx-auto px-6 py-20 text-cream-100">
        <nav className="text-sm text-cream-400 mb-8">
          <Link href="/" className="hover:text-gold-400">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/blog" className="hover:text-gold-400">
            Blog
          </Link>{" "}
          / <span>Ide Pose Self Photo</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-6">
          20 Ide Pose Self Photo Studio yang Instagramable
        </h1>

        <p className="text-cream-300 text-sm mb-8">
          Terakhir diperbarui: 18 Agustus 2026 · Waktu baca: 4 menit
        </p>

        <div className="prose prose-invert max-w-none space-y-6 text-cream-200 leading-relaxed">
          <p>
            Mau foto di studio tapi bingung mau pose apa? Tenang, kamu nggak
            sendirian! Banyak orang merasa canggung saat pertama kali self photo.
            Padahal, dengan referensi pose yang tepat, foto kamu bisa terlihat
            <strong> natural, aesthetic, dan Instagramable</strong> banget.
          </p>

          <p>
            Berikut <strong>20 ide pose self photo studio</strong> yang bisa
            langsung kamu praktikkan di CeritaKita Studio. Dibagi berdasarkan
            kategori biar gampang dipilih sesuai mood!
          </p>

          {/* ===== POSE SOLO ===== */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Pose Solo (1–5)
          </h2>

          <ol className="list-decimal list-inside space-y-4 text-cream-300">
            <li>
              <strong>Casual Lean</strong> — Bersandar ringan di dinding atau
              properti studio. Tangan satu di saku, pandangan ke arah kamera atau
              sedikit ke samping. Gaya effortless yang nggak pernah salah.
            </li>
            <li>
              <strong>Hair Toss</strong> — Jepret saat kamu sedang membenarkan
              rambut atau melempar rambut ke belakang. Hasilnya dinamis dan
              terlihat candid.
            </li>
            <li>
              <strong>Looking Away</strong> — Pandangan ke arah jendela atau ke
              atas seolah sedang berpikir. Pose ini menghasilkan foto yang
              artistic dan penuh makna.
            </li>
            <li>
              <strong>Mid-Laugh</strong> — Tertawa lepas saat remote shutter
              ditekan. Ekspresi tawa yang natural jauh lebih menarik dari senyum
              kaku.
            </li>
            <li>
              <strong>Prop Play</strong> — Pegang buku, bunga, atau kopi. Props
              membuat tangan nggak bingung dan menambah cerita dalam foto.
            </li>
          </ol>

          {/* ===== POSE COUPLE ===== */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Pose Couple (6–10)
          </h2>

          <ol className="list-decimal list-inside space-y-4 text-cream-300" start={6}>
            <li>
              <strong>Forehead Touch</strong> — Berdiri berhadapan, dahi
              bersentuhan. Pose klasik yang romantis dan timeless untuk couple.
            </li>
            <li>
              <strong>Piggyback Ride</strong> — Salah satu naik punggung yang
              lain. Foto yang playful dan menunjukkan kehangatan hubungan.
            </li>
            <li>
              <strong>Walking Together</strong> — Berjalan berdampingan sambil
              sesekali saling melihat. Terlihat natural seperti di film.
            </li>
            <li>
              <strong>Back-to-Back</strong> — Duduk atau berdiri berdampingan
              membelakangi. Pose ini stylish dan cocok untuk pasangan yang suka
              gaya modern.
            </li>
            <li>
              <strong>Surprise Kiss</strong> — Satu orang mengecup pipi atau
              kening, yang lain tersenyum malu. Romantis dan candid!
            </li>
          </ol>

          {/* ===== POSE KELUARGA ===== */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Pose Keluarga (11–14)
          </h2>

          <ol className="list-decimal list-inside space-y-4 text-cream-300" start={11}>
            <li>
              <strong>Huddle Shot</strong> — Semua anggota keluarga berhimpit
              dekat, pipi bertemu pipi. Foto hangat yang cocok untuk kenang-kenangan.
            </li>
            <li>
              <strong>Sitting on Floor</strong> — Duduk bersila di lantai studio
              dalam formasi segitiga atau barisan. Terlihat santai dan kompak.
            </li>
            <li>
              <strong>Matching Action</strong> — Lakukan gerakan serempak:
              melompat, menunjuk kamera, atau mengangkat tangan. Foto yang penuh
              energi!
            </li>
            <li>
              <strong>Generation Link</strong> — Kakek-nenek memegang tangan
              cucu-cucu dalam barisan. Pose emosional yang sangat berkesan.
            </li>
          </ol>

          {/* ===== POSE FUN ===== */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Pose Fun (15–18)
          </h2>

          <ol className="list-decimal list-inside space-y-4 text-cream-300" start={15}>
            <li>
              <strong>Jump Shot</strong> — Loncat bersama di depan kamera. Pakai
              burst mode biar dapat momen terbaik saat di udara.
            </li>
            <li>
              <strong>Silly Face</strong> — Lelucon wajah konyol bersama teman.
              Foto ini justru paling banyak di-share karena terlihat fun dan autentik.
            </li>
            <li>
              <strong>Pretend to Fight</strong> — Pose seperti sedang bertarung
              atau berlomba. Gaya action yang kocak dan bikin foto nggak
              membosankan.
            </li>
            <li>
              <strong>Photo Booth Style</strong> — Berjejer dan pose bergantian
              setiap beberapa detik. Hasilnya mirip photo booth yang seru.
            </li>
          </ol>

          {/* ===== POSE ELEGANT ===== */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Pose Elegant (19–20)
          </h2>

          <ol className="list-decimal list-inside space-y-4 text-cream-300" start={19}>
            <li>
              <strong>Silk Drape</strong> — Gunakan kain sutra atau kain adat
              sebagai aksesori. Biarkan kain menjuntai atau dililitkan anggun.
              Pose ini sempurna untuk tema tradisional Jawa.
            </li>
            <li>
              <strong>Three-Quarter Turn</strong> — Berdiri dengan badan
              menghadap 45 derajat ke kamera, dagu sedikit terangkat. Pose ini
              memberikan ilusi wajah yang lebih tirus dan tajam.
            </li>
          </ol>

          {/* ===== TIPS ===== */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">
            Tips Agar Pose Terlihat Maksimal
          </h2>

          <ul className="list-disc list-inside space-y-3 text-cream-300">
            <li>
              <strong>Pilih 3–5 pose favorit</strong> sebelum sesi agar nggak
              bingung saat di studio
            </li>
            <li>
              <strong>Gunakan properti</strong> — CeritaKita menyediakan
              aksesoris, bunga, dan kostum yang bisa jadi pelengkap pose
            </li>
            <li>
              <strong>Ubah angle</strong> — Coba pandangan ke atas, ke samping,
              atau ke belakang kamera untuk variasi
            </li>
            <li>
              <strong>Ekspresi kunci</strong> — Senyum tipis, tertawa lepas, atau
              ekspresi serius; pilih satu dan pertahankan
            </li>
            <li>
              <strong>Napas dalam sebelum jepret</strong> — Membantu tubuh
              rileks dan ekspresi lebih natural
            </li>
          </ul>

          {/* ===== CTA ===== */}
          <div className="bg-olive-800 border border-gold-400/30 p-6 rounded-lg mt-12">
            <h3 className="font-display text-xl text-gold-400 mb-3">
              Siap Praktikkan Pose-Pose Itu?
            </h3>
            <p className="text-cream-300 mb-4">
              Booking self photo di CeritaKita Studio sekarang! Mulai Rp150K
              sudah termasuk makeup, kostum adat Jawa, dan semua file
              high-res. Tim kami siap membantu ide pose terbaikmu.
            </p>
            <a
              href="https://wa.me/6285190832058?text=Halo%20CeritaKita%2C%20saya%20mau%20booking%20self%20photo"
              className="inline-block bg-gold-500 text-olive-900 px-6 py-3 font-bold tracking-wider hover:bg-gold-400 transition-colors"
            >
              BOOKING VIA WHATSAPP
            </a>
          </div>

          {/* ===== FAQ ===== */}
          <h2 className="font-display text-2xl text-gold-400 mt-12">FAQ</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-cream-100">
                Pose self photo apa yang paling mudah untuk pemula?
              </h3>
              <p className="text-cream-300">
                Pose berdiri dengan tangan di saku atau duduk santai di kursi
                adalah yang paling mudah untuk pemula. Mulai dari pose simpel
                sebelum bervariasi ke pose yang lebih ekspresif.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">
                Bagaimana cara membuat foto self photo terlihat natural?
              </h3>
              <p className="text-cream-300">
                Jangan terlalu kaku — gunakan properti seperti buku atau bunga,
                lakukan gerakan kecil seperti membenarkan rambut atau tertawa, dan
                coba variasi angle dari depan, samping, dan belakang.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">
                Apakah pose self photo berbeda untuk solo dan couple?
              </h3>
              <p className="text-cream-300">
                Ya, solo lebih fokus pada ekspresi diri dan gerakan, sedangkan
                couple membutuhkan interaksi seperti berhadapan, merangkul, atau
                melihat ke arah yang sama. Keduanya sama-sama seru!
              </p>
            </div>
            <div>
              <h3 className="font-bold text-cream-100">
                Berapa banyak pose yang bisa dicoba dalam satu sesi?
              </h3>
              <p className="text-cream-300">
                Dalam sesi 30 menit, kamu bisa mencoba 8-12 pose berbeda. Jika
                ambil paket couple atau group, waktu lebih panjang dan variasi
                pose lebih banyak.
              </p>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
