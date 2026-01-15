# CeritaKita Project Context

> **Instruksi:** Copy-paste isi file ini di awal conversation baru dengan Claude untuk melanjutkan konteks.

---

## Project Overview

**Nama:** CeritaKita Photography Booking System
**Tech Stack:** Next.js 14, TypeScript, SQLite (better-sqlite3), Tailwind CSS
**Database:** SQLite di `data/bookings.db`
**Deployment:** VPS

---

## Layanan/Services

CeritaKita adalah studio foto dengan layanan:
- Prewedding (Bronze, Silver, Gold)
- Wedding
- Wisuda / Graduation
- Birthday
- Family
- Tematik (Christmas, Lebaran, Imlek)
- Outdoor / On Location
- Pas Foto
- Self Photo

---

## Status Terakhir (Update: Januari 2026)

### Fitur Baru yang Sudah Selesai (DONE)

#### Branding & SEO dengan Analytics (2026-01-15)
- Refactor BrandingTab untuk fokus pada visual identity
- Integrasi Google Analytics (GA4 Measurement ID)
- Integrasi Meta Pixel untuk tracking konversi
- Komponen `DynamicAnalytics` untuk inject script ke `<head>`

#### Universal Invoice System (2026-01-15)
- `InvoiceTemplate` component reusable untuk semua invoice
- Invoice settings terpusat di Global Settings
- Preview modal sebelum generate invoice
- Dynamic data binding dari booking dan settings

#### Leads Kanban Board (2026-01-15)
- Drag-and-drop interface untuk manage leads
- Status columns: New → Contacted → Qualified → Converted → Lost
- Optimistic UI updates untuk instant feedback
- Toggle antara Table view dan Kanban view
- Menggunakan `@hello-pangea/dnd` library

#### Dashboard Real Trends (2026-01-14)
- Trend percentages berdasarkan period comparison
- Visual indicators (up/down arrows dengan warna)
- Multiple metrics: revenue, bookings, conversion

#### Performance Optimizations (2026-01-14)
- N+1 query fix di `getBookingsByStatus`
- In-memory caching untuk system settings
- Batch fetching untuk search results
- Single-pass iteration untuk financial export
- ISR untuk homepage API

#### Security Enhancements (2026-01-14)
- CSRF token validation pada authenticated requests
- Semua mutation endpoints terproteksi

#### Service Upgrade Logic (2026-01-14)
- Upgrade path mapping (Bronze → Silver → Gold)
- Automatic price difference calculation

### Homepage (DONE)
Homepage sudah diupdate dengan section:
- HeroSection, AboutSection, PackagesGrid, WhyChooseUsSection
- PromoSection, TestimonialsSection, CTASection, Footer

**Masalah:** Sebagian konten masih hardcoded, belum full CMS.

### Rencana Migrasi ke Prisma (PENDING)
- Tetap pakai SQLite + Prisma (bukan PostgreSQL)
- Akan dilakukan setelah fitur-fitur utama stabil

---

## Database Schema (Current - better-sqlite3)

Tabel existing di `lib/db.ts`:
- photographers
- bookings
- payments
- addons
- booking_addons
- reschedule_history
- coupons
- coupon_usage
- portfolio_images
- users
- payment_methods
- ads_performance_log
- system_settings (includes: branding, invoice, analytics settings)
- system_settings_audit
- leads

---

## File Structure (Homepage)

```
components/
├── homepage/              # Homepage sections (some hardcoded)
├── admin/
│   ├── settings/         # Tabbed settings (General, Contact, Finance, Rules, Templates)
│   ├── invoices/         # Invoice components
│   │   └── InvoiceTemplate.tsx
│   ├── LeadsKanban.tsx   # Kanban board for leads
│   └── AdminDashboard.tsx
├── analytics/
│   └── DynamicAnalytics.tsx  # Google Analytics & Meta Pixel
├── booking/               # Multi-step booking form
└── ui/                    # Reusable UI components
```

---

## Deployment Info

- **Platform:** VPS
- **Database Location:** `data/bookings.db`
- **Scale:** Kecil-menengah
- **Process Manager:** PM2

---

## Next Steps (To-Do)

1. **Homepage CMS (setelah Prisma ready):**
   - Tabel baru untuk dynamic content
   - Admin panel untuk manage homepage

2. **Migrasi ke Prisma:**
   ```bash
   npm install prisma @prisma/client
   npx prisma init --datasource-provider sqlite
   npx prisma db pull
   ```

---

## Notes

- WhatsApp number hardcoded di 3 tempat: PromoSection, CTASection, Footer
- Services di PackagesGrid TIDAK terhubung ke `data/services.json`
- Image assets di `/images/` folder (static)

---

## Cara Melanjutkan Conversation

Paste context ini di awal chat baru, lalu sampaikan:

> "Saya ingin melanjutkan project CeritaKita. Context ada di atas.
> Status terakhir: [sebutkan langkah terakhir yang sudah dilakukan]
> Sekarang saya mau: [sebutkan apa yang ingin dilakukan]"

---

*Last updated: 2026-01-15*
