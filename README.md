# CeritaKita Booking App

A comprehensive booking management system for photography services with admin dashboard, payment tracking, and file upload capabilities.

## Features

### Admin Dashboard
- **Real-time Metrics**: View total bookings, active sessions, and revenue statistics
- **Calendar View**: Visual timeline of all bookings using FullCalendar
- **Status Management**: Track bookings through different stages (Active, Completed, Cancelled, Rescheduled)
- **Unified Active View**: Active and Rescheduled bookings displayed together with visual indicators
- **Search & Filter**: Quickly find bookings by customer name, WhatsApp, or booking ID
- **Smart Booking Order**: Bookings sorted by session date proximity to today (nearest sessions first)
- **Detailed Price Breakdown**: View complete pricing breakdown including service base price, add-ons, discounts, and coupons
- **Payment Progress Tracking**: Visual payment progress with down payment, total paid, remaining balance, and progress bar
- **Secure Logout**: Proper session termination with automatic redirect to login page

### Booking Management
- **Customer Information**: Store customer details including name, WhatsApp contact, and service category
- **Event Details**: Track booking dates, locations, and special notes
- **Smart Time Picker**: 24-hour format with 30-minute increments (dropdown selection)
- **Service Categories**: Indoor, Outdoor, Wedding, Birthday, and more
- **Add-ons System**: Select and configure additional services with quantity management
- **Coupon System**: Apply discount coupons with flash sale support and automatic suggestions
- **Multi-payment Tracking**: Record multiple payments per booking with proof uploads
- **Photographer Assignment**: Assign photographers to bookings with specialty tracking
- **Reschedule Management**: Track reschedule history with reasons and timestamps

### Payment Tracking
- **Payment History**: Track all payments with dates, amounts, and notes
- **Payment Proofs**: Upload and store payment proof images (JPEG, PNG, GIF, WebP)
- **Down Payment Display**: Clear visibility of down payment (DP) in both booking form and admin dashboard
- **Remaining Balance**: Real-time balance calculations displayed prominently in order summary and admin dashboard
- **Payment Progress Visualization**: Progress bar showing payment completion percentage
- **Detailed Price Breakdown**: Complete transparency with itemized pricing
  - Service base price (before discount)
  - Add-ons total (individual prices hidden in admin view for cleaner display)
  - Base discount (service package discount)
  - Coupon discount (with coupon code tracking)
  - Grand total with negative prevention
- **Financial Overview**: Automatic calculation of total paid vs. total price
- **Excel Export**: Export bookings and financial reports to Excel format

### Security Features
- **Authentication**: NextAuth.js integration with secure session management
- **File Validation**:
  - Maximum file size: 5MB
  - Allowed formats: JPEG, PNG, GIF, WebP
  - Path traversal protection
- **Input Validation**: Zod schema validation for all API endpoints
- **Rate Limiting**: File locking mechanism to prevent race conditions

## Tech Stack

- **Framework**: Next.js 14.2.35 (App Router)
- **Database**: SQLite (better-sqlite3)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide React icons
- **Calendar**: FullCalendar
- **Charts**: Recharts
- **Validation**: Zod
- **File Handling**: Formidable
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Edit `.env.local` and configure:
   - `ADMIN_USERNAME` - Admin login username
   - `ADMIN_PASSWORD` - Admin login password
   - `NEXTAUTH_URL` - Your application URL
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── admin/              # Admin dashboard page
│   ├── api/
│   │   ├── auth/          # NextAuth routes
│   │   ├── bookings/      # Booking CRUD operations
│   │   ├── services/      # Service category endpoints
│   │   ├── photographers/ # Photographer management
│   │   ├── addons/        # Add-ons management
│   │   ├── coupons/       # Coupon management & validation
│   │   ├── export/        # Excel export endpoints
│   │   └── uploads/       # File serving endpoint
│   ├── login/             # Login page
│   └── page.tsx           # Landing page with booking form
├── components/
│   ├── AdminDashboard.tsx     # Main dashboard with calendar & tables
│   ├── BookingForm.tsx        # Customer booking form with price breakdown
│   ├── DashboardMetrics.tsx   # Statistics cards with charts
│   ├── CouponManagement.tsx   # Coupon CRUD interface
│   └── Providers.tsx          # NextAuth provider wrapper
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── file-storage.ts   # File upload/storage handling
│   ├── storage.ts        # Database operations (file-based)
│   ├── storage-sqlite.ts # SQLite database operations
│   ├── validation.ts     # Zod schemas
│   ├── photographers.ts  # Photographer management
│   ├── addons.ts         # Add-ons management
│   ├── coupons.ts        # Coupon management & validation
│   └── export.ts         # Excel export utilities
├── data/
│   ├── bookings.db      # SQLite database
│   ├── services.json    # Service categories
│   └── db.txt          # Legacy JSON database (deprecated)
└── uploads/
    └── payment-proofs/  # Uploaded payment proof images
```

## Price Calculation Formula

The system uses a transparent pricing model with detailed breakdown:

```
Grand Total = (Service Base Price + Add-ons Total) - Base Discount - Coupon Discount
```

**Components:**
- **Service Base Price**: Original service price before any discounts
- **Add-ons Total**: Sum of all selected add-ons × quantities
- **Base Discount**: Service package discount (e.g., promotional pricing)
- **Coupon Discount**: Applied coupon discount (percentage or fixed amount)
- **Negative Prevention**: Total cannot go below zero (`Math.max(0, total)`)

**Price Validation:**
- Frontend calculates breakdown and sends to backend
- Backend validates by recalculating using same formula
- All components stored in database for audit trail
- Admin dashboard displays complete breakdown for transparency

## Database

Uses **SQLite** for reliable, ACID-compliant data storage with proper transactions and foreign key constraints.

### Database Schema

The application uses two main tables:
- **bookings**: Stores booking information (customer, dates, status, pricing)
- **payments**: Stores payment records (linked to bookings via foreign key)

### Booking Sort Order

Bookings are retrieved from the database sorted by session date proximity to today:
```sql
ORDER BY ABS(julianday(booking_date) - julianday("now")) ASC
```
This ensures bookings with sessions nearest to the current date (whether upcoming or recent past) appear first in all views.

For detailed schema and migration information, see [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md).

### Booking Data Structure

```typescript
{
  id: string;              // UUID
  created_at: string;      // ISO timestamp
  status: "Active" | "Completed" | "Cancelled" | "Rescheduled";
  customer: {
    name: string;
    whatsapp: string;
    category: string;
  };
  booking: {
    date: string;          // ISO datetime
    notes: string;
    location_link: string;
  };
  finance: {
    total_price: number;
    payments: Array<{
      date: string;
      amount: number;
      note: string;
      proof_filename?: string;  // Relative path to uploaded image
    }>;
    // Price breakdown (for transparency and audit)
    service_base_price?: number;  // Service price before discount
    base_discount?: number;       // Service discount value
    addons_total?: number;        // Total from all add-ons
    coupon_discount?: number;     // Coupon discount applied
    coupon_code?: string;         // Coupon code used
  };
  photographer_id?: string;       // Assigned photographer
  addons?: Array<{               // Selected add-ons
    addon_id: string;
    addon_name: string;
    quantity: number;
    price_at_booking: number;
  }>;
  reschedule_history?: Array<{   // Reschedule tracking
    old_date: string;
    new_date: string;
    rescheduled_at: string;
    reason?: string;
  }>;
}
```

## API Endpoints

### Bookings
- `POST /api/bookings` - Create new booking with price validation
- `GET /api/bookings` - List all bookings
- `PUT /api/bookings/update` - Update existing booking
- `POST /api/bookings/reschedule` - Reschedule booking with history tracking

### Configuration
- `GET /api/services` - Get service categories
- `POST /api/services` - Update service categories
- `GET /api/photographers` - Get photographers list
- `POST /api/photographers` - Create photographer
- `PUT /api/photographers` - Update photographer
- `DELETE /api/photographers` - Delete photographer
- `GET /api/addons` - Get add-ons list (with category filtering)
- `POST /api/addons` - Create add-on
- `PUT /api/addons` - Update add-on
- `DELETE /api/addons` - Delete add-on
- `GET /api/coupons` - Get coupons list
- `POST /api/coupons` - Create coupon
- `PUT /api/coupons` - Update coupon
- `DELETE /api/coupons` - Delete coupon
- `POST /api/coupons/validate` - Validate coupon code
- `POST /api/coupons/suggestions` - Get coupon suggestions based on total

### Files & Export
- `GET /api/uploads/[...path]` - Serve uploaded files (authenticated)
- `GET /api/export/bookings` - Export bookings to Excel
- `GET /api/export/financial` - Export financial report to Excel

## Security Considerations

1. **Authentication Required**: All admin routes protected by NextAuth
2. **File Upload Security**:
   - File type validation
   - Size limits enforced
   - Secure filename generation
   - Directory traversal prevention
3. **Input Validation**: All API inputs validated with Zod schemas
4. **Environment Variables**: Sensitive data stored in `.env.local` (not committed)

## Migration Scripts

### SQLite Migration
If you have existing data in the old JSON format, migrate to SQLite:

```bash
npx tsx scripts/migrate-to-sqlite.ts
```

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for detailed instructions.

### Image Migration
Migrate base64-encoded images to file storage:

```bash
npx tsx scripts/migrate-images.ts
```

This creates a backup and converts all base64 payment proofs to separate image files.

## License

Private project for CeritaKita photography services.
