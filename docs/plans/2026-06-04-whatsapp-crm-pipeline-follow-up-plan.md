# Rencana Implementasi WhatsApp CRM Pipeline + Follow-up

Tanggal: 2026-06-04  
Status: Draft rencana implementasi bertahap  
Owner: CeritaKita Booking  
Scope: WhatsApp Workspace, CRM label pipeline, follow-up reminder, dan fondasi auto follow-up.

---

## 1. Ringkasan Keputusan

WhatsApp sudah mulai menjadi sumber data CRM utama CeritaKita. Setelah integrasi chat → booking/transaksi, langkah berikutnya adalah membuat **pipeline follow-up berbasis conversation**.

Rekomendasi utama: **jangan langsung auto-send follow-up**. Mulai dari sistem label + reminder yang bisa dikontrol admin.

Urutan aman:

```text
DB + Manual Label
  → Dashboard Follow-up Reminder
  → Auto-suggest Label
  → Scheduler Reminder
  → Limited Auto-send
```

Kenapa bertahap:

1. Risiko spam customer lebih rendah.
2. Admin bisa koreksi label yang salah.
3. Data pipeline lebih bersih sebelum automation.
4. WATI send API/session window masih perlu dipastikan stabil.
5. Mudah rollback karena tahap awal hanya metadata + dashboard.

---

## 2. Tujuan Produk

### 2.1 Tujuan utama

- Setiap WhatsApp conversation punya status pipeline CRM.
- Admin tahu conversation mana yang perlu follow-up hari ini.
- Follow-up message bisa disiapkan otomatis berdasarkan label.
- Admin bisa override label dan jadwal follow-up secara manual.
- Sistem punya fondasi untuk auto-send follow-up di fase berikutnya.

### 2.2 Tujuan bisnis

- Mengurangi leads yang lupa di-follow-up.
- Meningkatkan conversion chat → booking.
- Menjaga customer yang sudah selesai sesi agar kembali repeat order.
- Membantu CS/owner memprioritaskan chat yang bernilai tinggi.
- Membuat pipeline WhatsApp lebih terukur.

### 2.3 Non-goals tahap awal

- Bukan langsung mengganti CS dengan AI.
- Bukan blast marketing massal.
- Bukan auto-send ke semua customer tanpa kontrol.
- Bukan membuat scoring CRM kompleks dari awal.

---

## 3. Pipeline Label yang Diusulkan

Blueprint awal user:

```text
Leads → Warm → Booking → Testimoni
```

Rekomendasi versi MVP yang sedikit lebih lengkap:

| Label | Makna | Trigger umum | Default follow-up |
|---|---|---|---|
| `leads` | Baru chat, belum jelas intent | Chat pertama / sapaan umum | +1 hari |
| `warm` | Sudah tanya harga/detail/paket | Keyword harga, paket, detail, promo | +3 hari |
| `booking` | Sudah booking / conversation tertaut booking aktif | booking linked / keyword booking + tanggal | Sesuai jadwal booking |
| `completed` | Sesi sudah selesai, belum masuk testimoni/repeat | Booking completed / H+1 sesi | H+1 setelah sesi |
| `testimoni` | Sudah review / kandidat repeat order | Review/testimoni selesai | +30 hari |
| `cold` | Tidak lanjut / tidak respons setelah beberapa FU | FU count tinggi, tidak ada balasan | Stop / manual review |

Catatan:

- Kalau ingin tetap sederhana, fase awal boleh hanya menampilkan: `leads`, `warm`, `booking`, `testimoni`.
- Namun secara data, `completed` dan `cold` sebaiknya disiapkan agar lifecycle tidak rancu.

---

## 4. Model Data

### 4.1 Kolom baru di `whatsapp_conversations`

Rekomendasi kolom MVP:

```sql
ALTER TABLE whatsapp_conversations ADD COLUMN crm_label TEXT DEFAULT 'leads';
ALTER TABLE whatsapp_conversations ADD COLUMN next_fu_at TEXT;
ALTER TABLE whatsapp_conversations ADD COLUMN fu_note TEXT;
ALTER TABLE whatsapp_conversations ADD COLUMN fu_template_key TEXT;
ALTER TABLE whatsapp_conversations ADD COLUMN last_fu_at TEXT;
ALTER TABLE whatsapp_conversations ADD COLUMN fu_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE whatsapp_conversations ADD COLUMN label_source TEXT DEFAULT 'system';
ALTER TABLE whatsapp_conversations ADD COLUMN label_updated_at TEXT;
```

### 4.2 Field explanation

| Field | Type | Fungsi |
|---|---|---|
| `crm_label` | text | Label pipeline conversation. |
| `next_fu_at` | datetime/text ISO | Jadwal follow-up berikutnya. |
| `fu_note` | text | Pesan follow-up hasil generate/template. |
| `fu_template_key` | text | Key template yang dipakai, contoh `warm_3d`. |
| `last_fu_at` | datetime/text ISO | Terakhir follow-up dikirim/disalin/dimark. |
| `fu_count` | integer | Jumlah follow-up yang sudah dilakukan. |
| `label_source` | text | `system`, `admin`, `booking_link`, `scheduler`. |
| `label_updated_at` | datetime/text ISO | Audit ringan kapan label berubah. |

### 4.3 Constraint aplikasi

Karena SQLite existing di repo banyak memakai schema bootstrap di `lib/db.ts`, tahap awal bisa pakai pendekatan additive migration/idempotent:

- cek kolom sudah ada atau belum;
- tambah kolom jika belum ada;
- jangan drop/rename kolom existing;
- default aman: `crm_label = 'leads'`;
- `next_fu_at` nullable agar tidak semua conversation langsung masuk queue.

### 4.4 Index yang disarankan

```sql
CREATE INDEX IF NOT EXISTS idx_wa_conv_crm_label ON whatsapp_conversations(crm_label);
CREATE INDEX IF NOT EXISTS idx_wa_conv_next_fu_at ON whatsapp_conversations(next_fu_at);
CREATE INDEX IF NOT EXISTS idx_wa_conv_label_fu ON whatsapp_conversations(crm_label, next_fu_at);
```

---

## 5. Follow-up Template Rules

### 5.1 Default template

| Label | Template key | Schedule | Pesan awal |
|---|---|---|---|
| `leads` | `leads_1d` | +1 hari | Halo kak, ada yang bisa CeritaKita bantu? |
| `warm` | `warm_3d` | +3 hari | Halo kak, masih tertarik untuk sesi foto di CeritaKita? Kalau ada yang ingin ditanyakan, kami bantu ya. |
| `booking` | `booking_post_session_1d` | H+1 setelah sesi | Terima kasih sudah foto bareng CeritaKita, kak. Semoga suka dengan experience-nya ya. |
| `completed` | `review_request_1d` | H+1 setelah completed | Kalau berkenan, boleh bantu share review/testimoni singkat ya kak. |
| `testimoni` | `repeat_30d` | +30 hari | Halo kak, kapan-kapan mau foto lagi di CeritaKita? Kami siap bantu kalau mau booking sesi berikutnya. |

### 5.2 Anti-spam policy

MVP guardrail:

- Jangan schedule follow-up jika conversation status `resolved`/`archived` dan label bukan `testimoni`/`completed`.
- Jangan follow-up lebih dari 2x untuk label `leads` tanpa balasan baru.
- Jangan follow-up lebih dari 3x untuk label `warm` tanpa balasan baru.
- Set `cold` jika `fu_count` melewati batas dan tidak ada inbound baru.
- Jangan auto-send jika `fu_note` kosong.
- Jangan auto-send jika customer baru membalas setelah schedule dibuat; reschedule ulang.

---

## 6. Auto-labelling Logic

### 6.1 Prinsip

Auto-labelling tahap awal harus bersifat **suggestion atau low-risk update**, bukan AI penuh.

Aturan penting:

- Jangan override label manual admin (`label_source = 'admin'`) kecuali ada event kuat seperti booking linked.
- Booking linked boleh menaikkan label ke `booking`.
- Keyword hanya boleh menaikkan label dari `leads` ke `warm`, bukan downgrade.
- Semua update label sebaiknya punya timestamp dan source.

### 6.2 Keyword matching MVP

| Intent | Keyword contoh | Label target | Schedule |
|---|---|---|---|
| Tanya harga/detail | `harga`, `paket`, `berapa`, `detail`, `promo`, `include` | `warm` | +3 hari |
| Booking intent | `booking`, `jadwal`, `tanggal`, `slot`, `jam`, `dp`, `transfer` | `booking` atau `warm` jika belum ada booking linked | Manual review / setelah linked |
| Payment related | `transfer`, `dp`, `lunas`, `bayar`, `invoice` | Keep `booking`, add note payment | Tidak auto-FU sales |
| Komplain/reschedule | `reschedule`, `ubah jadwal`, `cancel`, `komplain`, `refund` | Jangan auto-FU | Escalate manual |
| Testimoni/review | `review`, `testimoni`, `makasih`, `terima kasih`, `puas` | `testimoni` candidate | +30 hari |

### 6.3 Pseudocode

```ts
function classifyConversationMessage(text, currentConversation) {
  if (currentConversation.label_source === 'admin') {
    return null; // do not override manual label
  }

  const normalized = text.toLowerCase();

  if (hasComplaintOrRescheduleKeyword(normalized)) {
    return {
      crm_label: currentConversation.crm_label,
      next_fu_at: null,
      fu_note: null,
      reason: 'manual_attention_required'
    };
  }

  if (hasPriceKeyword(normalized) && currentConversation.crm_label === 'leads') {
    return {
      crm_label: 'warm',
      next_fu_at: addDays(now, 3),
      fu_template_key: 'warm_3d'
    };
  }

  if (isNewLead(currentConversation)) {
    return {
      crm_label: 'leads',
      next_fu_at: addDays(now, 1),
      fu_template_key: 'leads_1d'
    };
  }

  return null;
}
```

---

## 7. Scheduler / Follow-up Reminder

### 7.1 MVP behavior

Tahap awal scheduler tidak langsung kirim WhatsApp. Scheduler hanya membuat daftar:

```text
Follow-up Hari Ini
- Elisabet · Warm · due 09:00 · Copy/Kirim reminder
- Budi · Leads · overdue 1 hari · Copy/Kirim reminder
```

Query dasar:

```sql
SELECT *
FROM whatsapp_conversations
WHERE next_fu_at <= CURRENT_TIMESTAMP
  AND crm_label IN ('leads', 'warm', 'completed', 'testimoni')
  AND status IN ('open', 'pending_human', 'resolved')
ORDER BY next_fu_at ASC;
```

### 7.2 Endpoint yang disarankan

```http
GET /api/admin/whatsapp/follow-ups?status=due&label=all
PATCH /api/admin/whatsapp/conversations/[id]/crm
POST /api/admin/whatsapp/conversations/[id]/follow-up/mark-sent
```

### 7.3 Mark sent behavior

Saat admin klik `Mark Sent` atau sukses kirim via WATI:

- set `last_fu_at = now()`;
- increment `fu_count`;
- clear atau reschedule `next_fu_at` sesuai label;
- append outgoing message jika memang dikirim via WATI;
- log audit ringan.

---

## 8. Dashboard UX

### 8.1 Conversation list

Tambahkan badge kecil:

```text
Elisabet
628xxx · Warm · FU hari ini
```

Badge warna:

| Label | Warna |
|---|---|
| `leads` | Slate/Blue |
| `warm` | Amber/Orange |
| `booking` | Blue |
| `completed` | Emerald |
| `testimoni` | Purple |
| `cold` | Slate muted |

### 8.2 Right panel Customer 360

Tambahkan section CRM:

```text
CRM Pipeline
Label: Warm [ubah]
Next FU: 7 Jun 2026 09:00
Template: warm_3d
Pesan:
"Halo kak, masih tertarik..."
[Copy FU] [Mark Sent] [Reschedule]
```

### 8.3 Follow-up dashboard section

Di WhatsApp Workspace bisa tambah filter/card:

- `Due Today`
- `Overdue`
- `Warm Leads`
- `Booking Follow-up`
- `Repeat/Testimoni`

MVP cukup filter di list:

```text
Semua | Buka | Perlu CS | Follow-up Hari Ini
```

---

## 9. API Design MVP

### 9.1 Update CRM metadata

```http
PATCH /api/admin/whatsapp/conversations/[id]/crm
Content-Type: application/json
```

Body:

```json
{
  "crmLabel": "warm",
  "nextFuAt": "2026-06-07T02:00:00.000Z",
  "fuNote": "Halo kak, masih tertarik untuk sesi foto di CeritaKita?",
  "fuTemplateKey": "warm_3d"
}
```

Rules:

- permission: admin atau `whatsapp`;
- validate enum label;
- allow `nextFuAt: null` untuk clear reminder;
- set `label_source = 'admin'` jika update dari UI manual.

### 9.2 List due follow-ups

```http
GET /api/admin/whatsapp/follow-ups?label=warm&limit=50
```

Response:

```json
{
  "items": [
    {
      "conversationId": "...",
      "displayName": "Elisabet",
      "phoneNumber": "628...",
      "crmLabel": "warm",
      "nextFuAt": "2026-06-07T02:00:00.000Z",
      "fuNote": "Halo kak...",
      "bookingId": "...",
      "lastMessageAt": "..."
    }
  ]
}
```

### 9.3 Mark follow-up sent

```http
POST /api/admin/whatsapp/conversations/[id]/follow-up/mark-sent
```

Body:

```json
{
  "mode": "copied" | "sent_wati" | "manual",
  "note": "optional"
}
```

---

## 10. Implementation Phases

## Phase 1 — Data Foundation + Manual CRM Label

Effort: ± 1 hari  
Risk: rendah  
Impact: medium-high

Scope:

1. Tambah kolom CRM follow-up di DB bootstrap/migration.
2. Tambah helper repository:
   - `updateConversationCrm`;
   - `getDueFollowUps`;
   - `markFollowUpSent`.
3. Tambah endpoint PATCH CRM metadata.
4. Tampilkan label di WhatsApp Workspace.
5. Admin bisa ubah label dan jadwal follow-up manual.

Acceptance criteria:

- Existing conversation tetap aman.
- Admin bisa set label `leads/warm/booking/completed/testimoni/cold`.
- `next_fu_at` tersimpan dan tampil di UI.
- Tidak ada auto-send.

---

## Phase 2 — Follow-up Reminder Dashboard

Effort: ± 1–2 hari  
Risk: rendah-medium  
Impact: tinggi

Scope:

1. Endpoint list due follow-ups.
2. Filter/tab `Follow-up Hari Ini` di WhatsApp Workspace.
3. Card FU dengan `Copy FU` dan `Mark Sent`.
4. Counter due/overdue.
5. Increment `fu_count` saat mark sent.

Acceptance criteria:

- Admin bisa melihat siapa yang harus di-follow-up hari ini.
- Admin bisa copy template dengan 1 klik.
- Admin bisa mark sent agar tidak muncul terus.

---

## Phase 3 — Auto-suggest Label via Keyword

Effort: ± 1–2 hari  
Risk: medium  
Impact: medium-high

Scope:

1. Keyword classifier sederhana saat message incoming masuk.
2. Jangan override label manual admin.
3. Set `crm_label`, `next_fu_at`, `fu_template_key`, `fu_note` otomatis untuk label low-risk.
4. Tambah badge `suggested by system` jika perlu.

Acceptance criteria:

- Chat tanya harga otomatis jadi `warm` jika belum manual label.
- Chat baru bisa dapat `leads + next_fu_at +1 hari`.
- Komplain/reschedule tidak dijadwalkan sales FU otomatis.

---

## Phase 4 — Scheduler Cron 09:00

Effort: ± 1 hari  
Risk: medium  
Impact: medium

Scope:

1. Cron/job harian jam 09:00 Asia/Jakarta.
2. Generate/refresh due follow-up list.
3. Optional: kirim notifikasi dashboard/Telegram internal, bukan customer.
4. Jangan auto-send ke WhatsApp dulu.

Acceptance criteria:

- Jam 09:00 sistem punya daftar FU hari ini.
- Owner/CS mendapat reminder internal.
- Tidak ada pesan customer terkirim otomatis.

---

## Phase 5 — Limited Auto-send

Effort: ± 3–5 hari setelah WATI send stabil  
Risk: medium-high  
Impact: tinggi

Scope:

1. Auto-send hanya untuk label low-risk (`leads`, `warm`) dan opt-in aman.
2. Rate limit per hari.
3. Stop jika ada inbound baru.
4. Audit log semua auto-send.
5. Human handover untuk komplain/reschedule/payment.

Acceptance criteria:

- Auto-send tidak melebihi batas harian.
- Tidak mengirim ke customer yang baru membalas.
- Semua auto-send tercatat.
- Bisa dimatikan via config/env.

---

## 11. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Salah label otomatis | Follow-up tidak relevan | Manual override, jangan override admin label. |
| Customer merasa di-spam | Trust turun | Batasi FU count, mulai copy/manual, bukan auto-send. |
| WATI send gagal/session expired | FU tidak terkirim | Tahap awal dashboard reminder/copy dulu. |
| Timezone salah | FU muncul di waktu salah | Simpan UTC, tampilkan Asia/Jakarta. |
| Conversation booking sudah selesai tapi label masih warm | FU sales tidak tepat | Event booking linked/completed harus update label. |
| Data lama tidak punya label | Query tidak konsisten | Backfill default `leads` atau nullable dengan fallback UI. |

---

## 12. Migration & Rollback Plan

### 12.1 Migration safety

- Tambah kolom nullable/default saja.
- Tidak menghapus data existing.
- Tidak mengubah struktur message ingestion utama.
- Buat index additive.

### 12.2 Rollback

Jika UI/logic bermasalah:

1. Matikan auto-labelling logic.
2. Sembunyikan CRM panel/filter dari UI.
3. Biarkan kolom DB tetap ada, karena additive dan tidak mengganggu flow lama.
4. Jangan drop kolom di production kecuali sudah backup dan ada kebutuhan jelas.

---

## 13. Definition of Done MVP

MVP dianggap selesai jika:

- Conversation punya label CRM yang tampil di dashboard.
- Admin bisa edit label dan jadwal follow-up manual.
- Dashboard bisa menampilkan follow-up yang due hari ini/overdue.
- Admin bisa copy follow-up message.
- Admin bisa mark follow-up sent.
- Tidak ada auto-send customer tanpa approval.
- Lint/build sukses.

---

## 14. Next Action yang Direkomendasikan

1. Implement Phase 1 dulu: DB columns + manual label UI/API.
2. Setelah itu Phase 2: follow-up due dashboard.
3. Baru Phase 3: auto-suggest label berbasis keyword.
4. Scheduler dan auto-send dikerjakan setelah reminder manual terbukti berguna.
