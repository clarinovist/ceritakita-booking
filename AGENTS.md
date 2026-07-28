# Workflow Rules — CeritaKita Booking

## Tech Stack (ringkas)

- **Framework**: Next.js 14.2 (App Router, `output: standalone`)
- **DB**: SQLite `better-sqlite3` + WAL + `data/bookings.db` — host volume di Docker
- **Auth**: NextAuth.js (credentials, JWT) + `middleware.ts` protect `/admin/:path*`
- **API Auth**: `requireAuth(req)` / `requirePermission` di `lib/auth.ts`, `lib/permissions.ts`
- **Images**: Backblaze B2 S3 (`lib/b2-s3-client.ts`) + fallback local `uploads/`
- **Ads**: Meta Marketing API — tables `meta_campaigns`, `meta_adsets`, `meta_ads`, `meta_insights_daily`
- **WhatsApp**: Watzap provider (`lib/watzap.ts`) — inbox di `whatsapp_conversations`, `whatsapp_messages`, `message_outbox`
- **CRM**: Mini Kanban Lead (`leads` table) — status New/Contacted/Follow Up/Won/Lost/Converted
- **CI/CD**: GHCR `ghcr.io/clarinovist/ceritakita-booking:latest` → VPS `docker compose pull` + health check `/api/health`

## Workflow Utama — WAJIB (Plan → Fix → Gap → Verify → Build)

Urutan JANGAN dibalik. Setiap bug / feature / refactor:

### 1. PLAN — simpan di `docs/plans/`

- File: `docs/plans/YYYY-MM-DD-<slug>.md` (contoh: `docs/plans/2026-07-28-fix-leads-wa-attribution.md`)
- Isi minimal: konteks masalah, root cause, scope file kena, rencana fix, residual gap checklist, test scope.
- Template: lihat `docs/plans/2026-07-11-backend-architecture-cleanup.md` sebagai reference utama.
- **Plan harus ada sebelum mulai fix.** Jika model/DB ada masalah: tulis plan dulu, jangan langsung edit.
- `docs/plans/` **di-commit** (beda dengan polyflow — repo ini private internal, plan tidak bocor sensitif). Tetap hindari hardcode secret/host/IP.

### 2. FIX — jalankan sesuai plan

- Implementasi sesuai plan.
- **Layering rule (hasil cleanup 2026-07-11)**:
  - `app/api/**` → **WAJIB** via `lib/repositories/*` atau `lib/services/*`. **JANGAN** `getDb()` langsung (kecuali `app/api/health/route.ts`).
  - `lib/services/*` = business logic + orchestrasi (createBooking, updateBooking, reschedule, adjustPrice, attribution).
  - `lib/repositories/*` = pure DB access. Shims lama di `lib/leads.ts`, `lib/coupons.ts`, `lib/addons.ts`, `lib/photographers.ts`, `lib/storage-sqlite.ts` = re-export deprecated, jangan pakai untuk code baru.
  - `lib/index.ts` = **client-safe only** (types, validation, constants, type-utils, permission types). Jangan export DB/auth/fs dari sini.
- **API route template**:
  ```ts
  import { requireAuth } from '@/lib/auth';
  import { logger } from '@/lib/logger';
  import { createErrorResponse } from '@/lib/...'; // atau pattern yang ada
  export async function POST(req) {
    const auth = await requireAuth(req); if (auth) return auth;
    // zod validate → service/repo call → response
  }
  ```
- Setelah edit massal 5+ file: wajib `git status --short` + `git diff --stat`.

### 3. RESIDUAL GAP CHECK — loop sampai 0

- Cek lagi apa masih kurang dari plan.
- Tulis di plan `## Residual Gap` dengan checklist.
- Fix gap → cek lagi → ulang sampai `Gap: 0`. Gap 0 baru boleh verify.

### 4. VERIFY — Lint + Typecheck + Scope Test

- **Lint**: `npm run lint` — wajib lolos.
- **Typecheck**: `npx tsc --noEmit` — wajib 0 error (file test juga dihitung).
- **Test**: project ini belum ada test runner aktif (`vitest` di polyflow, di sini tidak). Verify manual via:
  - `npm run build` dry check (tapi build asli di step 5)
  - `rg "from '@/lib/storage-sqlite'" --glob 'app/**/*'` → harus 0 (kecuali file legacy yang memang shim)
  - `rg "getDb\(\)" --glob 'app/api/**/*.ts'` → hanya boleh `health/route.ts`
  - Manual QA sesuai plan scope (booking flow, admin, leads kanban, whatsapp inbox)
- Jika lint/typecheck gagal: balik ke FIX, update gap.

### 5. BUILD — terakhir

- `npm run build` — step terakhir setelah lint + typecheck + gap 0.
- Jika ada dev server / watcher jalan: tunggu idle atau tunggu perintah eksplisit user ("build", "gas build", "ship").
- Jika build gagal: fix → ulang lint + typecheck → build lagi.

## Commit & Push

- Commit setelah gap 0 + lint + typecheck + build lolos.
- **Jangan pernah push** tanpa perintah eksplisit user ("push", "ship", "kirim").
- Message: jelas, mention plan jika ada (`plan: docs/plans/...`).
- Release: `release-please` auto bump versi di `main`. Tag ikut CI build Docker.

## Database / Migration

- DB: `data/bookings.db` — SQLite + WAL. Jangan commit DB file (sudah di `.gitignore`).
- Migrasi engine: `lib/db.ts` → `schema_migrations` table + `runMigrations()` → `runBaselineSchema()` + `runMetaAdsMigrations()`.
- **Tambah table/column baru**: edit `runBaselineSchema()` atau `runMetaAdsMigrations()` di `lib/db.ts` dengan `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN` try/catch idempotent + index. TIDAK ada Prisma.
- **Jangan** refactor migration engine jadi framework heavy — keep `CREATE IF NOT EXISTS` + try/catch (simple, proven untuk SQLite + VPS bare).
- Seed homepage: `homepage_content`, `service_categories`, `testimonials`, `value_propositions` — cek `ensureCategoriesExist()` + `deactivateNonVisualCategories()` di `db.ts`.
- WAL backup: CI `build.yml` auto backup `data/bookings.db` sebelum deploy ke `data/backups/` retain 10 file terbaru.

## Deploy (VPS)

- Container: `ceritakita-booking` (name), image `ghcr.io/clarinovist/ceritakita-booking:latest`
- Compose: `docker-compose.yml` — port host `3001:3000`, volume `./data:/app/data`, `./uploads:/app/uploads`, user `1001:1001`
- **JANGAN build di VPS**. Build di CI → GHCR → VPS `docker compose pull` + `up -d`
- Health: `GET /api/health` — check DB `SELECT 1` + return `{status:"healthy"}`
- CI deploy script (`.github/workflows/build.yml`):
  - backup SQLite, `chown 1001:1001`, `docker compose pull`, `up -d --remove-orphans`, loop health check 36×5s di `http://127.0.0.1:3001/api/health`
  - kalau health fail → `docker logs --tail=100 app` + exit 1
- Manual deploy (darurat):
  ```bash
  cd /path/to/ceritakita-booking
  docker compose pull && docker compose up -d
  curl -s http://127.0.0.1:3001/api/health | grep healthy
  docker ps --filter name=ceritakita-booking --format "{{.Names}} {{.Status}} {{.Image}}"
  ```
- Data permission issue (sering): `sudo chown -R 1001:1001 ./data ./uploads && sudo chmod -R 775 ./data ./uploads`

### Verifikasi Wajib Setelah Deploy

```bash
curl -s http://127.0.0.1:3001/api/health
docker logs ceritakita-booking --tail 100
sqlite3 data/bookings.db "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
ls -lh data/backups/ | tail -20
```

- CI green ≠ data ok — cek `bookings` count, `meta_insights_daily` ada isi, `wa_clicks` tracking jalan.

## Auth & Permissions

- Admin guard: `middleware.ts` (NextAuth) protect `/admin/*`
- API guard: `requireAuth(req)` di `lib/auth.ts` — return 401 Response jika fail, `null` jika ok
- Role/permissions: `lib/permissions-types.ts` (types + pure logic), `lib/permissions.ts` (DB lookup), `lib/auth-config.ts` (NextAuth config)
- `lib/index.ts` export `hasPermission`, `getFilteredMenuItems`, `DEFAULT_*_PERMISSIONS` — ini pure JS, safe client.
- Saat tambah model baru butuh guard: tambah permission key di `permissions-types.ts`, cek via `requirePermission` pattern.

## Batch Edit Safety (dari polyflow lesson)

- Setelah edit 5+ file / rewrite component: `git status --short` + `git diff --stat` **sebelum** next step.
- codegraph index lag ~1s — jika file hilang dari status, re-apply via Edit/Write + `grep -n "keyword"` verify.
- Jangan edit `data/bookings.db` file directly tanpa backup.

## Graphify

- Project ini sudah ada `graphify-out/` + `graphify-out/GRAPH_REPORT.md`
- Saat user ketik `/graphify`, pakai skill `graphify` (`~/.claude/skills/graphify/SKILL.md`)
- Untuk pertanyaan codebase: `graphify query "<question>"` dulu kalau `graphify-out/graph.json` ada. `graphify path "<A>" "<B>"` untuk relasi, `graphify explain "<concept>"` untuk konsep fokus.
- Dirty `graphify-out/` files = expected (hooks / incremental). Skip graphify hanya kalau task soal stale graph atau user bilang jangan.
- Setelah modif code: `graphify update .` untuk keep graph current (AST-only, no API cost).

## Barrel Exports

- ✅ Pakai: `from '@/components/admin'`, `from '@/components/booking'`, `from '@/lib'`, `from '@/lib/types'`, `from '@/utils'`
- ❌ Hindari deep import: `from '@/components/admin/hooks/useBookings'`, `from '@/lib/types/service'`
- API routes: import langsung repo/service (`from '@/lib/repositories/bookings'`), jangan lewat `@/lib/index.ts`

## Env & Secrets

- Local: `.env.local` (gitignored) — lihat `.env.local.example` untuk key lengkap
- Required: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`
- Optional: B2 (`B2_APPLICATION_KEY_ID/KEY/ENDPOINT/BUCKET_NAME`), Meta (`META_ACCESS_TOKEN/AD_ACCOUNT_ID`), Resend, Watzap, AI CS (`AI_CS_*`, `OPENAI_API_KEY`/`GEMINI_API_KEY`)
- Generate secret: `openssl rand -base64 32`

## Invariant Penting

- `total_price` tidak boleh negatif (cek `lib/pricing.ts` / `price-adjustments.ts`)
- Discount tidak boleh > base price (validated zod `serviceSchema` refine)
- Booking status: `Active | Cancelled | Rescheduled | Completed`
- Lead status: `New | Contacted | Follow Up | Won | Lost | Converted`
- Booking date query pakai `>= ?` bukan `date()` function untuk enable index (`lib/repositories/bookings.ts`)
- `app/api/health/route.ts` satu-satunya route boleh `getDb()` langsung

## Docs

- `README.md` = quick start + tech stack + API list
- `USER_MANUAL.md` = guide non-teknis staff studio
- `DEPLOYMENT_GUIDE.md` = guide teknis VPS
- `CHANGELOG.md` = version history
- `docs/plans/` = planning docs (di-commit)
- `docs/UI_DESIGN_SYSTEM.md` = design tokens
