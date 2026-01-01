# Changelog

All notable changes to the CeritaKita Studio Booking System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Admin Settings Refactor - 2026-01-01

#### Comprehensive Settings Management with Tabbed Interface
- **Tabbed Settings UI**: Refactored admin settings into 5 logical tabs for better organization
  - **General & SEO**: Site branding, hero title, meta tags for SEO
  - **Contact & Socials**: Business email, social media links (Instagram, TikTok), Google Maps link
  - **Finance**: Bank details (name, number, holder), invoice notes, tax rate, deposit rules
  - **Booking Rules**: Minimum booking notice, maximum booking advance period
  - **Templates**: WhatsApp message template management with variable support

#### Enhanced Invoice Generation
- **Dynamic Bank Details**: Invoices now display bank information from system settings
- **Business Email**: Configurable business email shown on invoices
- **Tax Calculation**: Automatic tax calculation with configurable rate (0-100%)
- **Social Media Links**: Optional social media profiles displayed on invoices
- **Custom Invoice Notes**: Configurable footer notes for payment terms and disclaimers

#### Booking Rules Enforcement
- **Minimum Notice Period**: Prevents same-day bookings based on configured notice
- **Maximum Advance Booking**: Limits how far in advance customers can book
- **Server-Side Validation**: Booking API enforces rules to prevent bypassing client validation
- **Smart Date Picker**: Calendar interface disables dates outside allowed range

#### Database & Type Safety
- **Schema Expansion**: Added 15+ new settings columns to `system_settings` table
- **TypeScript Interfaces**: Comprehensive type definitions in `lib/types/settings.ts`
- **Migration Script**: SQLite-compatible migration with default values and backward compatibility
- **No `any` Types**: Full type safety maintained throughout

#### New Components
- `components/admin/settings/GeneralTab.tsx` - Branding and SEO management
- `components/admin/settings/ContactTab.tsx` - Contact info and social links
- `components/admin/settings/FinanceTab.tsx` - Financial settings
- `components/admin/settings/RulesTab.tsx` - Booking constraints
- `components/admin/settings/TemplatesTab.tsx` - Message templates

#### Files Modified
- `components/admin/SettingsManagement.tsx` - Refactored to tabbed interface
- `app/admin/invoices/[id]/page.tsx` - Dynamic settings integration
- `app/api/bookings/route.ts` - Server-side rule validation
- `components/booking/steps/ScheduleInfo.tsx` - Client-side rule enforcement
- `lib/types/settings.ts` - Expanded type definitions
- `scripts/migrate-settings.sql` - Database migration script
- `user_stories_admin_settings_refactor.md` - Comprehensive documentation

#### Impact
- **Improved UX**: Settings organized logically, easier to find and manage
- **Dynamic Configuration**: All business settings configurable without code changes
- **Enhanced Invoices**: Professional invoices with accurate business information
- **Flexible Booking Rules**: Business owners control booking constraints
- **Type Safety**: Reduced bugs through comprehensive TypeScript types
- **Backward Compatible**: Existing functionality preserved while adding new features

### Code Quality Improvements - 2025-01-XX

#### Standardized Error Handling & Logging
- **Standardized error handling**: All API routes now use `createErrorResponse` helper for consistent error responses
- **Centralized logging**: Replaced all `console.error/log/warn` calls in API routes with structured `logger` utility
- **Improved error context**: All error logs now include relevant context information for better debugging
- **Type safety improvements**: Enhanced TypeScript types throughout the codebase

#### Code Cleanup
- **Utility improvements**: Removed console.error calls from date formatting utilities (silent failure pattern)
- **Import consistency**: Fixed import inconsistencies across API routes
- **Documentation consolidation**: Merged redundant documentation files and updated README with Meta Ads integration details

#### Files Modified
- All API routes (20+ files) - Standardized error handling and logging
- `utils/dateFormatter.ts` - Cleaned up error handling
- `README.md` - Added Meta Ads integration section
- Documentation files consolidated and cleaned up

#### Impact
- Better error tracking with structured logs
- Consistent error responses across all API endpoints
- Improved debugging capabilities with contextual error information
- Cleaner codebase with reduced redundancy

### Fixed - 2025-12-26

#### Booking Form & Portfolio Images
- **Fixed CSS typo in StepAddons component**: Corrected invalid CSS class `gap- gap-2` to `gap-2` in addon quantity controls (components/booking/StepAddons.tsx:198)
- **Fixed portfolioImages undefined error**: Resolved "Cannot read properties of undefined (reading 'length')" error by properly accessing `portfolioImages` from `formData.portfolioImages` instead of trying to destructure it directly from context
- **Added Backblaze B2 image domain configuration**: Added `ceritakita-images.s3.eu-central-003.backblazeb2.com` to Next.js `remotePatterns` in next.config.mjs to enable portfolio image optimization and display

#### Impact
These fixes enable:
- Proper display of addon quantity controls in the booking form
- Portfolio images to load and display correctly in the addons step
- Next.js Image Optimization for Backblaze B2-hosted portfolio images

### Technical Details
- **Files Modified**:
  - `components/booking/StepAddons.tsx` - Fixed CSS class and portfolioImages access
  - `next.config.mjs` - Added Backblaze B2 domain to image remotePatterns
- **Deployment**: Changes deployed via Docker rebuild on 2025-12-26

---

## Previous Changes

### Added - Earlier
- Portfolio image fetching and display in booking form
- Multi-step booking form with addons
- Coupon system with validation
- Payment settings API
- Backblaze B2 integration for image storage
- Docker deployment configuration
- Nginx reverse proxy setup
