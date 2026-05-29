# CodeGraph Optimization Report — CeritaKita Booking

Generated: 2026-05-29 via CodeGraph (2,144 nodes, 4,529 edges, 268 files)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Files | 268 |
| Total Functions | 549 |
| Total Components | ~200+ TSX |
| API Routes | ~45 route handlers |
| Duplicated `fetcher` | **7 instances** |
| God Components | 2 (≥30 symbols) |
| Monolithic Hooks | 1 (`useBookingForm`) |

**Risk Level: MEDIUM-HIGH** — codebase fungsional tapi beberapa area rentan terhadap bug perawatan dan re-render berlebihan.

---

## 1. CRITICAL — Duplikasi Fetcher Pattern (×7)

**Files affected:**
- `components/admin/crm/LeadDetailPanel.tsx`
- `components/admin/homepage/tabs/HeroAboutTab.tsx`
- `components/admin/homepage/tabs/PromoCtaTab.tsx`
- `components/admin/homepage/tabs/ServiceCategoriesTab.tsx`
- `components/admin/homepage/tabs/TestimonialsTab.tsx`
- `components/admin/homepage/tabs/ValuePropsTab.tsx`
- `hooks/useHomepageData.ts`

**Pattern terdeteksi:**
```tsx
const fetcher = (url: string) => fetch(url).then(res => res.json());
```

**Impact:**
- Konsistensi error handling tidak terjamin
- Tidak ada retry logic
- Tidak ada cache/dedup
- Base URL tidak tersentralisasi

**Rekomendasi:**
```typescript
// lib/fetch.ts — shared fetcher
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}
```

Lalu pakai `useSWR` atau `TanStack Query` untuk caching otomatis.

---

## 2. HIGH — God Component: `AdminDashboard` (37 symbols)

**File:** `components/admin/AdminDashboard.tsx`

**Masalah:**
- 7 custom hooks di-mount sekaligus (bookings, services, photographers, addons, export, leads, analytics)
- Permission logic 40+ baris inline
- Booking CRUD handlers (create, reschedule, calculate total, addon toggle) semua di dalam 1 komponen
- `useEffect` mount trigger 6 parallel fetch tanpa cancel/AbortController
- `calculateBookingTotal` duplikat dengan logika di customer-side `useBookingForm`

**Anti-patterns:**
```tsx
// ❌ Data fetching on mount tanpa cancellation
useEffect(() => {
    bookingsHook.fetchData();
    servicesHook.fetchData();
    photographersHook.fetchData();
    addonsHook.fetchData();
    leadsHook.fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**Rekomendasi — Refactor ke Container/Presenter:**

```
AdminDashboard (container)
├── hooks/useAdminData.ts     ← consolidate 7 hooks
├── services/booking-admin.ts ← extract CRUD handlers
├── services/permissions.ts   ← pure function permission check
└── components/
    ├── DashboardView.tsx
    ├── BookingCalendarView.tsx
    └── LeadBoardView.tsx
```

---

## 3. HIGH — Monolithic Hook: `useBookingForm`

**File:** `components/booking/hooks/useBookingForm.ts`

**Masalah:**
- 15+ state variables dalam 1 hook
- Hanya dipakai oleh **1 komponen** (`BookingForm`) — ini bukan reusable hook, ini logic extraction
- Calculation functions tidak di-memoize (`useCallback` tapi dependensi tidak optimal)
- State management campur aduk: UI state (loading, error) + form state + business logic (coupon, addons)

**Rekomendasi — Split into:**
1. `useBookingForm` → hanya form field state
2. `useServicePricing(selectedService, addons)` → pure calculation
3. `useCoupon(couponCode)` → coupon validation & application
4. `useBookingSubmission()` → submit logic + loading state

---

## 4. MEDIUM — `SettingsManagement` Monolith (19 symbols)

**File:** `components/admin/SettingsManagement.tsx`

**Masalah:**
- 8 tabs dalam 1 komponen dengan conditional rendering
- State object `settings` terlalu besar (~20 fields)
- Handler boilerplate: `handleInputChange`, `handleNumberChange`, `handleToggle`, `handleInvoiceChange` — semua shallow wrapper
- Upload logic inline di komponen

**Rekomendasi:**
- Pakai `react-hook-form` + zod schema untuk settings form
- Extract upload ke `useLogoUpload()` hook
- Split tabs ke file terpisah (sudah partial — tabs dipecah, tapi parent masih besar)

---

## 5. MEDIUM — Customer Booking Form Duplikasi Logika

**Files:**
- `components/booking/BookingForm.tsx` — old form
- `components/booking/MultiStepBookingForm.tsx` — new multi-step form
- `components/booking/hooks/useBookingForm.ts`

**Masalah:**
- Dua form yang berbeda bisa punya logika perhitungan total yang berbeda
- `MultiStepBookingForm` pakai context provider (`MultiStepFormProvider`) — lebih baik
- Tapi `useBookingForm` (old) masih besar dan tidak reusable

**Rekomendasi:**
- Consolidate pakai `MultiStepFormProvider` sebagai single source of truth
- Hapus `BookingForm` lama kalau tidak dipakai
- Extract `calculateTotalPrice()` ke `lib/pricing.ts` (pure function, testable)

---

## 6. MEDIUM — API Routes: Missing Patterns

**Dari file structure:**
- ~45 route handlers di `app/api/**/route.ts`
- Hampir semua manual `fetch()` ke SQLite/internal DB
- Tidak ada API client abstraction

**Rekomendasi:**
- Tinjau route handlers >10 symbols untuk business logic extraction:
  - `app/api/bookings/route.ts` (16 symbols)
  - `app/api/bookings/update/route.ts` (13 symbols)
  - `app/api/leads/[id]/interactions/route.ts` (11 symbols)
- Extract validasi ke `lib/validation/schemas.ts` (sudah ada — perlu ensure semua route pakai)

---

## 7. LOW — Performance Quick Wins

### a. Memoization
Banyak perhitungan di render loop tanpa `useMemo`:
```tsx
// ❌ Di-render setiap kali
const events = bookingsHook.bookings
    .filter(b => b.status === 'Active' || b.status === 'Rescheduled')
    .map(b => ({...}));

// ✅ Wrap dengan useMemo
const events = useMemo(() => bookingsHook.bookings
    .filter(...)
    .map(...), [bookingsHook.bookings]);
```

### b. Image Optimization
- `GallerySection` — banyak image loading
- Pastikan pakai Next.js `<Image>` dengan proper `sizes` dan `priority`

### c. Dynamic Import
Tab-modal components sebaiknya lazy-load:
```tsx
const InvoicePreviewModal = dynamic(() => import('./InvoicePreviewModal'));
```

---

## 8. Recommended Action Plan

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | Extract shared `apiFetch()` util | 30 min | Tinggi |
| P0 | Split `useBookingForm` monolith | 2 jam | Tinggi |
| P1 | Refactor `AdminDashboard` container/presenter | 4 jam | Tinggi |
| P1 | Consolidate `calculateTotalPrice` ke `lib/pricing.ts` | 45 min | Medium |
| P2 | Add `useMemo` ke event/calculation arrays | 1 jam | Medium |
| P2 | Review & lazy-load modal components | 1 jam | Medium |
| P3 | Replace manual fetch dengan SWR/TanStack Query | 1-2 hari | Tinggi (long-term) |
| P3 | `SettingsManagement` pakai `react-hook-form` | 3 jam | Medium |

---

## Appendices

### A. Tools Used
- `codegraph init` + `codegraph index`
- `codegraph files` — struktur project
- `codegraph context` — performance bottleneck identification
- `codegraph search` — duplicated pattern detection (`fetcher`)
- `codegraph node` — deep dive komponen besar
- `codegraph callers` — dependency analysis (`useBookingForm`)

### B. Next Steps
1. Jalankan `npm run build` untuk identify bundle size chunk
2. Tinjau `scripts/benchmark-bookings.ts` — sudah ada, tapi perlu di-schedule via CI
3. Consider Next.js `analyze` bundle analyzer

---
*Report generated automatically. Prioritas berdasarkan frekuensi impact × maintenance cost.*
