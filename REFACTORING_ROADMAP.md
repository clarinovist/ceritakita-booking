# Refactoring Roadmap - CeritaKita Booking System

**Created**: 2025-12-31
**Analysis Agent ID**: ae64e7e (for resuming codebase exploration)

## Executive Summary

This document outlines a comprehensive refactoring plan to optimize the CeritaKita booking system for better maintainability, scalability, and developer experience. The codebase currently has ~20,485 lines of TypeScript across 105 files with a solid architectural foundation but several critical issues that need addressing.

**Current Architecture Score**: 7/10

**Key Issues**:
- AdminDashboard.tsx is 79KB (~2,500 lines) - monolithic component
- Duplicate step components in booking flow
- Type definitions scattered across 3 locations
- No test coverage
- Inconsistent file naming conventions

---

## Priority 1: Break Down AdminDashboard.tsx 🔴 CRITICAL

### Current State
- **File**: `components/admin/AdminDashboard.tsx`
- **Size**: 79KB (~2,500 lines)
- **Issues**:
  - Contains entire admin panel logic
  - Includes all tables (bookings, services, photographers, addons)
  - All modals and forms
  - Dashboard metrics
  - API calls and state management
  - Violates Single Responsibility Principle

### Target Structure

```
components/admin/
├── AdminDashboard.tsx                    # Main orchestrator (~200 lines)
│
├── Dashboard/                            # Dashboard metrics section
│   ├── DashboardView.tsx                 # Container for dashboard tab
│   ├── MetricsPanel.tsx                  # Main metrics display
│   ├── QuickStats.tsx                    # Quick stats cards
│   ├── RevenueChart.tsx                  # Revenue visualization
│   └── RecentActivity.tsx                # Recent activity feed
│
├── Bookings/                             # Bookings management section
│   ├── BookingsView.tsx                  # Container for bookings tab
│   ├── BookingsList.tsx                  # Bookings table
│   ├── BookingFilters.tsx                # Filters component
│   ├── BookingDetail.tsx                 # Single booking detail
│   └── modals/
│       ├── CreateBookingModal.tsx
│       ├── EditBookingModal.tsx
│       ├── RescheduleModal.tsx
│       └── DeleteConfirmationModal.tsx
│
├── Services/                             # Services management section
│   ├── ServicesView.tsx                  # Container for services tab
│   ├── ServicesList.tsx                  # Services table
│   └── modals/
│       ├── ServiceModal.tsx              # Create/Edit service
│       └── DeleteServiceModal.tsx
│
├── Photographers/                        # Photographers management section
│   ├── PhotographersView.tsx             # Container for photographers tab
│   ├── PhotographersList.tsx             # Photographers table
│   └── modals/
│       ├── PhotographerModal.tsx
│       └── DeletePhotographerModal.tsx
│
├── Addons/                               # Addons management section
│   ├── AddonsView.tsx                    # Container for addons tab
│   ├── AddonsList.tsx                    # Addons table
│   └── modals/
│       ├── AddonModal.tsx
│       └── DeleteAddonModal.tsx
│
├── Users/                                # User management section
│   ├── UsersView.tsx                     # Container for users tab
│   ├── UsersList.tsx                     # Users table
│   └── modals/
│       ├── CreateUserModal.tsx
│       ├── EditUserModal.tsx
│       └── DeleteUserModal.tsx
│
├── Settings/                             # Settings section
│   ├── SettingsView.tsx                  # Container for settings tab
│   ├── GeneralSettings.tsx               # General settings form
│   ├── PaymentSettings.tsx               # Payment settings
│   └── NotificationSettings.tsx          # Notification preferences
│
├── Coupons/                              # Coupons management section
│   ├── CouponsView.tsx                   # Container for coupons tab
│   ├── CouponsList.tsx                   # Coupons table
│   └── modals/
│       └── CouponModal.tsx
│
├── Portfolio/                            # Portfolio management section
│   ├── PortfolioView.tsx                 # Container for portfolio tab
│   └── PortfolioGallery.tsx              # Portfolio image gallery
│
├── AdsPerformance/                       # Meta Ads section
│   ├── AdsView.tsx                       # Container for ads tab
│   └── AdsMetrics.tsx                    # Ads metrics display
│
├── shared/                               # Shared admin components
│   ├── AdminTabs.tsx                     # Tab navigation component
│   ├── DataTable.tsx                     # Reusable table component
│   ├── FormField.tsx                     # Reusable form field
│   ├── StatusBadge.tsx                   # Status indicator component
│   └── ConfirmDialog.tsx                 # Reusable confirmation dialog
│
├── hooks/                                # Existing hooks (keep as-is)
│   ├── useBookings.ts
│   ├── useServices.ts
│   ├── usePhotographers.ts
│   ├── useAddons.ts
│   └── useExport.ts
│
├── tables/                               # Existing table components
│   ├── BookingsTable.tsx
│   ├── ServicesTable.tsx
│   ├── PhotographersTable.tsx
│   └── AddonsTable.tsx
│
├── types/                                # Existing type definitions
│   └── admin.ts
│
└── index.ts                              # Barrel export
```

### Implementation Steps

#### Step 1.1: Create Shared Components
- [ ] `shared/AdminTabs.tsx` - Extract tab navigation logic
- [ ] `shared/DataTable.tsx` - Generic table wrapper
- [ ] `shared/FormField.tsx` - Reusable form inputs
- [ ] `shared/StatusBadge.tsx` - Status indicators
- [ ] `shared/ConfirmDialog.tsx` - Confirmation dialogs

#### Step 1.2: Extract Dashboard Section
- [ ] `Dashboard/DashboardView.tsx` - Dashboard container
- [ ] `Dashboard/MetricsPanel.tsx` - Move DashboardMetrics logic
- [ ] `Dashboard/QuickStats.tsx` - Quick stats cards
- [ ] `Dashboard/RevenueChart.tsx` - Revenue visualization
- [ ] Test dashboard section works independently

#### Step 1.3: Extract Bookings Section
- [ ] `Bookings/BookingsView.tsx` - Bookings container
- [ ] `Bookings/BookingsList.tsx` - Use existing BookingsTable
- [ ] `Bookings/BookingFilters.tsx` - Extract filter logic
- [ ] `Bookings/modals/CreateBookingModal.tsx`
- [ ] `Bookings/modals/EditBookingModal.tsx`
- [ ] `Bookings/modals/RescheduleModal.tsx`
- [ ] `Bookings/modals/DeleteConfirmationModal.tsx`
- [ ] Test bookings CRUD operations

#### Step 1.4: Extract Services Section
- [ ] `Services/ServicesView.tsx` - Services container
- [ ] `Services/ServicesList.tsx` - Use existing ServicesTable
- [ ] `Services/modals/ServiceModal.tsx` - Move existing modal
- [ ] `Services/modals/DeleteServiceModal.tsx`
- [ ] Test services CRUD operations

#### Step 1.5: Extract Photographers Section
- [ ] `Photographers/PhotographersView.tsx` - Photographers container
- [ ] `Photographers/PhotographersList.tsx` - Use existing PhotographersTable
- [ ] `Photographers/modals/PhotographerModal.tsx`
- [ ] `Photographers/modals/DeletePhotographerModal.tsx`
- [ ] Test photographers CRUD operations

#### Step 1.6: Extract Addons Section
- [ ] `Addons/AddonsView.tsx` - Addons container
- [ ] `Addons/AddonsList.tsx` - Use existing AddonsTable
- [ ] `Addons/modals/AddonModal.tsx`
- [ ] `Addons/modals/DeleteAddonModal.tsx`
- [ ] Test addons CRUD operations

#### Step 1.7: Extract Users Section
- [ ] `Users/UsersView.tsx` - Users container
- [ ] `Users/UsersList.tsx` - Move UserManagement logic
- [ ] `Users/modals/CreateUserModal.tsx`
- [ ] `Users/modals/EditUserModal.tsx`
- [ ] `Users/modals/DeleteUserModal.tsx`
- [ ] Test user management operations

#### Step 1.8: Extract Settings Section
- [ ] `Settings/SettingsView.tsx` - Settings container
- [ ] `Settings/GeneralSettings.tsx` - Move SettingsManagement logic
- [ ] `Settings/PaymentSettings.tsx` - Move PaymentMethodsManagement logic
- [ ] `Settings/NotificationSettings.tsx`
- [ ] Test settings updates

#### Step 1.9: Extract Coupons Section
- [ ] `Coupons/CouponsView.tsx` - Coupons container
- [ ] `Coupons/CouponsList.tsx` - Move CouponManagement logic
- [ ] `Coupons/modals/CouponModal.tsx`
- [ ] Test coupon operations

#### Step 1.10: Extract Portfolio Section
- [ ] `Portfolio/PortfolioView.tsx` - Portfolio container
- [ ] `Portfolio/PortfolioGallery.tsx` - Move PortfolioManagement logic
- [ ] Test portfolio image uploads

#### Step 1.11: Extract Ads Performance Section
- [ ] `AdsPerformance/AdsView.tsx` - Ads container
- [ ] `AdsPerformance/AdsMetrics.tsx` - Move AdsPerformance logic
- [ ] Test Meta Ads integration

#### Step 1.12: Refactor Main AdminDashboard
- [ ] Update AdminDashboard.tsx to orchestrator pattern
- [ ] Import all view components
- [ ] Implement tab routing
- [ ] Remove all inline logic
- [ ] Add barrel export in index.ts
- [ ] Full regression testing

### Expected Outcomes
- AdminDashboard.tsx: 79KB → ~5KB (~200 lines)
- 11 feature-based view components
- 20+ smaller, focused components
- Better code reusability
- Easier to test
- Faster component loading
- Better developer experience

### Estimated File Count
- Before: 1 file (79KB)
- After: ~60 files (average 1-3KB each)

---

## Priority 2: Consolidate Step Components 🔴 CRITICAL

### Current State

**Duplicate locations**:
```
components/booking/
├── StepServiceSelection.tsx          # Top-level
├── StepAddons.tsx                    # Top-level
├── StepSchedule.tsx                  # Top-level
├── StepCustomerInfo.tsx              # Top-level
├── StepPayment.tsx                   # Top-level
└── steps/                            # Subdirectory
    ├── ServiceSelection.tsx
    ├── AddonsSelection.tsx
    ├── ScheduleInfo.tsx
    ├── CustomerInfo.tsx
    ├── PaymentInfo.tsx
    ├── ReviewBooking.tsx
    └── BookingConfirmation.tsx
```

**Problem**: Unclear which is canonical, potential inconsistencies

### Target Structure

```
components/booking/
├── BookingForm.tsx                   # Main form orchestrator
├── MultiStepForm.tsx                 # Step navigation wrapper
├── steps/                            # SINGLE source of truth
│   ├── index.ts                      # Barrel export
│   ├── ServiceSelection.tsx          # Step 1: Service selection
│   ├── AddonsSelection.tsx           # Step 2: Addons selection
│   ├── ScheduleInfo.tsx              # Step 3: Date/time/photographer
│   ├── CustomerInfo.tsx              # Step 4: Customer details
│   ├── PaymentInfo.tsx               # Step 5: Payment method
│   ├── ReviewBooking.tsx             # Step 6: Review & confirm
│   └── BookingConfirmation.tsx       # Step 7: Success confirmation
├── components/                       # Shared booking UI
│   ├── CountdownTimer.tsx
│   ├── Lightbox.tsx
│   └── PaymentDetails.tsx
├── hooks/
│   └── useBookingForm.ts
└── types/
    └── booking.ts
```

### Implementation Steps

#### Step 2.1: Analyze Current Implementation
- [ ] Read all duplicate step components
- [ ] Compare implementations
- [ ] Identify which version is more complete
- [ ] Document dependencies and imports
- [ ] Check where each version is used

#### Step 2.2: Consolidate Step Components
- [ ] Keep `steps/` directory as canonical location
- [ ] Merge any unique logic from top-level Step*.tsx files
- [ ] Update imports in BookingForm.tsx
- [ ] Update imports in MultiStepForm.tsx
- [ ] Create barrel export in steps/index.ts

#### Step 2.3: Remove Duplicate Files
- [ ] Delete `StepServiceSelection.tsx`
- [ ] Delete `StepAddons.tsx`
- [ ] Delete `StepSchedule.tsx`
- [ ] Delete `StepCustomerInfo.tsx`
- [ ] Delete `StepPayment.tsx`

#### Step 2.4: Testing
- [ ] Test entire booking flow
- [ ] Verify all steps render correctly
- [ ] Test form validation
- [ ] Test navigation between steps
- [ ] Test booking submission

### Expected Outcomes
- Single source of truth for step components
- Clear file organization
- Reduced confusion for developers
- Easier to maintain booking flow

---

## Priority 3: Centralize Type Definitions 🟡 HIGH

### Current State

**Types scattered across**:
- `lib/types/settings.ts`
- `lib/types/user.ts`
- `components/admin/types/admin.ts`
- `components/booking/types/booking.ts`

**Problems**:
- `Addon` type defined in both admin.ts and booking.ts
- `Service` type duplicated
- Hard to find type definitions
- Potential inconsistencies

### Target Structure

```
lib/types/
├── index.ts                          # Barrel export (all types)
├── booking.ts                        # Booking-related types
├── service.ts                        # Service types
├── addon.ts                          # Addon types
├── photographer.ts                   # Photographer types
├── user.ts                           # User & auth types (existing)
├── settings.ts                       # Settings types (existing)
├── coupon.ts                         # Coupon types
├── payment.ts                        # Payment-related types
├── portfolio.ts                      # Portfolio types
├── meta-ads.ts                       # Meta Ads types
└── common.ts                         # Shared common types
```

### Implementation Steps

#### Step 3.1: Audit All Type Definitions
- [ ] List all types from `components/admin/types/admin.ts`
- [ ] List all types from `components/booking/types/booking.ts`
- [ ] List all types from `lib/types/`
- [ ] Identify duplicates
- [ ] Identify dependencies

#### Step 3.2: Create Domain Type Files
- [ ] Create `lib/types/service.ts` - extract Service types
- [ ] Create `lib/types/addon.ts` - extract Addon types
- [ ] Create `lib/types/photographer.ts` - extract Photographer types
- [ ] Create `lib/types/booking.ts` - consolidate booking types
- [ ] Create `lib/types/coupon.ts` - extract Coupon types
- [ ] Create `lib/types/payment.ts` - extract Payment types
- [ ] Create `lib/types/portfolio.ts` - extract Portfolio types
- [ ] Create `lib/types/meta-ads.ts` - extract Meta Ads types
- [ ] Create `lib/types/common.ts` - shared utility types

#### Step 3.3: Create Barrel Export
- [ ] Create `lib/types/index.ts`
- [ ] Export all types from all domain files
- [ ] Add JSDoc comments for documentation

#### Step 3.4: Update Imports Across Codebase
- [ ] Update imports in `components/admin/`
- [ ] Update imports in `components/booking/`
- [ ] Update imports in `app/api/`
- [ ] Update imports in `lib/`
- [ ] Use automated find-replace for efficiency

#### Step 3.5: Remove Old Type Files
- [ ] Delete `components/admin/types/admin.ts`
- [ ] Delete `components/booking/types/booking.ts`
- [ ] Remove empty `types/` directories

#### Step 3.6: Verify Type Consistency
- [ ] Run TypeScript compiler
- [ ] Fix any type errors
- [ ] Ensure no circular dependencies
- [ ] Test build process

### Expected Outcomes
- Single source of truth for all types
- Import types like: `import { Service, Addon } from '@/lib/types'`
- Easier to maintain type consistency
- Better IDE autocomplete
- Reduced duplication

---

## Priority 4: Add Barrel Exports 🟡 HIGH

### Current State

**Deep imports required**:
```typescript
import { useBookings } from '@/components/admin/hooks/useBookings'
import { useServices } from '@/components/admin/hooks/useServices'
import { BookingsTable } from '@/components/admin/tables/BookingsTable'
```

### Target State

**Clean imports**:
```typescript
import { useBookings, useServices, BookingsTable } from '@/components/admin'
```

### Implementation Locations

```
components/
├── admin/
│   └── index.ts                      # Export all admin components/hooks
├── booking/
│   └── index.ts                      # Export all booking components/hooks
└── ui/
    └── index.ts                      # Export all UI components

lib/
├── index.ts                          # Export all lib utilities
└── types/
    └── index.ts                      # Export all types (Priority 3)
```

### Implementation Steps

#### Step 4.1: Create Component Barrel Exports
- [ ] Create `components/admin/index.ts`
  - Export all view components
  - Export all hooks
  - Export all table components
  - Export all modal components
- [ ] Create `components/booking/index.ts`
  - Export BookingForm
  - Export MultiStepForm
  - Export all step components
  - Export shared components
  - Export hooks
- [ ] Create `components/ui/index.ts`
  - Export all UI components

#### Step 4.2: Create Lib Barrel Exports
- [ ] Create `lib/index.ts`
  - Export storage functions
  - Export validation functions
  - Export auth functions
  - Export business logic (addons, coupons, photographers, etc.)
  - Export utilities

#### Step 4.3: Update Imports
- [ ] Update imports in app/ pages
- [ ] Update imports in API routes
- [ ] Update imports in other components
- [ ] Use search-replace for common patterns

#### Step 4.4: Add JSDoc Comments
- [ ] Document exported functions
- [ ] Add usage examples
- [ ] Improve developer experience

### Expected Outcomes
- Cleaner, shorter imports
- Better encapsulation
- Easier refactoring (implementation details hidden)
- Improved tree-shaking

---

## Priority 5: Build UI Component Library 🟡 MEDIUM

### Current State

**Only 2 components in `components/ui/`**:
- Logo.tsx
- ValidationMessage.tsx

**Problem**: Common UI patterns (buttons, inputs, cards) defined in global CSS without reusable React components

### Target Structure

```
components/ui/
├── index.ts                          # Barrel export
├── Button/
│   ├── Button.tsx                    # Button component
│   ├── Button.types.ts               # Type definitions
│   └── index.ts
├── Input/
│   ├── Input.tsx                     # Text input
│   ├── TextArea.tsx                  # Text area
│   ├── Select.tsx                    # Select dropdown
│   ├── Checkbox.tsx                  # Checkbox
│   ├── Radio.tsx                     # Radio button
│   ├── Input.types.ts
│   └── index.ts
├── Card/
│   ├── Card.tsx                      # Card container
│   ├── CardHeader.tsx                # Card header
│   ├── CardBody.tsx                  # Card body
│   ├── CardFooter.tsx                # Card footer
│   ├── Card.types.ts
│   └── index.ts
├── Modal/
│   ├── Modal.tsx                     # Modal wrapper
│   ├── ModalHeader.tsx               # Modal header
│   ├── ModalBody.tsx                 # Modal body
│   ├── ModalFooter.tsx               # Modal footer
│   ├── Modal.types.ts
│   └── index.ts
├── Table/
│   ├── Table.tsx                     # Table wrapper
│   ├── TableHeader.tsx               # Table header
│   ├── TableBody.tsx                 # Table body
│   ├── TableRow.tsx                  # Table row
│   ├── TableCell.tsx                 # Table cell
│   ├── Table.types.ts
│   └── index.ts
├── Badge/
│   ├── Badge.tsx                     # Badge/tag component
│   ├── StatusBadge.tsx               # Status indicator
│   ├── Badge.types.ts
│   └── index.ts
├── Alert/
│   ├── Alert.tsx                     # Alert message
│   ├── Alert.types.ts
│   └── index.ts
├── Loading/
│   ├── Spinner.tsx                   # Loading spinner
│   ├── Skeleton.tsx                  # Skeleton loader
│   ├── Loading.types.ts
│   └── index.ts
├── Form/
│   ├── FormField.tsx                 # Form field wrapper
│   ├── FormLabel.tsx                 # Form label
│   ├── FormError.tsx                 # Error message
│   ├── Form.types.ts
│   └── index.ts
├── Logo.tsx                          # Existing
└── ValidationMessage.tsx             # Existing
```

### Component Specifications

#### Button Component
**Variants**: primary, secondary, success, danger, warning, ghost
**Sizes**: sm, md, lg
**States**: default, hover, active, disabled, loading
**Props**: onClick, type, disabled, loading, icon, fullWidth

#### Input Components
**Types**: text, email, password, number, tel, url, date, time
**States**: default, focus, error, disabled
**Props**: value, onChange, placeholder, error, disabled, required

#### Card Component
**Variants**: default, outlined, elevated
**Props**: title, subtitle, actions, onClick

#### Modal Component
**Sizes**: sm, md, lg, xl, fullscreen
**Props**: isOpen, onClose, title, closable, footer

#### Table Component
**Features**: sorting, pagination, row selection, custom cells
**Props**: data, columns, sortable, selectable, onRowClick

### Implementation Steps

#### Step 5.1: Design System Audit
- [ ] Review current global CSS
- [ ] Identify all button styles
- [ ] Identify all input styles
- [ ] Identify all card patterns
- [ ] Identify color palette
- [ ] Identify spacing system
- [ ] Document design tokens

#### Step 5.2: Create Base Components
- [ ] Button component with all variants
- [ ] Input component with all types
- [ ] TextArea component
- [ ] Select component
- [ ] Checkbox component
- [ ] Radio component

#### Step 5.3: Create Layout Components
- [ ] Card component family
- [ ] Modal component family
- [ ] Table component family

#### Step 5.4: Create Feedback Components
- [ ] Badge component
- [ ] StatusBadge component
- [ ] Alert component
- [ ] Spinner component
- [ ] Skeleton loader

#### Step 5.5: Create Form Components
- [ ] FormField wrapper
- [ ] FormLabel component
- [ ] FormError component
- [ ] FormGroup component

#### Step 5.6: Migrate Existing Components
- [ ] Replace inline buttons with Button component
- [ ] Replace inline inputs with Input components
- [ ] Replace inline cards with Card component
- [ ] Replace inline modals with Modal component
- [ ] Replace inline tables with Table component

#### Step 5.7: Documentation
- [ ] Create Storybook or component showcase
- [ ] Document all props
- [ ] Add usage examples
- [ ] Create design guidelines

### Expected Outcomes
- Consistent UI across entire application
- Reusable, tested components
- Faster feature development
- Better accessibility
- Easier theming
- Smaller bundle size (shared components)

---

## Priority 6: Add Testing Infrastructure 🟡 MEDIUM

### Current State
- **Zero test files**
- No testing framework configured
- Critical for maintainability as project grows

### Target Structure

```
├── __tests__/
│   ├── unit/                         # Unit tests
│   │   ├── lib/                      # Test lib functions
│   │   │   ├── storage.test.ts
│   │   │   ├── validation.test.ts
│   │   │   ├── auth.test.ts
│   │   │   └── coupons.test.ts
│   │   └── components/               # Test components
│   │       ├── Button.test.tsx
│   │       ├── BookingForm.test.tsx
│   │       └── AdminDashboard.test.tsx
│   ├── integration/                  # Integration tests
│   │   └── api/                      # Test API routes
│   │       ├── bookings.test.ts
│   │       ├── services.test.ts
│   │       └── auth.test.ts
│   └── e2e/                          # End-to-end tests
│       ├── booking-flow.test.ts
│       ├── admin-dashboard.test.ts
│       └── user-management.test.ts
├── jest.config.js                    # Jest configuration
├── vitest.config.ts                  # Vitest configuration (alternative)
└── playwright.config.ts              # Playwright for E2E
```

### Testing Stack Recommendations

**Option 1: Jest + React Testing Library + Playwright**
- Jest for unit/integration tests
- React Testing Library for component tests
- Playwright for E2E tests
- **Pros**: Industry standard, great ecosystem
- **Cons**: Slower than Vitest

**Option 2: Vitest + React Testing Library + Playwright**
- Vitest for unit/integration tests (faster than Jest)
- React Testing Library for component tests
- Playwright for E2E tests
- **Pros**: Faster, better Vite integration
- **Cons**: Newer, smaller ecosystem

**Recommended**: Option 2 (Vitest) for modern stack

### Implementation Steps

#### Step 6.1: Install Dependencies
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @vitejs/plugin-react \
  @playwright/test msw
```

#### Step 6.2: Configure Vitest
- [ ] Create `vitest.config.ts`
- [ ] Configure test environment (jsdom)
- [ ] Configure path aliases (@/)
- [ ] Configure coverage reporting
- [ ] Add test scripts to package.json

#### Step 6.3: Configure Playwright
- [ ] Create `playwright.config.ts`
- [ ] Configure base URL
- [ ] Configure browsers
- [ ] Set up test database

#### Step 6.4: Write Core Lib Tests
- [ ] Test storage functions (CRUD operations)
- [ ] Test validation schemas (Zod)
- [ ] Test auth functions
- [ ] Test coupon logic
- [ ] Test date utilities
- [ ] Target: 80% coverage for lib/

#### Step 6.5: Write Component Tests
- [ ] Test UI components (Button, Input, etc.)
- [ ] Test booking form steps
- [ ] Test admin dashboard sections
- [ ] Test form validation
- [ ] Target: 60% coverage for components/

#### Step 6.6: Write API Tests
- [ ] Test bookings API
- [ ] Test services API
- [ ] Test auth API
- [ ] Test error handling
- [ ] Test rate limiting
- [ ] Use MSW for API mocking

#### Step 6.7: Write E2E Tests
- [ ] Test complete booking flow
- [ ] Test admin login → dashboard
- [ ] Test CRUD operations in admin
- [ ] Test payment flow
- [ ] Test error scenarios

#### Step 6.8: CI/CD Integration
- [ ] Add GitHub Actions workflow
- [ ] Run tests on PR
- [ ] Generate coverage reports
- [ ] Block merge if tests fail

### Expected Outcomes
- Confidence in code changes
- Catch bugs before production
- Better code design (testable code)
- Documentation through tests
- Faster debugging

### Test Coverage Goals
- **Phase 1**: 50% overall coverage
- **Phase 2**: 70% overall coverage
- **Phase 3**: 80%+ overall coverage

---

## Priority 7: Migrate JSON to SQLite 🟢 LOW

### Current State

**Mixed data storage**:
- SQLite for bookings (`data/bookings.db`)
- JSON files for services (`data/services.json`)
- Backblaze B2 for images

**Problems**:
- Inconsistent data access patterns
- No transactions across services
- Hard to maintain referential integrity
- JSON files don't scale well

### Target State

**Unified SQLite database**:
```
data/
└── ceritakita.db                     # Single database file
    ├── bookings (existing table)
    ├── services (new table)
    ├── photographers (new table)
    ├── addons (new table)
    ├── payment_methods (new table)
    ├── coupons (new table)
    ├── coupon_usage (new table)
    ├── portfolio (new table)
    ├── settings (new table)
    ├── users (new table)
    └── meta_ads_history (new table)
```

### Schema Design

```sql
-- Services table
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price INTEGER NOT NULL,
  discount_value INTEGER DEFAULT 0,
  discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed')),
  is_active INTEGER DEFAULT 1,
  badge_text TEXT,
  badge_color TEXT,
  image_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Photographers table
CREATE TABLE photographers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Addons table
CREATE TABLE addons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods table
CREATE TABLE payment_methods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  account_number TEXT,
  account_name TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Coupons table
CREATE TABLE coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TEXT,
  valid_until TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Coupon usage table
CREATE TABLE coupon_usage (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL,
  booking_id TEXT NOT NULL,
  used_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Portfolio table
CREATE TABLE portfolio (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT CHECK(type IN ('string', 'number', 'boolean', 'json')),
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Meta Ads history table
CREATE TABLE meta_ads_history (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  campaign_id TEXT,
  campaign_name TEXT,
  synced_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX idx_meta_ads_date ON meta_ads_history(date);
```

### Implementation Steps

#### Step 7.1: Database Migration Setup
- [ ] Create migration system (simple versioning)
- [ ] Create `lib/migrations/` directory
- [ ] Create migration runner utility

#### Step 7.2: Create Schema Migration
- [ ] Create `001_create_services_table.sql`
- [ ] Create `002_create_photographers_table.sql`
- [ ] Create `003_create_addons_table.sql`
- [ ] Create `004_create_payment_methods_table.sql`
- [ ] Create `005_create_coupons_tables.sql`
- [ ] Create `006_create_portfolio_table.sql`
- [ ] Create `007_create_settings_table.sql`
- [ ] Create `008_create_users_table.sql`
- [ ] Create `009_create_meta_ads_table.sql`

#### Step 7.3: Data Migration Scripts
- [ ] Migrate services.json → services table
- [ ] Migrate photographers.json → photographers table
- [ ] Migrate addons.json → addons table
- [ ] Migrate payment-methods.json → payment_methods table
- [ ] Migrate coupons.json → coupons table
- [ ] Migrate settings.json → settings table
- [ ] Verify data integrity

#### Step 7.4: Update Storage Functions
- [ ] Update `lib/storage-sqlite.ts` with new table functions
- [ ] Add getServices(), createService(), updateService(), deleteService()
- [ ] Add getPhotographers(), createPhotographer(), etc.
- [ ] Add getAddons(), createAddon(), etc.
- [ ] Add transaction support
- [ ] Add connection pooling

#### Step 7.5: Update API Routes
- [ ] Update `app/api/services/route.ts` to use SQLite
- [ ] Update `app/api/photographers/route.ts` to use SQLite
- [ ] Update `app/api/addons/route.ts` to use SQLite
- [ ] Update `app/api/payment-methods/route.ts` to use SQLite
- [ ] Update `app/api/coupons/route.ts` to use SQLite
- [ ] Update `app/api/settings/route.ts` to use SQLite
- [ ] Update `app/api/users/route.ts` to use SQLite

#### Step 7.6: Testing
- [ ] Test all CRUD operations
- [ ] Test transactions
- [ ] Test referential integrity
- [ ] Test performance with large datasets
- [ ] Test concurrent access

#### Step 7.7: Cleanup
- [ ] Remove JSON file reads from lib/
- [ ] Archive old JSON files
- [ ] Update documentation

### Expected Outcomes
- Single source of truth for data
- ACID transactions
- Better performance
- Referential integrity
- Easier to backup
- Better query capabilities (JOIN, aggregations)

### Migration Timeline
- **Phase 1**: Create tables, keep JSON (parallel systems)
- **Phase 2**: Dual-write to both SQLite and JSON
- **Phase 3**: Switch reads to SQLite
- **Phase 4**: Remove JSON writes
- **Phase 5**: Archive JSON files

---

## Additional Recommendations

### File Naming Standardization

**Current inconsistency in lib/**:
- kebab-case: `file-storage.ts`, `auth-server.ts`, `rate-limit.ts`
- lowercase: `addons.ts`, `coupons.ts`, `photographers.ts`

**Recommended standard**: kebab-case for all utility files, lowercase for domain logic

```
lib/
├── domain/                           # Business logic (lowercase)
│   ├── addons.ts
│   ├── coupons.ts
│   ├── photographers.ts
│   └── payment-methods.ts
└── infrastructure/                   # Utilities (kebab-case)
    ├── file-storage.ts
    ├── auth-server.ts
    ├── rate-limit.ts
    └── logger.ts
```

### API Route Standardization

**Current inconsistency**:
- Some use `/api/resource?id=X`
- Some use `/api/resource/[id]`
- Some use `/api/resource/update` instead of PUT

**Recommended standard**: Follow RESTful conventions

```
GET    /api/bookings           # List
POST   /api/bookings           # Create
GET    /api/bookings/[id]      # Get single
PUT    /api/bookings/[id]      # Update
DELETE /api/bookings/[id]      # Delete
POST   /api/bookings/[id]/reschedule  # Custom action
```

### Error Handling Standardization

**Create consistent error response format**:

```typescript
// lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

// Standard response
{
  success: false,
  error: {
    message: "Booking not found",
    code: "BOOKING_NOT_FOUND",
    statusCode: 404
  }
}
```

### Add Error Boundaries

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  // Catch React errors
}

// app/layout.tsx
<ErrorBoundary>
  <Providers>
    {children}
  </Providers>
</ErrorBoundary>
```

### Add API Client Abstraction

```typescript
// lib/api/client.ts
export class ApiClient {
  async get<T>(url: string): Promise<T>
  async post<T>(url: string, data: any): Promise<T>
  async put<T>(url: string, data: any): Promise<T>
  async delete<T>(url: string): Promise<T>
}

// Usage in components
const api = useApi();
const bookings = await api.get('/api/bookings');
```

### Add Request/Response Validation

```typescript
// Use Zod schemas for API validation
import { z } from 'zod';

const CreateBookingSchema = z.object({
  serviceId: z.string(),
  date: z.string(),
  // ...
});

// In API route
const body = CreateBookingSchema.parse(await request.json());
```

### Performance Monitoring

```typescript
// lib/monitoring/performance.ts
export function measureApiPerformance(route: string) {
  const start = Date.now();
  return () => {
    const duration = Date.now() - start;
    logger.info(`API ${route} took ${duration}ms`);
  };
}
```

### Add Database Indexes

After migration to SQLite, add performance indexes:

```sql
-- Frequently queried fields
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_bookings_photographer_id ON bookings(photographer_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_services_is_active ON services(is_active);
```

---

## Implementation Timeline (Suggested)

### Week 1-2: Critical Refactoring
- [ ] Priority 1: Break down AdminDashboard.tsx
- [ ] Priority 2: Consolidate step components

### Week 3: Type System & Exports
- [ ] Priority 3: Centralize type definitions
- [ ] Priority 4: Add barrel exports

### Week 4-5: UI Component Library
- [ ] Priority 5: Build UI component library (base components)
- [ ] Priority 5: Migrate existing components to use library

### Week 6-7: Testing Infrastructure
- [ ] Priority 6: Set up testing framework
- [ ] Priority 6: Write core tests (lib, components, API)
- [ ] Priority 6: Set up CI/CD

### Week 8: Database Migration (Optional)
- [ ] Priority 7: Migrate JSON to SQLite
- [ ] Priority 7: Update all API routes

### Week 9-10: Polish & Documentation
- [ ] File naming standardization
- [ ] API route standardization
- [ ] Error handling improvements
- [ ] Documentation updates
- [ ] Performance optimization

---

## Success Metrics

### Code Quality Metrics
- [ ] AdminDashboard.tsx: 79KB → <5KB
- [ ] Average component size: <500 lines
- [ ] Test coverage: >70%
- [ ] TypeScript strict mode: enabled
- [ ] Zero ESLint errors
- [ ] Zero console warnings in production

### Developer Experience Metrics
- [ ] Import path depth: reduced by 50%
- [ ] Build time: <30 seconds
- [ ] Hot reload time: <1 second
- [ ] Time to find a component: <10 seconds

### Performance Metrics
- [ ] Lighthouse score: >90
- [ ] First Contentful Paint: <1.5s
- [ ] Time to Interactive: <3s
- [ ] Bundle size: <500KB

---

## Risk Assessment

### High Risk Items
1. **AdminDashboard refactoring**: High complexity, potential for bugs
   - **Mitigation**: Incremental approach, extensive testing
2. **Type migration**: Breaking changes across codebase
   - **Mitigation**: Use TypeScript compiler to catch errors

### Medium Risk Items
3. **Database migration**: Data loss potential
   - **Mitigation**: Backup data, dual-write period, rollback plan
4. **Component consolidation**: Potential feature breakage
   - **Mitigation**: Thorough testing of booking flow

### Low Risk Items
5. **Barrel exports**: Low risk, high reward
6. **UI component library**: Isolated, can be done incrementally

---

## Rollback Plans

### Priority 1 Rollback
- Keep original `AdminDashboard.tsx` as `AdminDashboard.backup.tsx`
- Git branch for refactoring
- Easy to revert if issues found

### Priority 3 Rollback
- Keep old type files until migration complete
- Use Git to revert if type errors

### Priority 7 Rollback
- Keep JSON files as backup
- Dual-write period allows quick rollback
- Database backups before migration

---

## Notes for Future Developer

- This roadmap was created on 2025-12-31
- Analysis was done using codebase exploration agent (ID: ae64e7e)
- Current codebase: ~20,485 lines TypeScript, 105 files
- Architecture score: 7/10 (solid foundation, needs refactoring)
- Contact points: AdminDashboard.tsx is main concern
- Testing is critical gap
- Type system is good but scattered

**Priorities**: Focus on Priority 1-2 first (critical), then 3-4 (high), then others (medium/low)

**Philosophy**: Incremental improvements, avoid big-bang rewrites, maintain backward compatibility during migrations

---

## Appendix: Current Codebase Statistics

### File Count by Directory
- `app/`: 50 files
- `components/`: 81 files
- `lib/`: 27 files
- `utils/`: 1 file
- Total TypeScript: 105 files

### Lines of Code by Directory
- `app/`: ~4,200 lines
- `components/`: ~14,500 lines
- `lib/`: ~1,785 lines
- Total: ~20,485 lines

### Largest Files
1. `components/admin/AdminDashboard.tsx`: 79KB (~2,500 lines)
2. `components/booking/MultiStepBookingForm.tsx`: ~800 lines
3. `lib/storage-sqlite.ts`: ~400 lines

### API Endpoints
- Total: 33 API routes
- Auth: 2 routes
- Resources: 15 routes
- Custom actions: 16 routes

### Component Breakdown
- Admin components: 23 files
- Booking components: 24 files
- Shared components: 34 files

---

**END OF ROADMAP**

For questions or clarifications, refer to the codebase exploration agent ID: ae64e7e
