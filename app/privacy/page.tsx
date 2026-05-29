export const metadata = {
  title: 'Kebijakan Privasi - CeritaKita Studio',
  description: 'Kebijakan privasi layanan CeritaKita Studio. Pelajari bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kebijakan Privasi</h1>
        <p className="text-sm text-gray-500 mb-10">Terakhir diperbarui: 29 Mei 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Pendahuluan</h2>
          <p className="text-gray-700 leading-relaxed">
            CeritaKita Studio (&quot;kami&quot;, &quot;kita&quot;) menghargai privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda saat menggunakan layanan booking dan website kami.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Informasi yang Kami Kumpulkan</h2>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1">
            <li><strong>Informasi Akun:</strong> nama lengkap, nomor telepon, alamat email, dan kata sandi (di-hash).</li>
            <li><strong>Informasi Booking:</strong> tanggal dan waktu sesi foto, jenis layanan, jumlah tamu, dan catatan khusus.</li>
            <li><strong>Informasi Pembayaran:</strong> kami menggunakan penyedia pembayaran pihak ketiga. Kami tidak menyimpan nomor kartu kredit secara langsung.</li>
            <li><strong>Data Penggunaan:</strong> log aktivitas, alamat IP, tipe browser, dan perangkat yang digunakan.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Penggunaan Informasi</h2>
          <p className="text-gray-700 leading-relaxed mb-2">
            Kami menggunakan informasi Anda untuk:
          </p>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1">
            <li>Memproses dan mengelola pemesanan sesi foto.</li>
            <li>Mengirimkan notifikasi dan pengingat terkait jadwal booking.</li>
            <li>Meningkatkan kualitas layanan dan pengalaman pengguna.</li>
            <li>Menganalisis performa iklan dan pemasaran melalui platform resmi seperti Meta Ads.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Berbagi Informasi</h2>
          <p className="text-gray-700 leading-relaxed">
            Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda. Data hanya dibagikan dengan pihak ketiga yang terpercaya dan wajib menjaga kerahasiaan, seperti penyedia pembayaran, layanan analitik, dan penyedia hosting.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Keamanan Data</h2>
          <p className="text-gray-700 leading-relaxed">
            Kami menerapkan langkah-langkah teknis dan organisasional yang sesuai untuk melindungi data Anda dari akses tidak sah, perubahan, pengungkapan, atau penghapusan yang tidak sah. Termasuk penggunaan enkripsi HTTPS, penyimpanan kata sandi yang di-hash, dan pembatasan akses internal.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Hak Pengguna</h2>
          <p className="text-gray-700 leading-relaxed mb-2">
            Anda memiliki hak untuk:
          </p>
          <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1">
            <li>Mengakses informasi pribadi yang kami miliki tentang Anda.</li>
            <li>Meminta perbaikan atau pembaruan data yang tidak akurat.</li>
            <li>Meminta penghapusan akun dan data pribadi Anda.</li>
            <li>Menolak penggunaan data untuk tujuan pemasaran tertentu.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Cookies dan Teknologi Pelacakan</h2>
          <p className="text-gray-700 leading-relaxed">
            Kami menggunakan cookies dan teknologi serupa untuk menganalisis trafik website, mengingat preferensi pengguna, dan mengoptimalkan layanan iklan. Anda dapat mengelola preferensi cookies melalui pengaturan browser Anda.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Perubahan Kebijakan</h2>
          <p className="text-gray-700 leading-relaxed">
            Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu. Perubahan akan diumumkan di halaman ini dengan tanggal efektif yang diperbarui. Penggunaan berkelanjutan atas layanan kami setelah perubahan berarti Anda menerima kebijakan yang telah diperbarui.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Kontak</h2>
          <p className="text-gray-700 leading-relaxed">
            Jika Anda memiliki pertanyaan atau kekhawatiran mengenai Kebijakan Privasi ini, silakan hubungi kami melalui WhatsApp, Instagram, atau email resmi CeritaKita Studio.
          </p>
        </section>
      </div>
    </main>
  );
}
