# Leads Management (Mini CRM) System - Implementation Plan

## Overview
This plan outlines the implementation of a Leads Management system within the Cerita Kita Admin Dashboard, following the user stories provided while maintaining library cleanliness and modular architecture.

## 1. Library Strategy

### New Type File: `lib/types/leads.ts`
Already created with comprehensive type definitions:
- **LeadStatus**: `'New' | 'Contacted' | 'Follow Up' | 'Won' | 'Lost' | 'Converted'`
- **LeadSource**: `'Meta Ads' | 'Organic' | 'Referral' | 'Instagram' | 'WhatsApp' | 'Phone Call' | 'Website Form' | 'Other'`
- **Lead**: Core interface with all lead properties (id, name, whatsapp, status, source, notes, booking_id, etc.)
- **LeadFormData**, **LeadUpdateData**, **LeadFilters**: For CRUD operations
- **Utility Functions**: `getLeadStatusColor()`, `getLeadSourceIcon()`, constant arrays for statuses/sources

### Integration with `lib/types/index.ts`
Already exported via clean addition:
```typescript
// Leads Types (new)
export type {
  Lead, LeadStatus, LeadSource, LeadFormData, LeadUpdateData, LeadFilters,
  getLeadStatusColor, getLeadSourceIcon, LEAD_STATUSES, LEAD_SOURCES
} from './leads';
```

### Database Schema Changes in `lib/db.ts`
**Additive and safe modifications** - will extend `initializeSchema()` function:

```sql
-- Leads table creation
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Core lead information
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  
  -- Lead tracking
  status TEXT NOT NULL CHECK(status IN ('New', 'Contacted', 'Follow Up', 'Won', 'Lost', 'Converted')),
  source TEXT NOT NULL CHECK(source IN ('Meta Ads', 'Organic', 'Referral', 'Instagram', 'WhatsApp', 'Phone Call', 'Website Form', 'Other')),
  notes TEXT,
  
  -- Assignment and conversion
  assigned_to TEXT,
  booking_id TEXT,
  converted_at TEXT,
  last_contacted_at TEXT,
  next_follow_up TEXT,
  
  -- Foreign key constraints
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);
```

**Migration safety**: Using `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` ensures no conflicts with existing schema.

## 2. API Structure

### New API Endpoints (RESTful design)

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| `GET` | `/api/leads` | List leads with filtering | Query params: `?status=New&source=Meta Ads&search=name` | `Lead[]` |
| `GET` | `/api/leads/:id` | Get single lead | - | `Lead` |
| `POST` | `/api/leads` | Create new lead | `LeadFormData` | `Lead` |
| `PUT` | `/api/leads/:id` | Update lead | `LeadUpdateData` | `Lead` |
| `PATCH` | `/api/leads/:id/status` | Update lead status | `{ status: LeadStatus }` | `Lead` |
| `DELETE` | `/api/leads/:id` | Delete lead | - | `{ success: true }` |
| `POST` | `/api/leads/:id/convert` | Convert lead to booking | `{ service_id?: string }` | `{ lead: Lead, booking: Booking }` |
| `GET` | `/api/leads/stats` | Get lead statistics | - | `{ byStatus: Record<LeadStatus, number>, bySource: Record<LeadSource, number> }` |

### File Structure
```
app/api/leads/
├── route.ts              # Main leads CRUD (GET, POST)
├── [id]/
│   └── route.ts         # Single lead operations (GET, PUT, DELETE)
├── [id]/status/
│   └── route.ts         # Status update (PATCH)
└── [id]/convert/
    └── route.ts         # Convert to booking (POST)
```

## 3. UI Components Reuse Strategy

### Leads Page (`/admin/leads`)
- **Location**: `app/admin/leads/page.tsx` (new)
- **Layout**: Reuse existing AdminSidebar and command bar patterns from `AdminDashboard.tsx`
- **View Mode**: Add `'leads'` to `ViewMode` type in `lib/types/common.ts`

### Leads Table Component
- **Base**: Adapt `BookingsTable.tsx` pattern with lead-specific columns
- **New Component**: `components/admin/tables/LeadsTable.tsx`
- **Columns**: Name, WhatsApp, Source, Status (badge), Date, Actions
- **Features**:
  - Status badges with color coding via `getLeadStatusColor()`
  - WhatsApp quick-action button (opens `wa.me/+...`)
  - "Convert to Booking" button (visible when status = 'Won')
  - Edit/Delete actions

### Lead Form Modal
- **Reuse**: Pattern from `ServiceModal.tsx`
- **New Component**: `components/admin/modals/LeadModal.tsx`
- **Fields**: Name, WhatsApp, Email, Source (dropdown), Status (dropdown), Notes, Next Follow-up date

### Status Pipeline Visualization
- **Visual Indicator**: Badge component reuse from booking status badges
- **Pipeline View**: Optional Kanban-style column view (future enhancement)

## 4. Conversion Logic for CreateBookingModal

### Pre-filling Mechanism
When converting a lead with status 'Won':
1. **Trigger**: Click "Convert to Booking" button in LeadsTable
2. **Action**: Opens existing `CreateBookingModal` with pre-filled data
3. **Data Flow**:
   ```typescript
   // In handleConvertToBooking(leadId)
   const lead = await fetch(`/api/leads/${leadId}`);
   const { name, whatsapp } = lead;
   
   // Set form data in bookingsHook
   bookingsHook.setBookingFormData({
     customer_name: name,
     customer_whatsapp: whatsapp,
     // Other fields remain default
     service_id: '',
     booking_date: '',
     booking_time: '',
     // ...
   });
   
   // Open modal
   bookingsHook.setIsCreateBookingModalOpen(true);
   ```

### Modal Props Extension
Current `CreateBookingModalProps` interface doesn't need modification - it already accepts `formData` and `setFormData`. However, we should enhance the modal to recognize when it's opened from a lead conversion:

**Optional enhancement**: Add `initialData` prop to `CreateBookingModal`:
```typescript
interface CreateBookingModalProps {
  // ... existing props
  initialData?: {
    customer_name?: string;
    customer_whatsapp?: string;
    // ... other pre-filled fields
  };
}
```

**Alternative**: Simpler approach - just pre-fill via `setBookingFormData` before opening modal (no modal changes needed).

### Post-Conversion Linking
After booking creation:
1. **Update Lead**: Call `PATCH /api/leads/:id` with:
   ```json
   {
     "status": "Converted",
     "booking_id": newBooking.id,
     "converted_at": new Date().toISOString()
   }
   ```
2. **UI Feedback**: Show success message with links to both lead and booking

## 5. Implementation Phases

### Phase 1: Foundation (Current)
- ✅ Create type definitions (`lib/types/leads.ts`)
- ✅ Export types (`lib/types/index.ts`)
- ✅ Database schema planning
- ✅ API endpoint design
- ✅ UI component planning
- ✅ Conversion logic planning

### Phase 2: Backend Implementation
1. Update `lib/db.ts` with leads table schema
2. Create API endpoints (`/api/leads/*`)
3. Add database CRUD operations in `lib/leads.ts` (new file)
4. Implement validation schemas in `lib/validation/schemas.ts`

### Phase 3: Frontend Implementation
1. Create Leads page (`app/admin/leads/page.tsx`)
2. Create LeadsTable component
3. Create LeadModal component
4. Add 'leads' view mode to AdminSidebar
5. Implement conversion logic in AdminDashboard

### Phase 4: Integration & Testing
1. Connect frontend to backend APIs
2. Test CRUD operations
3. Test conversion flow with CreateBookingModal
4. Add permissions checking (admin/staff access)
5. Add search/filter functionality

## 6. Technical Considerations

### Performance
- Indexes on frequently queried columns (status, source, created_at)
- Pagination for large lead lists
- Caching of lead statistics

### Security
- Authentication required for all lead endpoints
- Permission checking: `lead.view`, `lead.edit`, `lead.delete`
- Input validation for WhatsApp numbers, email formats

### Data Integrity
- Foreign key constraints (assigned_to → users, booking_id → bookings)
- Cascade updates when bookings are deleted
- Audit logging for lead status changes

### Migration Safety
- All schema changes are additive using `IF NOT EXISTS`
- Backward compatible - existing functionality unchanged
- Can be deployed incrementally

## 7. File Creation Checklist

### New Files Required:
- `lib/types/leads.ts` ✅
- `lib/leads.ts` (database operations)
- `app/api/leads/route.ts`
- `app/api/leads/[id]/route.ts`
- `app/api/leads/[id]/status/route.ts`
- `app/api/leads/[id]/convert/route.ts`
- `app/admin/leads/page.tsx`
- `components/admin/tables/LeadsTable.tsx`
- `components/admin/modals/LeadModal.tsx`

### Modified Files:
- `lib/types/index.ts` ✅
- `lib/db.ts` (schema addition)
- `lib/types/common.ts` (add 'leads' to ViewMode)
- `components/admin/AdminSidebar.tsx` (add leads navigation)
- `components/admin/index.ts` (export new components)

## 8. Success Criteria
- Admin can view leads table at `/admin/leads`
- Add new leads manually via form
- Update lead status through pipeline
- WhatsApp quick-action button works
- Convert 'Won' leads to bookings with pre-filled data
- All changes are additive and don't break existing functionality
- Library folder remains clean with modular structure

---

*This plan provides a clear roadmap for implementing the Leads Management system while respecting your library constraints and leveraging existing patterns.*