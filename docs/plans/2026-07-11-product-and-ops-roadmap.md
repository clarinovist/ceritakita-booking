# CeritaKita Studio — Product & Ops Roadmap

Tanggal: 2026-07-11  
Status: **Active — single source of truth**  
Owner: CeritaKita Booking  
Scope: Prioritas setelah backend architecture cleanup selesai

Dokumen ini menggantikan rencana produk/ops terpisah yang lama (automation, WhatsApp multi-plan, CRM drafts, dll.).  
Rincian arsitektur yang **sudah selesai**: `docs/plans/2026-07-11-backend-architecture-cleanup.md`.

---

## Prinsip

1. **Fondasi backend sudah cukup** — jangan buka refactor arsitektur/frontend besar tanpa pain operasional yang jelas.
2. Prioritas = **production sehat** → **tutup loop bisnis** (lead → chat → booking → bayar) → growth yang terukur.
3. Otomasi customer-facing: **Alert → Assisted → Full auto** (jangan loncat ke full auto).
4. AI CS: **draft-only** di production sampai metrik bagus; auto-send default off.

Filter sprint:

```text
Apakah ini mengurangi lead bocor / mempercepat CS / memperjelas cashflow?
  → YA: kerjakan
  → TIDAK (cuma rapihin file): park
```

---

## 0. Segera — production sehat (setelah deploy)

Dilakukan setiap deploy besar (termasuk setelah push arsitektur + CI backup/health).

| Cek | Kenapa |
|-----|--------|
| GitHub Actions **build + deploy** hijau | Image & VPS benar-benar update |
| `GET /api/health` → `status: healthy` | App + DB writable (UID 1001) |
| `schema_migrations` = version `1` di VPS | Engine migrasi jalan |
| Ada file di `data/backups/` di VPS | Pre-deploy backup CI jalan |
| Smoke: login admin, booking, leads, WA, finance report | Zero behavior change di production |

**Kalau ini aman:** berhenti urusan arsitektur besar. Jangan langsung pecah god-component admin.

### Perintah verifikasi (VPS)

```bash
cd "$DEPLOY_PATH"   # path deploy production
docker compose ps
curl -sS http://127.0.0.1:3001/api/health
sqlite3 data/bookings.db "SELECT * FROM schema_migrations;"
ls -lt data/backups/ | head
docker compose logs --tail=80 app
```

---

## 1. Next worth it — close the revenue loop

### Konteks data (indikatif, dev DB)

| Sinyal | Angka approx. | Implikasi |
|--------|----------------|-----------|
| Lead status Follow Up | ~659 | Banyak yang “nanggung” — risiko bocor tinggi |
| Lead Converted | ~82 | Conversion ada, tapi ratio vs Follow Up lemah |
| Bookings (Completed/dll.) | ~94 | Volume operasional masih single-studio |
| WhatsApp messages | ~211 | Chat sudah jadi kanal, belum fully di-loop ke revenue |

**Gap terbesar = follow-up & konversi, bukan layering kode.**

---

### A. Operasional sales / CRM — ROI tertinggi

| # | Inisiatif | Level otomasi | Outcome |
|---|-----------|---------------|---------|
| A1 | **Digest harian**: lead overdue + booking belum lunas (Telegram/email; fondasi `telegram-report` + `report-generator` sudah ada) | L1 Alert | CS/owner buka hari dengan daftar prioritas |
| A2 | **Follow-up assisted**: shortlist + draft/template WA, CS approve lalu kirim | L2 Assisted | FU lebih cepat tanpa spam otomatis |
| A3 | **Lead scoring / prioritas** (source Meta, urgency tanggal, responsivitas, interaksi) | L2 | Kejar lead bernilai dulu |
| A4 | **Pipeline booking operasional** (jika status Active/Completed terlalu kasar): mis. DP → Confirmed → Shoot done → Delivered → Lunas | Product | Tracking uang & delivery lebih jujur |

**Acceptance A1 (minimum sprint):**

- [ ] Job/endpoint harian mengirim daftar lead yang perlu FU (nama, status, source, hari terlambat)
- [ ] Daftar booking outstanding balance (sisa bayar > 0, status aktif)
- [ ] Channel: Telegram (prefer) dan/atau email — reuse secret cron yang ada

**Non-goals A:** full auto-blast lead; ganti CS dengan bot.

---

### B. WhatsApp sebagai pusat CS

Provider aktual: **Watzap** (bukan WATI). AI draft + guardrails sudah di `whatsapp-ai-service`.

| # | Inisiatif | Outcome |
|---|-----------|---------|
| B1 | **Customer 360** di thread (booking, sisa bayar, jadwal, next FU, Drive link) — perkuat yang sudah ada | CS tidak bolak-balik modul |
| B2 | **Suggested link** chat ↔ booking (manual confirm; bukan auto-link dulu) | Kurangi salah taut, siapkan auto later |
| B3 | AI **draft-only** di production; `AI_CS_AUTO_SEND_ENABLED=false` | Cepat balas tanpa risiko brand |
| B4 | **Metrik AI/CS**: first-response time, % draft dikirim tanpa edit, chat → booking | Putuskan kapan naik ke limited auto-reply |

**Acceptance B3–B4:**

- [ ] Auto-send tetap off di production
- [ ] Admin bisa generate draft + kirim manual dari workspace
- [ ] Event/audit AI tetap tercatat (`whatsapp_ai_*`)

**Non-goals B:** auto-reply semua chat; auto refund/cancel/reschedule; blast promo massal.

Urutan aman (jangka menengah):

```text
Customer 360 + manual/suggested link
  → Digest FU + assisted templates
  → AI draft quality loop (feedback CS)
  → Limited auto-reply FAQ only (setelah metrik OK)
```

---

### C. Growth — jaga + ukur (bukan volume artikel buta)

| # | Inisiatif | Outcome |
|---|-----------|---------|
| C1 | **Attribution**: ads spend → WA click → lead → booking → revenue (ROAS jujur) | Budget Meta berbasis data |
| C2 | **SEO blog lokal**: refresh seasonal; ukur traffic → lead/booking, jangan hanya tambah post | Konten yang convert |
| C3 | **Landing intent** (wisuda / self-photo / prewedding) selaras creative Meta | Kurangi bounce & mismatch pesan/harga |

**Acceptance C1 (minimum):**

- [ ] Dashboard atau report bisa menjawab: “minggu ini spend X, booking berapa, revenue berapa”
- [ ] WA click bot-filtered (sudah ada arah di analytics)

**Non-goals C:** scale multi-kota agresif sebelum funnel FU rapi; redesign brand besar.

---

## 2. Sprint suggestion (2 minggu)

| Minggu | Fokus | Deliverable |
|--------|--------|-------------|
| **1** | Stabilisasi production + **A1 digest harian** | Health/backup OK; Telegram/email digest lead overdue + outstanding payment |
| **2** | **A2 + B1/B2 tipis** | Shortlist FU + template/draft WA; perkuat ringkasan booking di WA workspace |

Setelah 2 sprint: evaluasi conversion lead→booking dan response time sebelum AI auto atau scoring kompleks (A3).

---

## 3. Teknis lanjutan (park — bukan prioritas produk)

Kerjakan hanya saat fitur di atas menabrak utang teknis, atau sela tipis.

| Item | Kapan |
|------|--------|
| Split `lib/repositories/whatsapp.ts` (SQL / outbox / provider) | Sebelum fitur WA besar lagi |
| Admin frontend: pecah WhatsAppWorkspace, lazy `viewMode`, kurangi eager fetch | Saat UI CS susah diubah |
| `requirePermission` di API sensitif | Multi-staff / role penting |
| Migration v2+ bersih (tanpa try/catch di baseline) | Schema change berikutnya |
| Hapus skeleton shim `lib/*.ts` deprecated | Hygiene kapan saja |
| Multi-tenant / Postgres / SaaS | Hanya jika jualan ke studio lain |

---

## 4. Level otomasi (referensi)

| Level | Contoh | Risiko |
|-------|--------|--------|
| **L1 Alert** | Digest lead overdue, booking belum lunas, health | Rendah |
| **L2 Assisted** | Shortlist + draft WA, CS approve-kirim | Sedang-rendah |
| **L3 Full auto** | Auto FU, limited FAQ auto-reply | Tinggi — butuh guardrail + metrik |

Customer-facing: **L1 → L2 dulu**. L3 hanya untuk intent aman + confidence tinggi.

---

## 5. Area kode relevan (entrypoint)

| Area | Path utama |
|------|------------|
| Telegram report / cron | `.github/workflows/telegram-report.yml`, `app/api/telegram/send-report/route.ts`, `lib/report-generator.ts` |
| Leads CRM | `app/api/leads/*`, `lib/repositories/leads.ts`, `components/admin/crm/*` |
| WhatsApp | `components/admin/whatsapp/*`, `lib/repositories/whatsapp.ts`, `lib/services/whatsapp-ai-service.ts` |
| Booking / finance | `lib/services/booking-service.ts`, `lib/services/finance-service.ts` |
| Ads / WA click | `lib/repositories/analytics.ts`, `app/api/meta/*`, `app/api/wa/*` |
| Deploy / health | `.github/workflows/build.yml`, `app/api/health/route.ts` |

---

## 6. Explicitly not now

- Rewrite stack / ganti Next.js  
- Postgres “karena lebih enterprise” tanpa multi-tenant  
- Full AI auto-reply  
- SaaS multi-studio  
- God-component polish tanpa pain user yang jelas  

---

## 7. Dokumen terkait

| Dokumen | Peran |
|---------|--------|
| `docs/plans/2026-07-11-backend-architecture-cleanup.md` | Arsitektur backend — **Completed** (arsip implementasi) |
| `docs/reports/2026-06-05-whatsapp-brain-ai-reply-assessment.md` | Assessment AI (historis) — opsional baca |

Plan produk/ops lama (automation, multi WhatsApp drafts, CRM implementation, WATI blueprint, dll.) **dihapus** — isinya digabung ke file ini.

---

## 8. Checklist status (update saat jalan)

### Phase 0 — Production
- [x] Deploy post-architecture verified (health, migrations, backups, smoke)

### Phase 1 — Close loop (CRM ops)
- [x] A1 Daily digest lead overdue + outstanding payment
- [x] A2 Assisted follow-up shortlist + WA draft/template
- [x] A3 Lead scoring (optional after A1–A2)
- [ ] A4 Booking pipeline refinement (parked — current 4-status system sufficient for small studio)

### Phase 2 — WhatsApp CS
- [ ] B1 Customer 360 lengkap di thread
- [ ] B2 Suggested booking link
- [ ] B3 AI draft-only stabil di prod
- [ ] B4 Metrik response / draft / conversion

### Phase 3 — Growth measurement
- [ ] C1 Attribution ROAS end-to-end
- [ ] C2 SEO konten terukur conversion
- [ ] C3 Landing ↔ ads message match
