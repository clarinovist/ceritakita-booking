# Roadmap Integrasi WhatsApp Chat → Booking/Transaksi

Tanggal: 2026-06-04  
Status: Draft operasional / product implementation plan  
Owner: CeritaKita Booking  
Scope: WhatsApp Workspace, WATI ingestion, relasi chat ke booking, ringkasan transaksi, dan fondasi AI CS.

---

## 1. Ringkasan Keputusan

Rekomendasi implementasi: **mulai dari Level 1 — Manual Link** sebelum auto-detect atau AI.

Alasan:

1. Backend linking sudah tersedia di repo.
2. Risiko salah taut booking lebih rendah karena admin memilih manual.
3. Impact operasional langsung terasa: chat pembayaran, DP, pelunasan, reschedule, dan komplain bisa dilihat bersama data booking.
4. Menjadi fondasi aman untuk Level 3 dashboard terpadu dan Level 2 suggested/auto-detect.

Urutan yang disarankan:

```text
Level 0 Data Collection
  → Level 1 Manual Link
  → Level 3 Ringkasan Terpadu
  → Level 2 Suggested/Auto-Detect
  → Level 4 AI Auto-Reply + Analisa
```

Catatan: Level 2 sebaiknya dimulai sebagai **suggested booking**, bukan langsung auto-link penuh.

---

## 2. Kondisi Saat Ini

### 2.1 Status produk

| Area | Status | Catatan |
|---|---:|---|
| WATI → SQLite | ✅ Live | Data chat sudah mulai terkumpul lewat polling. Snapshot operasional yang dilaporkan: 26 messages, 4 contacts, polling 10 menit. |
| Schema WhatsApp internal | ✅ Ada | `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_messages`, `message_outbox`. |
| Relasi conversation → booking | ✅ Ada | `whatsapp_conversations.booking_id`. |
| Index relasi booking | ✅ Ada | `idx_wa_conv_booking`. |
| API manual link booking | ✅ Ada | `POST /api/admin/whatsapp/conversations/[id]/link-booking`. |
| UI WhatsApp Workspace | ✅ Baseline ada | Repo saat ini sudah punya panel Customer 360, search booking, histori booking kontak, dan aksi link/unlink. |
| Ringkasan terpadu lengkap | ⚠️ Parsial | Sudah ada linked booking card, tetapi belum lengkap untuk status DP/sisa bayar dan suggested reply. |
| Auto-detect booking | ❌ Belum | Perlu logic matching nomor WA + confidence + review admin. |
| AI auto-reply | ❌ Belum | Tunggu send API WATI stabil dan guardrail siap. |

### 2.2 Fakta repo yang relevan

- Komponen utama: `components/admin/whatsapp/WhatsAppWorkspace.tsx`
- API link/unlink: `app/api/admin/whatsapp/conversations/[id]/link-booking/route.ts`
- Repository WhatsApp: `lib/repositories/whatsapp.ts`
- Schema DB: `lib/db.ts`
- Blueprint AI/WATI jangka panjang: `docs/plans/2026-06-04-ai-cs-whatsapp-wati-blueprint.md`

---

## 3. Definisi Level Integrasi

## Level 0 — Data Collection

Status: **Live**

Tujuan: semua chat WhatsApp dari WATI tersimpan dulu sebagai data internal.

Flow:

```text
Customer WhatsApp
  → WATI
  → Polling / webhook ingestion
  → SQLite internal
  → whatsapp_contacts / whatsapp_conversations / whatsapp_messages
```

Output minimum:

- kontak tersimpan;
- conversation tersimpan;
- pesan incoming/outgoing tersimpan;
- dedupe idempotent agar tidak double insert;
- timestamp WATI dan timestamp internal tersedia.

Acceptance criteria:

- Admin bisa melihat daftar conversation.
- Admin bisa membuka riwayat pesan per conversation.
- Polling berjalan stabil tanpa duplikasi besar.

---

## Level 1 — Manual Link Chat ke Booking

Status: **Prioritas sekarang**  
Effort: **± 1 hari untuk hardening UX jika baseline sudah ada**  
Impact: **Tinggi**

Tujuan: admin bisa menautkan satu percakapan WhatsApp ke booking yang benar.

Contoh kasus:

```text
Chat customer: "Saya sudah transfer ya"
        ↓ admin klik/pilih booking
Booking #123 - Rp 500.000 - Lunas/DP
        ↓
Conversation tersambung ke booking_id #123
```

### 3.1 API contract

Endpoint:

```http
POST /api/admin/whatsapp/conversations/[id]/link-booking
Content-Type: application/json
```

Request body:

```json
{
  "bookingId": "booking-id-atau-null"
}
```

Behavior:

- `bookingId` string → link conversation ke booking.
- `bookingId: null` → unlink conversation dari booking.
- Permission wajib: admin atau user dengan permission `whatsapp`.

### 3.2 UX minimum

Di `WhatsAppWorkspace`, saat conversation dipilih:

1. tampilkan status linked booking jika sudah ada;
2. tampilkan tombol/aksi **Tautkan Booking**;
3. admin bisa cari booking berdasarkan:
   - booking ID;
   - nama customer;
   - nomor WhatsApp;
4. admin bisa klik booking candidate;
5. setelah berhasil, UI update tanpa reload penuh;
6. admin bisa unlink jika salah taut.

### 3.3 UX ideal untuk hardening

Baseline repo saat ini sudah punya search dan list di right panel. Refinement yang disarankan:

| Refinement | Alasan |
|---|---|
| Jadikan aksi utama sebagai tombol jelas: **Link to Booking** | Lebih discoverable daripada hanya search field di side panel. |
| Modal/drawer khusus pilih booking | Mengurangi salah klik di histori booking. |
| Tampilkan ringkasan pembayaran sebelum confirm | Admin bisa validasi booking yang benar. |
| Confirmation untuk replace link existing | Mencegah link booking lama tertimpa tanpa sadar. |
| Toast non-blocking, bukan `alert()` | UX lebih halus dan tidak mengganggu flow chat. |
| Empty state dengan CTA | Kalau belum linked, admin langsung tahu next action. |

### 3.4 Data yang perlu tampil di candidate booking

Minimum:

- booking ID;
- nama customer;
- nomor WhatsApp;
- tanggal/jam booking;
- kategori/package;
- total harga;
- total dibayar;
- sisa pembayaran;
- status booking.

Format card contoh:

```text
#123 · Elisabet
Family Session · 12 Jun 2026 14:00
WA: 628xxx
Total Rp 500.000 · DP Rp 150.000 · Sisa Rp 350.000
Status: Active
```

### 3.5 Edge cases Level 1

| Kasus | Expected behavior |
|---|---|
| Conversation belum punya booking | Tampilkan CTA link. |
| Booking sudah linked | Tampilkan linked card + opsi unlink/replace. |
| Search tidak menemukan booking | Tampilkan empty state dan instruksi cek nomor/nama. |
| Booking ID invalid | API/UI menolak dengan error jelas. |
| Admin tidak punya permission WhatsApp | API return 403, UI sebaiknya tidak menampilkan aksi. |
| Dua conversation linked ke booking sama | Boleh untuk tahap awal, tapi perlu indikator di future hardening. |
| Salah link | Admin bisa unlink. |

---

## Level 3 — Ringkasan Terpadu Conversation + Booking

Status: **Setelah Level 1 stabil**  
Effort: **2–3 hari**  
Impact: **Tinggi**

Tujuan: admin tidak perlu pindah konteks antara chat dan booking table.

Contoh tampilan:

```text
📞 Elisabet — 5 pesan
💰 Booking #123 — Rp 500.000
📊 Status: DP Rp 150.000 | Sisa: Rp 350.000
🔗 CeritaKita: "Baik kak, untuk sisa pembayaran..."
```

### Data ringkasan yang dibutuhkan

Per conversation:

- display name / nomor WA;
- jumlah pesan;
- last inbound/outbound;
- booking linked;
- booking date/time;
- booking status;
- total price;
- paid amount;
- remaining balance;
- latest payment note/date;
- quick action:
  - buka booking detail;
  - copy reminder pembayaran;
  - mark resolved;
  - unlink/replace booking.

### Acceptance criteria

- Admin bisa memahami status customer dalam <10 detik tanpa buka halaman booking lain.
- Conversation linked menampilkan angka pembayaran yang benar.
- Jika belum linked, UI tetap menampilkan suggested/histori booking berdasarkan nomor WA.

---

## Level 2 — Suggested Booking / Auto-Detect

Status: **Setelah Level 3**  
Effort: **3–5 hari**  
Impact: **Sedang–Tinggi, tergantung kualitas nomor WA**

Catatan urutan: secara teknis level ini disebut Level 2, tapi secara implementasi disarankan **setelah Level 3** supaya admin sudah punya ringkasan yang jelas saat menerima suggestion.

### Rekomendasi mode awal

Jangan langsung auto-link. Mulai dari:

```text
Customer chat masuk
  → sistem cari booking by normalized phone
  → tampilkan Suggested Booking
  → admin approve
  → booking_id tersimpan
```

### Matching signal

| Signal | Confidence | Catatan |
|---|---:|---|
| Nomor WA exact match setelah normalize | Tinggi | Kandidat utama. |
| Nomor WA suffix match 8–10 digit | Sedang | Berguna jika format `08` vs `628`. |
| Nama display WATI mirip customer name | Rendah–Sedang | Hanya pendukung. |
| Booking aktif terbaru | Sedang | Prioritaskan `Active` dan tanggal dekat. |
| Ada keyword pembayaran/reschedule di chat | Pendukung | Untuk ranking, bukan identitas utama. |

### Confidence policy

| Confidence | Behavior |
|---|---|
| >= 0.90 | Boleh auto-link jika belum ada conflict, tapi tetap log audit. |
| 0.70–0.89 | Suggested booking, admin approve. |
| < 0.70 | Jangan suggest agresif; tampilkan search manual. |

Untuk tahap pertama, gunakan threshold aman: **semua hasil hanya suggestion, belum auto-link**.

---

## Level 4 — AI Auto-Reply + Analisa

Status: **Visi / future phase**  
Effort: **1–2 minggu minimum setelah send API stabil**  
Impact: **Tinggi, tapi risiko juga tinggi**

Fitur target:

- intent detection:
  - booking baru;
  - tanya harga;
  - tanya jadwal;
  - pembayaran/DP/pelunasan;
  - reschedule;
  - cancel;
  - komplain;
- draft reply untuk admin;
- auto-reply low-risk;
- daily report:
  - volume chat;
  - response time;
  - conversion chat → booking;
  - unresolved chat;
  - top questions;
  - complaint/reschedule trend.

### Guardrail wajib sebelum auto-reply

AI tidak boleh:

- mengarang harga;
- menjanjikan slot jadwal tanpa cek data;
- menyatakan pembayaran lunas tanpa verifikasi payment records;
- mengubah booking/cancel/reschedule tanpa konfirmasi admin;
- menangani komplain sensitif tanpa handover.

Mode awal yang aman:

```text
observe_only → draft_only → auto_low_risk → auto_with_handover
```

---

## 4. Roadmap Prioritas

| Prioritas | Level | Fitur | Effort | Impact | Kapan |
|---:|---|---|---:|---:|---|
| 1 | Level 1 | Manual Link + UX hardening | 1 hari | Tinggi | Sekarang |
| 2 | Level 3 | Ringkasan transaksi terpadu | 2–3 hari | Tinggi | Setelah L1 |
| 3 | Level 2 | Suggested Booking by phone | 3–5 hari | Sedang–Tinggi | Setelah L3 |
| 4 | Level 4 | AI draft/reply/report | 1–2 minggu | Tinggi | Setelah send API stabil |

---

## 5. Implementation Plan Level 1

### Step 1 — Audit baseline UI

Cek `WhatsAppWorkspace`:

- apakah tombol/CTA link mudah terlihat;
- apakah search booking cukup jelas;
- apakah linked booking card tampil benar;
- apakah unlink sudah aman;
- apakah error handling sudah jelas.

### Step 2 — UX hardening kecil

Perubahan minimal yang disarankan:

1. Tambah tombol eksplisit **Link to Booking** di chat header atau linked booking section.
2. Buka modal/drawer untuk search booking.
3. Tampilkan candidate booking dengan payment summary.
4. Tambah confirm saat replace existing linked booking.
5. Ganti `alert()` dengan toast/status inline jika sudah ada komponen toast di repo.

### Step 3 — API validation hardening

Saat ini API menerima `bookingId` lalu update conversation. Hardening yang disarankan:

- validasi conversation ID exists;
- validasi booking ID exists jika tidak null;
- return 404 jika conversation/booking tidak ditemukan;
- audit log minimal: siapa admin yang link/unlink;
- optional: reject empty string selain null.

### Step 4 — QA checklist

- Link booking dari search by ID.
- Link booking dari search by customer name.
- Link booking dari search by WhatsApp.
- Unlink booking.
- Replace booking existing.
- Refresh halaman: linked state tetap tampil.
- User tanpa permission tidak bisa hit API.
- Search dengan nomor format berbeda tetap menemukan kandidat jika memungkinkan.

---

## 6. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Salah link conversation ke booking | Admin salah baca status pembayaran/customer | Manual confirm, show payment summary, unlink cepat. |
| Nomor WA tidak konsisten formatnya | Candidate booking tidak muncul | Normalize phone di search/matching. |
| Auto-link terlalu agresif | Data transaksi misleading | Mulai dari suggested booking dulu. |
| Send API WATI belum stabil | AI/reply otomatis gagal | Pisahkan roadmap linking/dashboard dari send API. |
| Alert/blocking UX mengganggu CS | Flow chat lambat | Gunakan toast/status inline. |

---

## 7. Definition of Done Level 1

Level 1 dianggap selesai jika:

- admin bisa menautkan conversation ke booking dari WhatsApp Workspace;
- admin bisa melihat booking yang tertaut di conversation detail;
- admin bisa unlink/replace jika salah;
- linked state tersimpan di DB dan tetap ada setelah refresh;
- API permission berjalan;
- error state jelas saat booking/conversation tidak valid;
- tidak ada perubahan behavior ingestion WATI.

---

## 8. Next Action yang Direkomendasikan

1. Jadikan dokumen ini sebagai acuan sprint pendek WhatsApp → Transaction.
2. Review UI existing di `WhatsAppWorkspace` karena baseline Level 1 sudah ada.
3. Fokus hardening Level 1, bukan langsung Level 2/AI.
4. Setelah Level 1 nyaman dipakai admin, lanjut Level 3 ringkasan pembayaran lengkap.
