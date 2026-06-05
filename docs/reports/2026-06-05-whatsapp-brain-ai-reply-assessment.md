# Assessment Report — WhatsApp Brain & AI Reply

Tanggal assessment: 2026-06-05  
Repo: `ceritakita-booking`  
Tujuan: review final sebelum commit/push agar CI/CD berjalan dengan scope yang jelas dan risiko diketahui.

---

## 1. Executive Summary

Implementasi **WhatsApp Brain & AI Reply** sudah masuk ke workspace dan sudah diverifikasi lokal.

Kesimpulan assessment: **ship with caveats**.

Alasan:

- Build production Next.js berhasil.
- ESLint bersih.
- Test lokal untuk context builder, fallback AI, insight persistence, draft persistence, dan AI event audit berhasil.
- Auto-send AI **belum aktif** dan tetap aman secara default melalui `AI_CS_AUTO_SEND_ENABLED=false`.
- Endpoint AI hanya bisa diakses admin/user dengan permission WhatsApp.
- Risiko utama yang tersisa adalah validasi live provider AI OpenAI/Gemini belum terbukti karena test lokal jatuh ke fallback deterministik.

Rekomendasi: boleh commit/push untuk menjalankan CI/CD, dengan catatan jangan aktifkan auto-send di production sampai live provider test dan review UI dilakukan.

---

## 2. Scope Perubahan

### 2.1 Fitur utama

| Area | Perubahan |
|---|---|
| AI config | Tambah env AI CS Brain di `.env.local.example`. |
| Database | Tambah tabel `whatsapp_conversation_insights`, `whatsapp_ai_drafts`, `whatsapp_ai_events`. |
| Repository | Tambah helper insight, draft, AI event audit, dan `buildWhatsAppCustomerContext()`. |
| AI service | Tambah wrapper AI provider OpenAI/Gemini + deterministic fallback. |
| API | Tambah endpoint insight, draft, send draft, reject draft. |
| UI | Tambah AI Customer Context Card dan AI Suggestion Draft Box di WhatsApp Workspace. |
| Verification | Tambah script `scripts/test-ai-brain.ts`. |
| Planning doc | Tambah dokumen rencana detail WhatsApp Brain + AI Reply. |

### 2.2 File berubah / baru

Tracked modified:

- `.env.local.example`
- `components/admin/whatsapp/WhatsAppWorkspace.tsx`
- `lib/db.ts`
- `lib/repositories/whatsapp.ts`

Untracked new files yang perlu ikut commit:

- `app/api/admin/whatsapp/conversations/[id]/ai/insight/route.ts`
- `app/api/admin/whatsapp/conversations/[id]/ai/draft/route.ts`
- `app/api/admin/whatsapp/conversations/[id]/ai/drafts/[draftId]/send/route.ts`
- `app/api/admin/whatsapp/conversations/[id]/ai/drafts/[draftId]/reject/route.ts`
- `lib/services/whatsapp-ai-service.ts`
- `scripts/test-ai-brain.ts`
- `docs/plans/2026-06-05-whatsapp-brain-ai-reply-plan.md`
- `docs/reports/2026-06-05-whatsapp-brain-ai-reply-assessment.md`

---

## 3. Detail Implementasi

### 3.1 Environment config

File: `.env.local.example`

Config baru:

```env
AI_CS_ENABLED=false
AI_CS_PROVIDER=openai
AI_CS_MODEL=gpt-4o-mini
AI_CS_INSIGHT_ENABLED=true
AI_CS_DRAFT_ENABLED=true
AI_CS_AUTO_SEND_ENABLED=false
AI_CS_MAX_CONTEXT_MESSAGES=30
AI_CS_TEMPERATURE=0.2
AI_CS_CONFIDENCE_AUTO_SEND_THRESHOLD=0.85
AI_CS_ALLOWED_AUTO_INTENTS=greeting,location_question,business_hours,basic_booking_steps
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Assessment:

- Aman karena `AI_CS_ENABLED=false` di example.
- Auto-send default false.
- Provider/model bisa diganti via env.
- Insight/draft bisa dikontrol terpisah.

Catatan lokal:

- `.env.local` lokal terdeteksi `AI_CS_ENABLED=true`, provider `openai`, model `gpt-4o-mini`, dan `AI_CS_AUTO_SEND_ENABLED=false`.
- Secrets tidak ditampilkan dalam report ini.

---

## 4. Database Assessment

File: `lib/db.ts`

Tabel baru:

1. `whatsapp_conversation_insights`
2. `whatsapp_ai_drafts`
3. `whatsapp_ai_events`

Index baru:

- `idx_wa_insights_conv`
- `idx_wa_drafts_conv`
- `idx_wa_events_conv`

Assessment data risk:

| Area | Status | Catatan |
|---|---:|---|
| Migration destructive | Aman | Hanya `CREATE TABLE IF NOT EXISTS` dan `CREATE INDEX IF NOT EXISTS`. |
| Existing data | Aman | Tidak mengubah bookings/payments/messages existing. |
| Foreign key | Baik | Semua tabel baru refer ke `whatsapp_conversations`. |
| Rollback | Mudah | Bisa drop 3 tabel baru jika perlu rollback fitur AI. |
| PII audit | Caveat | `input_snapshot`/`output_snapshot` bisa menyimpan ringkasan/draft percakapan customer. Ini internal audit, tapi tetap perlu privacy awareness. |

Rollback SQL jika emergency:

```sql
DROP TABLE IF EXISTS whatsapp_ai_events;
DROP TABLE IF EXISTS whatsapp_ai_drafts;
DROP TABLE IF EXISTS whatsapp_conversation_insights;
```

---

## 5. Backend / Repository Assessment

File: `lib/repositories/whatsapp.ts`

Helper baru:

- `saveConversationInsight()`
- `getLatestConversationInsight()`
- `saveAIDraft()`
- `updateAIDraftStatus()`
- `getAIDraftById()`
- `logAIEvent()`
- `buildWhatsAppCustomerContext()`

Assessment:

| Area | Status | Catatan |
|---|---:|---|
| Context builder | Baik | Mengambil conversation, contact, last N messages, booking by phone, payment summary. |
| Source message audit | Baik | Message context sudah include `id`. |
| Phone matching | Baik dengan caveat | Sudah dicegah match nomor terlalu pendek `<8 digit`. |
| Query performance | Caveat | `buildWhatsAppCustomerContext()` load semua bookings lalu filter di memory. Aman untuk skala sekarang, tapi perlu optimasi kalau bookings makin besar. |
| Draft persistence | Baik | Draft tersimpan sebelum dipakai CS. |
| Audit trail | Baik | AI classify/draft/approve/reject dicatat. |

---

## 6. AI Service Assessment

File: `lib/services/whatsapp-ai-service.ts`

Komponen:

- Zod schema untuk output AI.
- Toggle:
  - `isAIEnabled()`
  - `isAIInsightEnabled()`
  - `isAIDraftEnabled()`
- Deterministic fallback classifier.
- OpenAI/Gemini completion wrapper.
- Guardrail prompt untuk harga, jadwal, pembayaran, refund, cancel, reschedule, komplain.

Assessment:

| Area | Status | Catatan |
|---|---:|---|
| Output validation | Baik | Zod memastikan JSON sesuai schema. |
| AI disabled fallback | Baik | Jika AI off/key missing/error, pakai deterministic fallback. |
| Sensitive intent fallback | Baik | Payment/complaint/reschedule/cancel diarahkan `needs_human=true`. |
| Hallucination guardrail | Baik secara prompt | AI dilarang mengarang harga/jadwal/payment. |
| Live provider validation | Caveat | Test lokal belum membuktikan live OpenAI/Gemini karena jatuh ke fallback. |
| Gemini path | Caveat | Belum dites live. |

Catatan: `AI_CS_CONFIDENCE_AUTO_SEND_THRESHOLD` dan `AI_CS_ALLOWED_AUTO_INTENTS` sudah ada di env, namun auto-send belum diimplementasikan. Saat ini `canAutoSend` hanya informasi di draft response.

---

## 7. API Assessment

Endpoint baru:

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/admin/whatsapp/conversations/[id]/ai/insight` | GET | Ambil insight terbaru. |
| `/api/admin/whatsapp/conversations/[id]/ai/insight` | POST | Generate/refresh insight. |
| `/api/admin/whatsapp/conversations/[id]/ai/draft` | POST | Generate draft balasan AI. |
| `/api/admin/whatsapp/conversations/[id]/ai/drafts/[draftId]/send` | POST | CS approve/edit lalu kirim draft via outbox. |
| `/api/admin/whatsapp/conversations/[id]/ai/drafts/[draftId]/reject` | POST | Tolak draft dan log alasan. |

Assessment security:

| Area | Status | Catatan |
|---|---:|---|
| Auth required | Baik | Semua endpoint memakai `getServerSession`. |
| Permission | Baik | Admin atau permission `whatsapp`. |
| Draft conversation match | Baik | Send/reject cek `draft.conversation_id === conversationId`. |
| Auto-send | Aman | Tidak ada endpoint auto-send AI langsung. Send tetap aksi CS. |
| Text validation | Baik | Send draft wajib non-empty text. |

Caveat:

- Endpoint send draft mengirim final text yang disetujui CS walaupun draft risk high. Ini acceptable karena route ini adalah human approval path, bukan auto-send.

---

## 8. UI Assessment

File: `components/admin/whatsapp/WhatsAppWorkspace.tsx`

UI baru:

- AI Customer Context Card di right panel.
- Tombol refresh insight.
- AI Suggestion Draft Box di composer.
- Tombol generate draft, salin ke input CS, regenerasi, tolak.
- Risk badge, intent badge, urgency badge, human escalation notice.

Assessment:

| Area | Status | Catatan |
|---|---:|---|
| Human-in-the-loop | Baik | Draft hanya disalin ke composer, CS tetap kirim manual. |
| UX discoverability | Baik | Tombol AI terlihat di composer dan context card. |
| Safety display | Baik | Risk/needs human ditampilkan. |
| Error handling | Cukup | Toast untuk gagal generate/refresh. |
| Type strictness | Caveat | `aiInsight`/`aiDraft` masih `any`. Build/lint aman, tapi type bisa diperketat nanti. |

---

## 9. Verification Results

### 9.1 Commands run

```bash
npm run lint
npx tsx scripts/test-ai-brain.ts
npm run build
```

### 9.2 Results

| Verification | Result | Notes |
|---|---:|---|
| ESLint | Passed | `✔ No ESLint warnings or errors` |
| AI brain script | Passed | Context builder, fallback completion, DB helper, draft/event persistence passed. |
| Production build | Passed | Next.js build compiled, type/lint checks passed, routes generated. |

### 9.3 Test caveat

`npx tsx scripts/test-ai-brain.ts` berhasil, tetapi AI completion menggunakan deterministic fallback karena provider key dianggap missing/placeholder oleh service saat test. Jadi yang tervalidasi:

- schema DB;
- repo helper;
- fallback classifier;
- persistence insight/draft/event;
- build/type integration.

Yang belum tervalidasi:

- live OpenAI API response;
- live Gemini API response;
- UI browser flow dengan session admin;
- production Watzap webhook + provider behavior setelah deploy.

---

## 10. Findings

| Severity | Finding | Evidence | Recommendation |
|---|---|---|---|
| Blocker | Tidak ada blocker lokal. | Lint/build/test passed. | Boleh lanjut commit/push. |
| Important | Live AI provider belum tervalidasi. | Test log fallback deterministik. | Setelah deploy/staging, test endpoint insight/draft dengan API key valid. |
| Important | Audit table menyimpan snapshot AI input/output yang bisa berisi data percakapan. | `whatsapp_ai_events.input_snapshot/output_snapshot`. | Pastikan akses DB/log terbatas; pertimbangkan minimisasi snapshot untuk production. |
| Important | Context builder load semua bookings lalu filter di memory. | `buildWhatsAppCustomerContext()` query `SELECT ... FROM bookings`. | Aman sekarang; optimasi query phone-normalized jika data membesar. |
| Nice-to-have | UI state memakai `any`. | `aiInsight`, `aiDraft` di WhatsAppWorkspace. | Tambah TS interface di iterasi berikutnya. |
| Nice-to-have | Auto-send env sudah disiapkan, tapi belum dipakai karena auto-send belum diimplementasi. | `AI_CS_AUTO_SEND_ENABLED`, `AI_CS_ALLOWED_AUTO_INTENTS`. | Tetap baik untuk future; jangan aktifkan production sampai phase auto-reply khusus. |

---

## 11. Pre-Commit Checklist

Sebelum commit:

- [x] Runtime/log noise dibersihkan dari diff.
- [x] `.codegraph/daemon.pid` tidak ikut scope commit.
- [x] ESLint passed.
- [x] Test script passed.
- [x] Build production passed.
- [x] Data dummy test dibersihkan dari local DB.
- [ ] Review manual diff terakhir.
- [ ] Stage only intended files.
- [ ] Commit.
- [ ] Push untuk trigger CI/CD.

Suggested files to stage:

```bash
git add \
  .env.local.example \
  components/admin/whatsapp/WhatsAppWorkspace.tsx \
  lib/db.ts \
  lib/repositories/whatsapp.ts \
  lib/services/whatsapp-ai-service.ts \
  app/api/admin/whatsapp/conversations/[id]/ai/insight/route.ts \
  app/api/admin/whatsapp/conversations/[id]/ai/draft/route.ts \
  app/api/admin/whatsapp/conversations/[id]/ai/drafts/[draftId]/send/route.ts \
  app/api/admin/whatsapp/conversations/[id]/ai/drafts/[draftId]/reject/route.ts \
  scripts/test-ai-brain.ts \
  docs/plans/2026-06-05-whatsapp-brain-ai-reply-plan.md \
  docs/reports/2026-06-05-whatsapp-brain-ai-reply-assessment.md
```

Suggested commit message:

```text
feat: add WhatsApp AI brain and draft reply workflow
```

---

## 12. Deployment / CI-CD Notes

### 12.1 Recommended production env

Untuk deploy awal:

```env
AI_CS_ENABLED=false
AI_CS_INSIGHT_ENABLED=true
AI_CS_DRAFT_ENABLED=true
AI_CS_AUTO_SEND_ENABLED=false
```

Jika ingin test AI live di staging/admin only:

```env
AI_CS_ENABLED=true
AI_CS_PROVIDER=openai
AI_CS_MODEL=gpt-4o-mini
AI_CS_AUTO_SEND_ENABLED=false
OPENAI_API_KEY=...
```

### 12.2 Post-deploy smoke test

1. Login admin.
2. Buka WhatsApp Workspace.
3. Pilih conversation dengan histori chat.
4. Klik `Mulai Analisis` / `Refresh` di AI Customer Context.
5. Klik `Tanyakan Saran Balasan AI (Draft)`.
6. Pastikan draft muncul tapi tidak terkirim otomatis.
7. Klik `Salin ke Input CS`.
8. Jangan kirim ke customer produksi kecuali memang ingin test live.
9. Cek DB tabel:
   - `whatsapp_conversation_insights`
   - `whatsapp_ai_drafts`
   - `whatsapp_ai_events`
10. Monitor outbox jika draft benar-benar dikirim oleh CS.

### 12.3 Rollback plan

Jika UI/API bermasalah:

1. Set env:

```env
AI_CS_ENABLED=false
AI_CS_DRAFT_ENABLED=false
AI_CS_INSIGHT_ENABLED=false
AI_CS_AUTO_SEND_ENABLED=false
```

2. Deploy ulang.
3. Jika perlu rollback kode via git/CI.
4. Tabel baru bisa dibiarkan; tidak mengganggu fitur WhatsApp existing.

---

## 13. Final Recommendation

Decision: **SHIP WITH CAVEATS**.

Boleh commit dan push untuk menjalankan CI/CD karena:

- tidak ada blocker lokal;
- build dan lint passed;
- test script passed;
- auto-send AI tidak aktif;
- fitur masih human-in-the-loop.

Caveats yang perlu dipegang setelah CI/CD:

1. Validasi live OpenAI/Gemini belum selesai.
2. Jangan aktifkan auto-send AI.
3. Lakukan smoke test admin di staging/production setelah deploy.
4. Monitor DB audit dan outbox.
5. Jika ada isu, matikan via env tanpa perlu drop DB.
