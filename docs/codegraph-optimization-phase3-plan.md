# CodeGraph Optimization Phase 3 — Audit & Plan

> Generated: 2026-06-29  
> Status: Phase 2 pushed to `main` (`589efd6`), ready for Phase 3.

---

## Phase 2 Recap

| Metric | Before Phase 1 | After Phase 2 |
|--------|-----------------|---------------|
| `AdminDashboard.tsx` | ~744 baris | 338 baris |
| `useBookings.ts` | 265 baris | 265 (cancelable fetch added) |
| `useLeads.ts` | 555 baris | 555 (cancelable fetch added) |
| Lint warnings | 1 | 0 |
| TS errors | 0 | 0 |
| Build | ok | ok |

Deliverables:
- `lib/fetch.ts` — shared API client (`apiFetch`, `apiPost`, ...)
- `useAdminAnalytics.ts`, `useAdminPermissions.ts` — extracted from AdminDashboard
- `AdminViews.tsx`, `AdminCommandBar.tsx`, `AdminModals.tsx` — presenter extraction
- Admin data hooks: AbortController cancelable fetch in 5 hooks (`useBookings`, `useServices`, `usePhotographers`, `useAddons`, `useLeads`)

---

## Phase 3 Audit Findings

### A. Monolithic Hooks (remaining, >200 baris)

| File | Lines | Used By | Notes |
|------|-------|---------|-------|
| `components/admin/hooks/useLeads.ts` | 555 | `LeadsTable`, `CRMWorkspace` | Largest hook. Inline filter/pagination/sorting. Extractable |
| `components/booking/hooks/useBookingForm.ts` | 334 | `BookingForm`, `MultiStepForm` | Already slimmed. Pure pricing logic in `lib/pricing.ts`. Still viable for further split |
| `components/admin/hooks/useBookings.ts` | 265 | `BookingsTable`, modals | Cancelable fetch ✅, but inline CRUD handlers could become smaller |
| `components/admin/hooks/useFreelancers.ts` | 208 | `FreelancerJobInput`, `MonthlyRecap` | Mixed fetch + form state. Extractable |

**Action:** `useLeads.ts` → split into `useLeadFilter.ts`, `useLeadPagination.ts`, `useLeadCRUD.ts`.
`useFreelancers.ts` → extract form state into `useFreelancerForm.ts`.

### B. God Components (remaining, >200 baris)

| File | Lines | Used By | Notes |
|------|-------|---------|-------|
| `components/booking/MultiStepForm.tsx` | 570 | `BookingPage` | Single file with form context, navigation, validation, submission. **Top priority for Phase 3** |
| `components/CouponManagement.tsx` | 531 | `AdminDashboard` views | Table + modals + inline CRUD in one file |
| `components/admin/UserManagement.tsx` | 812 | `AdminDashboard` views | Bigger than old AdminDashboard. Table + CRUD + modals + role editor |
| `components/admin/PaymentMethodsManagement.tsx` | 636 | `AdminDashboard` views | Settings-style, multi-step forms |
| `components/admin/Bookings/modals/BookingDetailModal.tsx` | 605 | `BookingsTable` | Modal with huge conditional rendering logic |
| `components/admin/finance/CashPositionReport.tsx` | 309 | `FinanceReports` | Render-heavy, less logic, lower priority |
| `components/admin/crm/CRMWorkspace.tsx` | 306 | `AdminDashboard` views | CRM overview + table + actions |

**Action:** `UserManagement.tsx` → split into `UserTable.tsx`, `UserModals.tsx`, `UserFilters.tsx` or similar. Highest component priority because at 812 lines.
`CouponManagement.tsx` → split into table + modal presenter pattern (sama dengan yang sudah dilakukan di AdminDashboard).
`MultiStepForm.tsx` → already has dedicated hooks, but the component itself mixes navigation, step validation, and context provider.

### C. Inline `fetch()` Calls Outside `lib/fetch.ts`

Phase 2 sudah mengecilkan di admin data hooks, tapi masih banyak inline fetch yg belum migrate ke `apiFetch()`:

| File | Count of `fetch(` | Priority |
|------|-------------------|----------|
| `components/admin/hooks/useFreelancers.ts` | 9 | High — hook standardization |
| `components/admin/hooks/useLeads.ts` | 9 | High — hook standardization |
| `components/admin/hooks/useAddons.ts` | 5 | Medium |
| `components/admin/hooks/usePhotographers.ts` | 5 | Medium |
| `components/admin/UserManagement.tsx` | 5 | Medium |
| `components/admin/PaymentMethodsManagement.tsx` | 7 | Medium |
| `components/admin/homepage/tabs/GalleryTab.tsx` | 5 | Medium |
| `components/admin/AdminDashboard.tsx` | 3 (down from ~8+) | Low, nearly done |
| `components/CouponManagement.tsx` | 4 | Medium |
| `components/admin/finance/FinanceReports.tsx` | 2 | Low |

**Action:** Ganti semua `fetch(...)` di admin hooks dengan `apiFetch`/`apiDelete`/`apiPatch` dsb dari `lib/fetch.ts`. Goal Phase 3: zero inline `fetch()` in all admin hooks.

### D. Data-Layer Duplication in Booking

Booking side masih raw `fetch()` di beberapa file:
- `components/booking/MultiStepForm.tsx` — n/a (uses context/validation, not simple REST)
- `app/api/` routes — tetap native `fetch` karena server-side, ini wajar
- `components/CouponManagement.tsx` — 4 inline calls, bisa pakai `apiFetch`

| File | Count | Action |
|------|-------|--------|
| `CouponManagement.tsx` | 4 | Migrate to `apiFetch` / `apiDelete` / `apiPatch` |
| `PaymentSettingsManagement.tsx` | 2 | Migrate to `apiFetch` / `apiDelete` |
| `components/booking/steps/*.tsx` | 0-1 per file | Most already use `useBookingForm` hook or UI-only. Leave as-is unless called directly |

---

## Phase 3 Recommended Plan

### P0 — Hook-standardize remaining inline fetch (2-4 hours)
1. Replace `fetch` in `useFreelancers.ts` → `apiFetch`
2. Replace `fetch` in `useLeads.ts` → `apiFetch`
3. Replace `fetch` in `useAddons.ts` → `apiFetch`
4. Replace `fetch` in `usePhotographers.ts` → `apiFetch`
5. Verify: `grep -r "fetch(" components/admin/hooks/` → 0 occurrences of raw `fetch`.

### P1 — Split biggest components (4-8 hours)
6. **Split `UserManagement.tsx` (812 → 300ish)**
   - Extract `UserTable.tsx` (presenter)
   - Extract `UserModals.tsx` (presenter, sama pattern dengan `AdminModals.tsx`)
   - Extract `UserFilters.tsx` (search, role filter)
   - `UserManagement.tsx` jadi container (hooks composition + prop passing)

7. **Split `CouponManagement.tsx` (531 → 250ish)**
   - Extract `CouponTable.tsx`
   - Extract `CouponModals.tsx` (edit/create/detail)
   - Container mengurus state + CRUD handlers

8. **Split `PaymentMethodsManagement.tsx` (636)**
   - Extract `PaymentMethodList.tsx`
   - Extract `PaymentMethodFormModal.tsx`
   - Container mengurus fetch + toggle default + delete

### P2 — Booking-side consistency (2-4 hours)
9. Migrate `CouponManagement.tsx` raw `fetch` ke `lib/fetch.ts`.
10. Audit `MultiStepForm.tsx` — extract `FormNavigation.tsx` if the step routing logic is >100 lines standalone.
11. Audit `components/admin/Bookings/modals/BookingDetailModal.tsx` — split tab panes into sub-components.

### P3 — Cleanup & Verify (1 hour)
12. Run `npx tsc --noEmit` → clean
13. Run `npx next lint` → clean
14. Run `npx next build` → clean
15. Commit: `opt(cg): standardize admin hooks to apiFetch, split UserManagement and CouponManagement presenter`

---

## Quick Wins Checklist (bisa dieksekusi dalam 1 sesi)

- [ ] `useFreelancers.ts` — migrate fetch → `apiFetch` + AbortController
- [ ] `useLeads.ts` — migrate fetch → `apiFetch` (banyak calls, tapi pattern sama)
- [ ] `useAddons.ts` — migrate fetch → `apiFetch`
- [ ] `usePhotographers.ts` — migrate fetch → `apiFetch`
- [ ] `CouponManagement.tsx` — migrate fetch → `apiFetch`

---

## Metrics Target Phase 3

| Metric | Current | Target |
|--------|---------|--------|
| Inline `fetch` in admin hooks | ~30 total across 6 hooks | 0 |
| Inline `fetch` in non-hook admin | ~40 total across 15 files | <10 |
| UserManagement.tsx | 812 baris | <400 baris |
| CouponManagement.tsx | 531 baris | <300 baris |
| PaymentMethodsManagement.tsx | 636 baris | <350 baris |
| Monolithic hooks (>200 baris) | useLeads (555), useFreelancers (208) | useLeads <400 |
