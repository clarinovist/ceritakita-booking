# Plan: Backend Architecture Cleanup (Zero Behavior Change)

Tanggal: 2026-07-11  
Status: **Completed** (Phase 1–4)  
Completed: 2026-07-11  
Reviewed: 2026-07-11 — lulus invariant plan + `tsc` / `lint` green  
Owner: CeritaKita Booking  
Scope: Backend layering only (`app/api` → `lib/services` → `lib/repositories` → `lib/db`)  
Constraint: **Zero behavior change** — tidak mengubah response shape, status code, side-effect order, atau schema DB

---

## 0. Completion summary

| Phase | Status | Hasil utama |
|-------|--------|-------------|
| 1 Import hygiene | ✅ Done | Tidak ada import `@/lib/storage-sqlite` di `app/` |
| 2 SQL out of routes | ✅ Done | `getDb()` di `app/api/**` hanya di `health/route.ts` |
| 3 Service extracts | ✅ Done | `booking-service` (create/update/reschedule/adjustPrice), `finance-service`, freelancer → repo + thin service facade |
| 4 Domain promote | ✅ Done | Domain modules di `lib/repositories/*` + re-export shim di path lama |

### Deliverables (repo state)

**Repositories baru/expanded:** `homepage`, `cms`, `freelancers`, `portfolio`, `payment-settings`, `finance`, plus promoted `addons`, `coupons`, `payment-methods`, `photographers`, `expenses`, `leads`, `lead-interactions`.

**Services:** `booking-service` diperluas; `finance-service` baru; `freelancer-service` jadi re-export ke `repositories/freelancers`.

**Compatibility shims (sengaja dipertahankan):** `lib/leads.ts`, `lib/coupons.ts`, `lib/addons.ts`, `lib/photographers.ts`, `lib/payment-methods.ts`, `lib/storage-expenses.ts`, `lib/lead-interactions.ts`, `lib/storage-sqlite.ts` (deprecated facade).

### Verification (saat completion)

```bash
npx tsc --noEmit          # 0 errors
npx next lint             # No ESLint warnings or errors
# build: npx next build   # succeeded (operator)
rg "from '@/lib/storage-sqlite'" --glob 'app/**/*'                    # 0
rg "getDb\(" --glob 'app/api/**/*.ts' | rg -v 'health/route.ts'       # 0
```

### Residual / next tracks (bukan blocker completion)

Lihat juga §9. Follow-up hygiene yang disarankan setelah review:

1. Seragamkan `import 'server-only'` di semua `lib/repositories/*`
2. Cutover call site `app/api/**` dari shim path → `@/lib/repositories/*`, lalu hapus shim / `storage-sqlite` bila 0 usage
3. Extract AI draft guardrails dari `app/api/admin/whatsapp/.../ai/draft/route.ts` → `whatsapp-ai-service`
4. Split god-module `lib/repositories/whatsapp.ts`
5. `@deprecated` / guard pada `writeData` di bookings repo
6. Type `updates` di `updateBooking` (hindari `any`)

---

## 1. Context

CeritaKita Booking sudah punya **benih layering yang benar** (contoh emas: `BookingService.createBooking` + `lib/repositories/bookings.ts`), tapi belum konsisten di seluruh backend.

| Masalah | Bukti |
|--------|--------|
| Dual import path | Banyak route masih import `@/lib/storage-sqlite` (facade deprecated) meski canonical-nya `@/lib/repositories/*` |
| SQL di route | ~23 file di `app/api/**` memanggil `getDb()` langsung (portfolio, homepage CMS, v1 agent API, several WhatsApp/admin routes) |
| Business logic di route | Status transition di `app/api/bookings/update/route.ts`, reschedule rules, cash-position/P&L aggregation di report routes |
| Nama layer menyesatkan | `freelancer-service` = pure SQL; `repositories/whatsapp.ts` = SQL + HTTP provider + CRM + outbox |
| Domain modules paralel | `lib/leads.ts`, `lib/coupons.ts`, `lib/addons.ts`, `lib/storage-expenses.ts` di luar `repositories/` |

### Keputusan scope

| In scope | Out of scope (track terpisah) |
|----------|-------------------------------|
| Backend layering murni | Admin frontend (WhatsAppWorkspace split, SWR, lazy-load) |
| Import path hygiene | Multi-tenant / Postgres |
| SQL keluar dari route | Versioned schema migrations (`lib/db.ts` rewrite) |
| Use-case ke service layer | Wiring `requirePermission` (bisa ubah 403 behavior) |
| Promote domain module → repositories | Split god-module WhatsApp repo (SQL vs outbox vs provider) |

Fokus: **fondasi backend dulu**, incremental, bisa di-ship per fase.

---

## 2. Target architecture

```
app/api/**/route.ts     → HTTP only: auth, rate-limit, Zod validate, call service, map response
lib/services/*          → Use-case: rules, orchestration, side effects (Telegram/email/outbox)
lib/repositories/*      → SQL + row mapping only (no HTTP, no business rules)
lib/db.ts               → Connection singleton + schema (tidak disentuh behavior di fase ini)
```

### Aturan keras (setelah cleanup)

1. Route **tidak** `import { getDb }` (kecuali health check yang memang probe koneksi).
2. Route **tidak** import `@/lib/storage-sqlite` — pakai `@/lib/repositories/*` atau service.
3. SQL baru **hanya** di `lib/repositories/<domain>.ts`.
4. Rules / status transition / pricing orchestration **hanya** di `lib/services/*`.
5. Tidak mengubah response shape, status code, side-effect order, atau schema DB.
6. Repositories **tidak** import services. Services import repositories only (hindari circular import).

### Gold path yang dipertahankan

| Asset | Path | Alasan keep |
|-------|------|-------------|
| Create booking orchestration | `lib/services/booking-service.ts` | Sudah thin-route + rules terpusat |
| Booking CRUD + mapping | `lib/repositories/bookings.ts` | `rowToBooking`, slot check |
| Error envelope | `lib/logger.ts` | `AppError`, `createErrorResponse`, `createValidationError` |
| Validation | `lib/validation.ts`, `lib/validation/*` | Zod; tidak diganti, dipakai konsisten |
| Deprecated facade | `lib/storage-sqlite.ts` | Biarkan re-export sampai import kosong, lalu hapus/stub |

### As-is layering (ringkas)

```
Route  ──┬──► storage-sqlite (deprecated facade) ──► repositories
         ├──► repositories/* (partial)
         ├──► lib/leads.ts, coupons.ts, addons.ts, … (domain modules)
         ├──► getDb() langsung di route (banyak)
         └──► services/* (hanya 3 file; booking create = gold path)
```

### To-be layering

```
Route  ──► Service (use-case) ──► Repository (SQL) ──► getDb()
         └── (read-only simple GET boleh langsung ke repository)
```

---

## 3. Recommended approach

Incremental **strangler** dalam 4 fase, masing-masing shippable & verifiable. Tidak ada big-bang rewrite, tidak ada schema change, tidak ada API contract change.

---

### Phase 1 — Import hygiene: kill `storage-sqlite` call sites ✅

**Status:** Completed  
**Goal:** Semua consumer di `app/` import canonical repository. Facade boleh tetap ada tapi unused di `app/`.

**Files to update (replace import path only):**

| File | Change to |
|------|-----------|
| `app/api/bookings/route.ts` | `repositories/bookings` |
| `app/api/bookings/[id]/route.ts` | `repositories/bookings` |
| `app/api/bookings/update/route.ts` | `repositories/bookings` |
| `app/api/bookings/reschedule/route.ts` | `repositories/bookings` |
| `app/api/bookings/adjust-price/route.ts` | `repositories/bookings` |
| `app/api/settings/route.ts` | `repositories/settings` |
| `app/api/export/bookings/route.ts` | `repositories/bookings` |
| `app/api/export/financial/route.ts` | `repositories/bookings` |
| `app/api/finance/summary/route.ts` | `repositories/bookings` (+ existing services) |
| `app/api/reports/pnl/route.ts` | `repositories/bookings` |
| `app/api/meta/history/route.ts` | `repositories/analytics` |
| `app/api/meta/insights/route.ts` | `repositories/analytics` (+ types dari `@/lib/types`) |
| `app/api/meta/backfill/route.ts` | `repositories/analytics` |

**Also scan** scripts/tests jika ada import `storage-sqlite`.

**Done when:**

```bash
rg "from '@/lib/storage-sqlite'|from \"@/lib/storage-sqlite\"" --glob 'app/**/*'   # 0 matches
npx tsc --noEmit
```

**Risk:** None (re-export identity).  
**Effort:** ~0.5 day

**Commit message:** `refactor(arch): import repositories instead of storage-sqlite`

---

### Phase 2 — Extract SQL out of routes into repositories ✅

**Status:** Completed  
**Goal:** `getDb()` hanya di dalam `lib/db.ts`, `lib/repositories/*`, dan legacy domain modules yang akan dipromote di Phase 4. Routes memanggil repository functions.

#### 2a. Expand thin / missing repositories

| New or expand | Extract from | Functions (preserve SQL as-is) |
|---------------|--------------|--------------------------------|
| Expand `lib/repositories/portfolio.ts` | `app/api/portfolio/route.ts` | list/create/update/delete portfolio images (sudah partial) |
| Expand `lib/repositories/payment-settings.ts` | `app/api/payment-settings/route.ts` | full read/write yang saat ini di route |
| New `lib/repositories/homepage.ts` | `app/api/homepage/route.ts`, `app/api/admin/homepage/content/route.ts` | homepage content CRUD |
| New `lib/repositories/cms.ts` (atau split) | `app/api/admin/testimonials/*`, `value-props/*`, `service-categories/*` | CMS entity CRUD |
| Expand `lib/repositories/analytics.ts` | `app/api/analytics/leads/route.ts` | lead analytics queries |
| Expand `lib/repositories/bookings.ts` | `app/api/v1/bookings/*`, `v1/payments` | query shapes agent API (atau thin wrapper ke `readData`/`readBooking`) |
| Expand `lib/repositories/finance.ts` | `app/api/v1/cash-position`, `v1/pnl` jika SQL-local | aggregates yang inline |
| Expand `lib/repositories/whatsapp.ts` **minimally** | `app/api/admin/whatsapp/summary/route.ts`, `conversations/[id]/route.ts`, bagian messages yang raw `getDb` | pindahkan SQL saja; **jangan** tambah provider HTTP di fase ini |

#### 2b. Special cases

| Route | Policy |
|-------|--------|
| `app/api/health/route.ts` | **Keep** `getDb()` — legitimate connection probe |
| `app/api/uploads/[...path]/route.ts` | Metadata SQL → portfolio/file repo; streaming/file IO tetap di route atau `lib/file-storage.ts` |
| `app/api/leads/[id]/convert/route.ts` | Prefer helper di `lib/leads.ts`; jika SQL hanya di route, tambah function di `lib/leads.ts` dulu (Phase 4 rename ke repository) |

**Method:** cut-paste SQL + types ke repository; route jadi thin. Query string dan column mapping **sama**.

**Done when:**

```bash
rg "getDb\(" --glob 'app/api/**/*.ts' | rg -v 'health/route.ts'   # 0 matches (atau hanya exception terdokumentasi)
npx tsc --noEmit && npx next lint
```

**Effort:** ~1–2 days  
**Commit message:** `refactor(arch): move SQL from API routes into repositories`

---

### Phase 3 — Extract business logic from routes into services ✅

**Status:** Completed  
**Goal:** Use-case rules keluar dari HTTP layer. Side-effect order tetap sama.

| Extract | From | Into |
|---------|------|------|
| Update booking (status transition matrix, payment side-effects, Telegram) | `app/api/bookings/update/route.ts` (~262 LOC) | `lib/services/booking-service.ts` → e.g. `updateBookingUseCase(...)` |
| Reschedule rules + history | `app/api/bookings/reschedule/route.ts` | same service → `rescheduleBookingUseCase(...)` |
| Adjust price rules | `app/api/bookings/adjust-price/route.ts` | same service (atau tetap thin jika pure repo update) |
| Cash position aggregation | `app/api/reports/cash-position/route.ts` | **New** `lib/services/finance-service.ts` (atau grow `repositories/finance` jika pure SQL aggregates tanpa rules) |
| P&L aggregation | `app/api/reports/pnl/route.ts` | same finance service/repo |
| AI draft pricing guardrails (jika pure rules, bukan HTTP) | `app/api/admin/whatsapp/.../ai/draft/route.ts` | `lib/services/whatsapp-ai-service.ts` |

#### Rename fix (zero behavior)

`lib/services/freelancer-service.ts` is SQL-only:

1. Move implementation → `lib/repositories/freelancers.ts`
2. Keep `lib/services/freelancer-service.ts` as thin re-export untuk import existing
3. Update call sites ke repository secara bertahap (opsional di PR yang sama)

#### Target route shape

```ts
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req); if (auth) return auth;
  const rate = rateLimiters.moderate(req); if (rate) return rate;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return createValidationError(...);
  try {
    const result = await bookingService.updateBooking(parsed.data, { requestId });
    return NextResponse.json(result);
  } catch (e) {
    return createErrorResponse(e);
  }
}
```

**Done when:** update/reschedule/report routes adalah thin wrapper; service bisa di-test tanpa HTTP (manual smoke cukup untuk fase ini).

**Effort:** ~1–2 days  
**Commit message:** `refactor(arch): extract booking/finance use-cases into services`

---

### Phase 4 — Canonicalize domain modules under `repositories/` ✅

**Status:** Completed  
**Goal:** Satu tempat untuk SQL domains. Pure move + re-export; **no logic rewrite**.

| Current | Target | Compatibility |
|---------|--------|---------------|
| `lib/leads.ts` | `lib/repositories/leads.ts` | `lib/leads.ts` re-exports (deprecate) |
| `lib/lead-interactions.ts` | `lib/repositories/lead-interactions.ts` | re-export shim |
| `lib/coupons.ts` | `lib/repositories/coupons.ts` | re-export shim |
| `lib/addons.ts` | `lib/repositories/addons.ts` | re-export shim |
| `lib/photographers.ts` | `lib/repositories/photographers.ts` | re-export shim |
| `lib/payment-methods.ts` | `lib/repositories/payment-methods.ts` | re-export shim |
| `lib/storage-expenses.ts` | `lib/repositories/expenses.ts` | re-export shim dari path lama |

Update internal imports di services/routes ke path baru di mana disentuh; shims menjaga caller lain tetap green.

**Optional end of Phase 4:**

- Hapus atau empty `lib/storage-sqlite.ts` jika zero imports project-wide (boleh keep 1 release cycle dengan deprecation comment jika scripts masih pakai).

**Explicitly NOT in this phase:**

- Split `repositories/whatsapp.ts` god module (risiko besar; hanya stop growing)
- Versioned SQL migrations / rewrite schema di `lib/db.ts`
- Frontend admin refactor
- Enable `requirePermission` on APIs

**Effort:** ~1 day  
**Commit message:** `refactor(arch): promote domain modules under lib/repositories`

---

## 4. Implementation order & PR strategy

Prefer **4 PRs** (atau 4 sequential commits di satu branch) sesuai fase:

1. `refactor(arch): import repositories instead of storage-sqlite`
2. `refactor(arch): move SQL from API routes into repositories`
3. `refactor(arch): extract booking/finance use-cases into services`
4. `refactor(arch): promote domain modules under lib/repositories`

Setiap PR harus lulus verification gate sebelum lanjut ke fase berikutnya.

---

## 5. Critical files

### Modify heavily

- `lib/services/booking-service.ts` — expand with update/reschedule
- `lib/repositories/bookings.ts` — shared queries for v1 if needed
- `lib/repositories/finance.ts` — grow beyond 2 SUM helpers
- `lib/repositories/portfolio.ts`, `payment-settings.ts`
- `app/api/bookings/update/route.ts`, `reschedule/route.ts`, `adjust-price/route.ts`
- `app/api/reports/cash-position/route.ts`, `pnl/route.ts`
- Routes di Phase 1–2 yang masih pakai `getDb` / `storage-sqlite`

### Create

- `lib/repositories/homepage.ts`
- `lib/repositories/cms.ts` (testimonials, value-props, service-categories) **atau** separate small repos jika lebih bersih
- `lib/repositories/freelancers.ts` (dari body freelancer-service)
- `lib/services/finance-service.ts` (jika aggregation non-trivial)
- `lib/repositories/{leads,addons,photographers,coupons,expenses,payment-methods}.ts` (Phase 4 moves)

### Reuse as-is

- `lib/logger.ts` — error envelope
- `lib/auth.ts` — `requireAuth`
- `lib/rate-limit.ts`
- `lib/pricing.ts`, `lib/validation.ts` / `lib/validation/*`
- `lib/telegram.ts`, `lib/email.ts` — side effects dipanggil dari services
- `lib/repositories/settings.ts`, `analytics.ts`, `services.ts`

---

## 6. Guardrails after cleanup (lightweight)

Tanpa menambah framework:

1. **PR checklist** (manual atau script):
   - no `storage-sqlite` under `app/`
   - no `getDb` under `app/api` except health
2. **Jangan** menambah eslint custom plugin di pass ini kecuali free via `rg` di checklist.
3. Dokumentasi target layering = file plan ini (source of truth).

---

## 7. Verification (setiap fase)

```bash
# Types
npx tsc --noEmit

# Lint
npx next lint

# Architecture invariants
rg "from '@/lib/storage-sqlite'|from \"@/lib/storage-sqlite\"" --glob 'app/**/*' || true
rg "getDb\(" --glob 'app/api/**/*.ts' | rg -v 'health/route.ts' || true

# Build
npx next build
```

### Manual smoke (zero behavior — outcome harus sama)

1. **Public booking create** — multi-step form masih create booking + pricing breakdown
2. **Admin update booking** — status change, payment add, Telegram masih fire jika configured
3. **Admin reschedule** — history row written
4. **Finance reports** — cash-position + P&L numbers match pre-refactor untuk date range yang sama
5. **Settings GET/PUT** — masih load/save
6. **Homepage / portfolio public API** — payload shape sama
7. **Agent `/api/v1/bookings`** — auth + response fields sama
8. **WhatsApp conversation list/messages** — masih load jika WA configured

Jika smoke gagal: **revert commit fase itu**; jangan “fix dengan behavior change”.

---

## 8. Success criteria

- [x] No `storage-sqlite` imports under `app/`
- [x] No `getDb()` in `app/api/**` except health (dan exception yang terdokumentasi)
- [x] Booking update/reschedule live in `booking-service`
- [x] Finance report math tidak inline di routes (service atau finance repository)
- [x] Domain SQL modules ada di `repositories/` atau re-export shim ke sana
- [x] `tsc`, `lint`, `build` green
- [x] Smoke checklist lulus dengan user-visible behavior identik *(operator / zero-behavior-change discipline saat extract)*

---

## 9. Out of scope (next architecture tracks)

Track berikutnya setelah backend layering stabil (masih open):

1. **Versioned migrations** — ganti try/catch `ALTER` di `lib/db.ts` dengan migration files berurutan
2. **Admin frontend architecture** — WhatsAppWorkspace split, lazy `viewMode`, SWR per domain, type hook bags
3. **Server-side RBAC** — wire `requirePermission` di sensitive APIs selaras dengan UI permissions
4. **WhatsApp module split** — SQL repo vs outbox/send vs AI service
5. **Multi-tenant / Postgres** — hanya jika productize ke studio lain
6. **Post-cleanup hygiene** — `server-only` seragam, cutover shim → repositories, deprecate `writeData`, type-safe booking updates, AI guardrails ke service

---

## 10. Risk notes

| Risk | Mitigation |
|------|------------|
| Accidental response shape change saat move mappers | Copy-paste dulu; no “cleanup” field names di PR yang sama |
| Side-effect order (Telegram/email) berubah | Keep call order identik di dalam service extract |
| Circular imports service ↔ repository | Repositories never import services |
| Large PR review fatigue | One phase per PR |
| `writeData` full-replace masih ada di bookings repo | Jangan dipanggil dari routes; biarkan legacy; jangan “improve” di work ini |

---

## 11. Effort estimate

| Phase | Rough effort |
|-------|----------------|
| 1 Import hygiene | Small (~0.5 day) |
| 2 SQL out of routes | Medium (~1–2 days) |
| 3 Service extracts | Medium (~1–2 days) |
| 4 Domain promote + shims | Medium (~1 day) |
| **Total** | **~3–5 focused days** |

---

## 12. Related docs

- `docs/codegraph-optimization-report.md` — inventory god components / fetcher dupes (frontend-heavy)
- `docs/codegraph-optimization-phase3-plan.md` — frontend/admin extraction yang sudah completed
- `docs/plans/2026-05-25-api-validation-and-security-hardening.md` — validation patterns
- `docs/plans/2026-06-05-whatsapp-brain-ai-reply-plan.md` — WhatsApp AI (logic extract partial overlap Phase 3)
