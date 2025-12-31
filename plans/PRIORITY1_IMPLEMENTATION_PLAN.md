# Priority 1 Implementation Plan: AdminDashboard.tsx Breakdown

## Current Status
- **File**: `components/admin/AdminDashboard.tsx`
- **Size**: 1,256 lines (79KB)
- **Progress**: 15% complete (modals extracted but not integrated)

## Implementation Steps

### Step 1: Update Imports
Add the following imports to `components/admin/AdminDashboard.tsx`:

```typescript
// Add these imports after existing modal imports
import { BookingDetailModal } from './Bookings/modals/BookingDetailModal';
import { RescheduleModal } from './Bookings/modals/RescheduleModal';
import { CreateBookingModal } from './Bookings/modals/CreateBookingModal';
```

### Step 2: Replace Booking Detail Modal (Lines 560-926)
**Current**: Inline modal code (366 lines)
**Target**: Replace with component usage

**Remove lines 560-926** and **replace with**:

```typescript
<BookingDetailModal
  booking={bookingsHook.selectedBooking}
  photographers={photographersHook.photographers}
  onClose={() => bookingsHook.setSelectedBooking(null)}
  onDelete={bookingsHook.handleDeleteBooking}
  onUpdateStatus={bookingsHook.handleUpdateStatus}
  onUpdate={bookingsHook.handleUpdate}
  onUpdateFinance={bookingsHook.handleUpdateFinance}
  onOpenRescheduleModal={handleOpenRescheduleModal}
  calculateFinance={bookingsHook.calculateFinance}
  getOrReconstructBreakdown={bookingsHook.getOrReconstructBreakdown}
/>
```

### Step 3: Replace Reschedule Modal (Lines 928-1002)
**Current**: Inline modal code (74 lines)
**Target**: Replace with component usage

**Remove lines 928-1002** and **replace with**:

```typescript
<RescheduleModal
  isOpen={bookingsHook.isRescheduleModalOpen}
  onClose={() => bookingsHook.setIsRescheduleModalOpen(false)}
  onSubmit={handleReschedule}
  formData={bookingsHook.rescheduleFormData}
  setFormData={bookingsHook.setRescheduleFormData}
/>
```

### Step 4: Replace Create Booking Modal (Lines 1004-1251)
**Current**: Inline modal code (247 lines)
**Target**: Replace with component usage

**Remove lines 1004-1251** and **replace with**:

```typescript
<CreateBookingModal
  isOpen={bookingsHook.isCreateBookingModalOpen}
  onClose={() => bookingsHook.setIsCreateBookingModalOpen(false)}
  onSubmit={handleCreateBooking}
  formData={bookingsHook.bookingFormData}
  setFormData={bookingsHook.setBookingFormData}
  services={servicesHook.services}
  photographers={photographersHook.photographers}
  availableAddons={bookingsHook.availableBookingAddons}
  selectedAddons={bookingsHook.selectedBookingAddons}
  onServiceChange={handleServiceChange}
  onToggleAddon={toggleBookingAddon}
  onUpdateAddonQuantity={updateBookingAddonQuantity}
  calculateTotal={calculateBookingTotal}
/>
```

## Expected Results

### File Size Reduction
- **Before**: 1,256 lines
- **After**: ~900 lines (28% reduction)
- **Lines Removed**: ~356 lines of modal code

### Component Structure
```
components/admin/
├── AdminDashboard.tsx          # ~900 lines (orchestrator)
├── Bookings/
│   └── modals/
│       ├── BookingDetailModal.tsx    # 370 lines (extracted)
│       ├── RescheduleModal.tsx       # 78 lines (extracted)
│       └── CreateBookingModal.tsx    # 280 lines (extracted)
```

## Testing Checklist

After implementing these changes, test:

- [ ] Booking creation from "Create Booking" button works
- [ ] Booking detail modal opens when clicking a booking
- [ ] Status updates work in booking detail
- [ ] Photographer assignment works
- [ ] Payment addition works
- [ ] Reschedule button opens reschedule modal
- [ ] Rescheduling a booking works
- [ ] Delete booking works (except for completed bookings)
- [ ] All modals close properly
- [ ] No TypeScript errors
- [ ] No console errors

## Next Steps After Priority 1

Once Priority 1 is complete, move to:
1. **Priority 2**: Consolidate Step Components
2. **Priority 3**: Centralize Type Definitions
3. **Priority 4**: Add Barrel Exports

## Notes

- Keep all existing handler functions in AdminDashboard.tsx
- Pass necessary state and handlers as props to modals
- Maintain existing business logic in hooks
- No changes to existing hooks or tables
- This is a safe refactoring that maintains functionality