# Barrel Exports Guide

This document outlines the barrel export patterns implemented across the CeritaKita Booking project to enable clean, centralized imports.

## Overview

Barrel exports allow importing from a single entry point (typically an `index.ts` file) instead of deep imports. This improves code maintainability, reduces import clutter, and provides a clear API surface for each module.

## Available Barrel Exports

### 1. `@/components/admin`
**Location:** `components/admin/index.ts`
**Exports:** All admin components, hooks, tables, and modals.

```typescript
// ✅ Clean import
import { useBookings, useServices, BookingsTable } from '@/components/admin';

// ❌ Avoid deep imports
import { useBookings } from '@/components/admin/hooks/useBookings';
import { BookingsTable } from '@/components/admin/tables/BookingsTable';
```

**Available exports:**
- **Views:** `AdminDashboard`, `AdsPerformance`, `PaymentMethodsManagement`, `SettingsManagement`, `UserManagement`
- **Hooks:** `useAddons`, `useBookings`, `useExport`, `usePhotographers`, `useServices`
- **Tables:** `AddonsTable`, `BookingsTable`, `PhotographersTable`, `ServicesTable`
- **Modals:** `ServiceModal`, `BookingDetailModal`, `CreateBookingModal`, `RescheduleModal`

### 2. `@/components/booking`
**Location:** `components/booking/index.ts`
**Exports:** All booking-related components and steps.

```typescript
import { MultiStepBookingForm, ServiceSelection, AddonsSelection } from '@/components/booking';
```

**Available exports:**
- **Main components:** `BookingForm`, `MultiStepBookingForm`, `MultiStepFormProvider`, `useMultiStepForm`
- **Steps:** `ServiceSelection`, `AddonsSelection`, `PortfolioShowcase`, `CustomerInfo`, `ScheduleInfo`, `PaymentInfo`, `OrderSummary`
- **Components:** `Lightbox`, `CountdownTimer`, `PaymentDetails`

### 3. `@/components/ui`
**Location:** `components/ui/index.ts`
**Exports:** Reusable UI components.

```typescript
import { Logo, ValidationMessage } from '@/components/ui';
```

**Available exports:**
- `Logo`, `HeroLogo`, `MobileLogo`
- `ValidationMessage`

### 4. `@/lib`
**Location:** `lib/index.ts`
**Exports:** All library utilities, functions, and business logic.

```typescript
import { createBooking, validateBooking, getAllUsers } from '@/lib';
```

**Available exports:**
- Storage & database functions (`readData`, `createBooking`, etc.)
- Authentication utilities (`requireAuth`, `getSession`)
- Validation schemas
- File storage functions
- Coupon management
- Payment methods
- Photographer management
- Add-ons management
- Permissions
- Rate limiting
- CSRF protection
- Logging utilities
- Constants
- Type utilities
- Settings context
- Database connection
- File locking

### 5. `@/lib/types`
**Location:** `lib/types/index.ts`
**Exports:** All type definitions.

```typescript
import { Service, Booking, User } from '@/lib/types';
```

**Available exports:**
- All domain types (Service, Addon, Photographer, Booking, etc.)
- All utility types (ViewMode, FilterStatus, ApiResponse, etc.)

### 6. `@/utils`
**Location:** `utils/index.ts`
**Exports:** All utility functions.

```typescript
import { formatDate, formatDateTime } from '@/utils';
```

**Available exports:**
- Date formatting utilities (`formatDate`, `formatDateTime`, `formatTime`, `formatDateForInput`, `formatDateShort`)

## Migration Guide

### Updating Existing Imports

1. **Replace deep type imports:**
   ```typescript
   // Before
   import { User } from '@/lib/types/user';
   import { SystemSettings } from '@/lib/types/settings';
   
   // After
   import { User, SystemSettings } from '@/lib/types';
   ```

2. **Replace lib utility imports:**
   ```typescript
   // Before
   import { DEFAULT_STAFF_PERMISSIONS } from '@/lib/permissions-types';
   import { FILE_CONSTRAINTS } from '@/lib/constants';
   
   // After
   import { DEFAULT_STAFF_PERMISSIONS, FILE_CONSTRAINTS } from '@/lib';
   ```

3. **Replace utils imports:**
   ```typescript
   // Before
   import { formatDate } from '@/utils/dateFormatter';
   
   // After
   import { formatDate } from '@/utils';
   ```

### Adding New Exports

When adding new functionality to a module with barrel exports:

1. **Add export to the appropriate `index.ts` file**
2. **Update the documentation in this guide**
3. **Ensure the export follows existing patterns**

### Example: Adding a New UI Component

```typescript
// 1. Create your component
// components/ui/Button.tsx

export function Button() { /* ... */ }

// 2. Add export to components/ui/index.ts
// Add this line:
export { Button } from './Button';
```

## Best Practices

1. **Always use barrel exports** when importing from modules that have them
2. **Keep barrel files focused** - only export what's intended for public use
3. **Avoid circular dependencies** - barrel files should not import from each other in cycles
4. **Document new exports** with JSDoc comments in the barrel file
5. **Test imports** after adding new exports to ensure they work correctly

## Troubleshooting

### TypeScript Errors
If you encounter type errors after switching to barrel imports:
1. Check that the export exists in the barrel file
2. Verify the import path is correct
3. Ensure the barrel file exports the correct type

### Build Errors
If the build fails:
1. Check for circular dependencies
2. Verify all exports are properly defined
3. Ensure barrel files don't contain runtime code that breaks tree-shaking

### Performance Considerations
Barrel exports are optimized by Next.js and modern bundlers. However:
- Avoid exporting large modules unnecessarily
- Use named exports over wildcard exports (`export *`) for better tree-shaking
- Keep barrel files lightweight
