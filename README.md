# CeritaKita Booking App

A comprehensive booking management system for photography services with admin dashboard, payment tracking, and file upload capabilities.

## Features

### Admin Dashboard
- **Real-time Metrics**: View total bookings, active sessions, and revenue statistics
- **Calendar View**: Visual timeline of all bookings using FullCalendar
- **Status Management**: Track bookings through different stages (Active, Completed, Cancelled)
- **Search & Filter**: Quickly find bookings by customer name, WhatsApp, or booking ID

### Booking Management
- **Customer Information**: Store customer details including name, WhatsApp contact, and service category
- **Event Details**: Track booking dates, locations, and special notes
- **Service Categories**: Indoor, Outdoor, Wedding, Birthday, and more
- **Multi-payment Tracking**: Record multiple payments per booking with proof uploads

### Payment Tracking
- **Payment History**: Track all payments with dates, amounts, and notes
- **Payment Proofs**: Upload and store payment proof images (JPEG, PNG, GIF, WebP)
- **Financial Overview**: Automatic calculation of total paid vs. total price
- **Remaining Balance**: Real-time balance calculations

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
│   │   └── uploads/       # File serving endpoint
│   ├── login/             # Login page
│   └── page.tsx           # Landing page
├── components/
│   ├── AdminDashboard.tsx     # Main dashboard with calendar
│   ├── BookingForm.tsx        # Booking creation/edit form
│   ├── DashboardMetrics.tsx   # Statistics cards
│   └── Providers.tsx          # NextAuth provider wrapper
├── lib/
│   ├── auth.ts           # Authentication utilities
│   ├── file-storage.ts   # File upload/storage handling
│   ├── storage.ts        # Database operations (file-based)
│   └── validation.ts     # Zod schemas
├── data/
│   ├── db.txt           # Booking database (JSON)
│   └── services.json    # Service categories
└── uploads/
    └── payment-proofs/  # Uploaded payment proof images
```

## Database

Uses **SQLite** for reliable, ACID-compliant data storage with proper transactions and foreign key constraints.

### Database Schema

The application uses two main tables:
- **bookings**: Stores booking information (customer, dates, status, pricing)
- **payments**: Stores payment records (linked to bookings via foreign key)

For detailed schema and migration information, see [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md).

### Booking Data Structure

```typescript
{
  id: string;              // UUID
  created_at: string;      // ISO timestamp
  status: "Active" | "Completed" | "Cancelled";
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
  };
}
```

## API Endpoints

- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - List all bookings
- `POST /api/bookings/update` - Update existing booking
- `GET /api/services` - Get service categories
- `GET /api/uploads/[...path]` - Serve uploaded files (authenticated)

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
