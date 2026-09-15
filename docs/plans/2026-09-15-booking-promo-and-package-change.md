# Plan: Promo Booking dan Pergantian Paket Customer

Tanggal: 2026-09-15
Status: **Completed — Gap 0; lint, typecheck, regression, browser QA, build passed**
Scope: dua perbaikan yang disetujui user — promo pada form publik aktif dan ganti paket booking admin. Link booking khusus di luar scope.

## 1. Konteks dan Root Cause

- Admin Kupon dan input promo pada form lama sudah ada; `/booking` memakai `MultiStepBookingForm` yang belum memasang input promo.
- State promo sudah tersedia, tetapi nominal diskon create booking masih dipercaya dari payload. Pencatatan pemakaian terjadi setelah commit dan kegagalan diabaikan; kuota bisa terlampaui.
- Detail booking hanya menampilkan kategori. Add-ons & Adjustments mengubah biaya, bukan identitas paket.
- Update umum belum memvalidasi pergantian paket/harga katalog secara terpadu. Completed immutable, perubahan finance/add-on hanya Active.
- Katalog paket sebenarnya file `data/services.json`; DB SQLite menyimpan booking, add-on, promo, dan pembayaran.

## 2. Keputusan Scope / Kebijakan

### Promo

- Kolom Terapkan/Hapus pada langkah pembayaran, sebelum DP; rincian subtotal/promo/total di ringkasan mobile dan desktop.
- Ganti paket/add-on menghapus promo; respons validasi lama tidak boleh menerapkan promo pada harga yang sudah berubah.
- Server menghitung harga paket/add-on dari katalog saat create, mengabaikan nominal diskon dari browser, menormalisasi kode, dan memvalidasi ulang promo saat commit.
- Booking + payment + add-on + pemakaian/kuota promo disimpan dalam satu transaksi SQLite sinkron. Tidak ada await di callback transaksi.
- Diskon tidak melebihi subtotal. DP tidak melebihi total hasil validasi; total nol boleh tanpa transfer/bukti.
- Tanggal promo berbentuk YYYY-MM-DD berlaku penuh sampai akhir hari WIB.

### Ganti paket

- Hanya booking **Active**; Rescheduled perlu dikembalikan ke Active dahulu. Cancelled/Completed tidak boleh.
- Paket baru menggunakan harga/diskon katalog aktif saat preview/commit.
- Pertahankan ID, customer, jadwal, fotografer, lead, dan seluruh baris pembayaran/bukti asli.
- Pertahankan add-on biasa yang masih aktif dan cocok kategori baru, dengan harga snapshot booking. Lepas add-on yang tidak cocok/nonaktif, harga negatif, serta item bernama upgrade/downgrade/penyesuaian agar tidak menghitung upgrade dua kali. Preview wajib menjelaskan item dilepas.
- **Promo lama dilepas pada pergantian paket**, ditampilkan eksplisit dalam preview. Riwayat penggunaan tetap sebagai audit; kuota tidak dikembalikan otomatis. Tidak ada penerapan promo baru via ganti paket dalam scope ini.
- Alasan wajib; simpan aktor dari sesi server, waktu, snapshot paket/finance/add-on sebelum dan sesudah.
- Preview server menghasilkan fingerprint; commit menolak preview basi apabila booking/pembayaran/harga katalog berubah. Update paket + history atomik, tidak menulis ulang payments.
- Selisih DP/kelebihan bayar terlihat. Refund/kredit tidak diproses otomatis.
- Update umum tidak boleh mengganti identitas paket di luar alur khusus.

## 3. Scope File

- `components/booking/{MultiStepBookingForm,MultiStepForm}.tsx`, `components/booking/steps/{PaymentInfo,ServiceSelection}.tsx`, komponen promo baru.
- `app/api/coupons/validate/route.ts`, `lib/services/{coupon-service,booking-service}.ts`, `lib/coupon-rules.ts`, repositories booking/coupons/addons.
- Komponen admin ganti paket baru, `components/admin/Bookings/modals/BookingDetailModal.tsx`, `components/admin/AdminModals.tsx`.
- Route khusus `app/api/bookings/change-package/route.ts`, service/repository package-change baru, helper transaksi repository.
- `lib/db.ts`: tabel history CREATE IF NOT EXISTS + index; jalankan idempoten untuk database lama juga tanpa rewrite migration engine.
- `lib/types/booking.ts`, barrel types/admin, `lib/validation.ts` jika dibutuhkan.
- Script regression terisolasi menggunakan SQLite sementara; dokumentasi user.

## 4. Urutan Implementasi

1. Lengkapi plan dan keputusan bisnis (dokumen ini) sebelum fix.
2. Validasi promo server, transaksi create+usage, dan pricing katalog.
3. Sambungkan UI promo, reset/race safety, rincian total, validasi DP.
4. Migration history, service preview/commit, guard permission `booking.update`, UI admin.
5. Residual gap review hingga 0, graphify update.
6. Lint, typecheck, regression script/database sementara dan QA browser jika tersedia.
7. Build terakhir setelah semua gate lolos. Tidak push tanpa instruksi.

## Residual Gap

- [x] Promo tersambung, mobile/desktop, loading/error/hapus, response stale aman.
- [x] Server tidak percaya harga/diskon browser; validasi ulang kuota/promo dan DP.
- [x] Create booking dan pemakaian promo atomik; regression rollback/kuota disiapkan.
- [x] Preview/commit ganti paket, auth/permission/status, stale preview guard.
- [x] Pembayaran/bukti dan ID terjaga; add-on/promo mengikuti kebijakan eksplisit.
- [x] History schema idempoten fresh/existing DB dan tampil di admin.
- [x] Kelebihan bayar terlihat, tidak ada refund otomatis.
- [x] Script regression terisolasi dan dokumentasi staff disiapkan.

**Gap implementasi: 0** setelah review source. Mulai VERIFY; kegagalan membuka gap kembali. Hasil lint/typecheck/regression/browser/build dicatat terpisah di bawah.

### Temuan baseline di luar scope

Pencarian layering menemukan penggunaan `getDb()` yang sudah ada sebelum task pada `app/api/debug/attribution`, `app/api/wa/[[...source]]`, `app/api/bookings/link-lead`, `app/api/meta/reconcile`, `app/api/meta/manage`. Routes yang disentuh/ditambahkan dalam task ini tetap melalui service/repository. Cleanup baseline tersebut tidak digabung dengan perbaikan produk ini.

## 5. Test Scope

- Promo fixed/percentage/max/min, invalid/nonaktif/not-yet/expired/WIB end-date, exhausted quota, diskon > subtotal, normalisasi kode, total nol.
- Harga/diskon/add-on tampering, kuota terakhir, rollback insert/history, DP > total, create tanpa promo.
- UI apply/remove/retry/network failure, ganti paket/add-on saat request, navigasi mobile/desktop, reload progress, pembayaran total nol.
- Upgrade/downgrade/same package/invalid/inactive; Active/Rescheduled/Cancelled/Completed; legacy tanpa serviceId; add-on compatible/incompatible/adjustment; promo removal; outstanding/paid/overpaid.
- Stale preview setelah pembayaran/katalog berubah; atomic failure; payment rows dan proof URL tetap identik.
- History setelah reopen; API anonymous/permission denied.
- `npm run lint`, `npx tsc --noEmit`, scope script, layering `rg`, lalu `npm run build`.

## 6. Safety dan Verifikasi

- Tidak memakai DB produksi/local existing untuk regression. Gunakan cwd sementara dengan data/services fixtures; backup SQLite sebelum build jika build menginisialisasi DB lokal.
- Dependencies belum terpasang saat mulai; gunakan Node 20 yang tersedia untuk kompatibilitas better-sqlite3.
- Tidak mengubah `.commandcode/` atau plan SaaS yang sudah untracked sebelum task.
- Hasil aktual dan keterbatasan QA dicatat di bawah.

## 7. Hasil Verify (2026-09-15)

- Gap implementasi: **0**.
- Putaran typecheck pertama menemukan 2 implicit-any pada hook bag admin dan function declaration dalam block script (target ES5); sudah diperbaiki. Putaran ulang: **0 error**.
- `npm run lint`: exit 0; warning `<img>` lama di `components/admin/ads/ExplorerCreativesTab.tsx:94` tidak terkait task.
- `npx tsc --noEmit`: exit 0.
- `NODE_OPTIONS=--conditions=react-server npx tsx scripts/test-booking-promo-package.ts`: **36 checks passed** pada SQLite/cwd sementara, termasuk migration fresh/existing, kuota terakhir, rollback, anti-tamper harga/diskon, DP, perubahan paket, stale preview, dan payment rows/proof identik. Timer legacy membuat run awal tidak exit meski assertions selesai; script kini exit setelah cleanup.
- Browser Chrome pada sandbox tanpa `.env.local`/data asli: desktop dan viewport mobile 390px; apply/remove/invalid/network-error promo, total nol tanpa upload, late response setelah navigasi, ganti paket melepas promo.
- Browser admin: preview upgrade + DP, commit UI, downgrade/overpayment, history setelah reload, akun view-only ditolak 403, anonymous history ditolak 401.
- QA reload membuka gap kecil: autosave menimpa progress sebelum restore pada StrictMode. Ditambahkan gate `progressRestored`, lalu diuji ulang di browser: kontak/jadwal dipertahankan, harga/promo tersimpan yang dimanipulasi tidak dipulihkan. Gap kembali 0. Pilihan paket/add-on dipilih ulang setelah reload agar memakai katalog terkini.
- HTTP browser public multipart submit tanpa transfer dengan promo 100%: 201, total 0, nominal diskon palsu diabaikan.
- Tidak mengirim WA/email/refund ke customer dan tidak memakai data produksi untuk QA.
- `graphify update .`: selesai. Warning dua file non-source tidak menghasilkan node; graph source diperbarui.
- Layering: route baru/berubah patuh. Pelanggaran baseline dicatat di atas; tidak ada import storage-sqlite baru.
- Final rerun lint/typecheck/regression: seluruhnya exit 0; 36 checks tetap lolos.
- `npm run build` dengan Node 20: **exit 0**, route `/booking` dan `/api/bookings/change-package` terkompilasi. Warning `<img>` baseline yang sama, tidak ada build error.
- Server sandbox dihentikan sebelum build. Backup SQLite konsisten dibuat di `data/backups/pre-booking-promo-package-2026-09-15T03-28-49.390Z.db` sebelum build; DB/backup tidak di-commit.
- User kemudian menyetujui commit, push, deploy, dan pemantauan `gh run watch`.

## 8. Release / Deploy (2026-09-15)

- Preflight VPS: image lama healthy, checkout selaras dengan origin/main sebelum perubahan ini.
- Backup konsisten via SQLite backup API dibuat sebelum push: `data/backups/pre-promo-package-20260915T033354Z.db`; quick_check DB dan backup **ok**.
- Image lama ditag `ceritakita-booking-rollback:pre-promo-package-20260915T033354Z` agar tidak hilang saat image prune.
- Baseline agregat: bookings 131, payments 234, coupons 1, coupon_usage 0, meta_insights_daily 99, wa_clicks 8550; total harga booking 41.123.000, total pembayaran 40.898.000.
- Pre-push lint/typecheck/36 regression checks kembali lolos. Build diulang terakhir sebelum commit: **exit 0**.
- Hanya perubahan fitur ini yang di-stage; `.commandcode/` dan plan SaaS di luar commit.
- Run pertama `34925572355` untuk commit `e689d10`: release-please/build/deploy sukses, `gh run watch --exit-status` exit 0. Image runtime cocok dengan digest hasil CI.
- Verifikasi VPS membuka gap operasional: `/api/health` ter-prerender/cached oleh Next.js; timestamp tetap dari build dan migrasi runtime belum dipicu walau health hijau. Tabel `booking_package_history` belum ada saat query read-only pertama. Tidak menyimpulkan CI green sebagai data sehat.
- Follow-up fix scope hanya `app/api/health/route.ts`: tambahkan `dynamic = 'force-dynamic'` agar probe menjalankan `getDb()`/SELECT 1 setiap request dan memicu migrasi idempoten pada startup/probe pertama. Plan dicatat sebelum fix; tidak melakukan manual DDL atau mengganti data customer.
- Follow-up health force-dynamic selesai; gap kode 0. Lint/typecheck/36 regression dan build ulang exit 0; output build memastikan `/api/health` adalah route **ƒ dynamic**, bukan static. Berikutnya commit/push → watch run kedua → verifikasi timestamps bergerak, schema, counts/sums, log, backup, dan image.
- Jangan membuat booking atau menukar paket customer produksi untuk smoke test.
- Rollback bila diperlukan: jalankan image lama yang sudah ditag; migrasi baru hanya menambah tabel history sehingga tidak perlu restore DB yang berisiko menghapus transaksi customer baru. Restore backup hanya dengan keputusan eksplisit jika data benar-benar rusak.
