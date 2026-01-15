# CeritaKita Studio Booking System

A modern, accessible booking system for photography services built with Next.js 14 and SQLite.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.18+ 
- npm or yarn

### Installation
```bash
# Clone repository
git clone <your-repo-url>
cd ceritakita-booking

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 🛠 Tech Stack

- **Framework**: Next.js 14.2.35 (App Router)
- **Database**: SQLite (better-sqlite3)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Type Safety**: TypeScript
- **UI Components**: Custom with Lucide React icons
- **Calendar**: FullCalendar
- **Charts**: Recharts

## 📁 Project Structure

```
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth endpoints
│   │   ├── bookings/       # Booking CRUD
│   │   ├── services/       # Service management
│   │   ├── photographers/  # Photographer management
│   │   ├── addons/         # Add-ons management
│   │   ├── coupons/        # Coupon system
│   │   ├── export/         # Excel export
│   │   └── uploads/        # File serving
│   ├── admin/              # Admin dashboard
│   ├── login/              # Login page
│   └── page.tsx            # Landing page
├── components/              # React components
│   ├── admin/              # Admin components
│   ├── booking/            # Booking form components
│   └── ui/                 # UI utilities
├── lib/                    # Core utilities
│   ├── auth.ts            # Authentication
│   ├── storage-sqlite.ts  # SQLite operations
│   ├── validation.ts      # Zod schemas
│   ├── file-storage.ts    # File handling
│   ├── photographers.ts   # Photographer management
│   ├── addons.ts          # Add-ons management
│   ├── coupons.ts         # Coupon system
│   ├── export.ts          # Excel export
│   ├── logger.ts          # Logging
│   ├── rate-limit.ts      # Rate limiting
│   ├── csrf.ts            # CSRF protection
│   └── file-lock.ts       # Concurrent access
├── data/
│   ├── bookings.db        # SQLite database
│   └── services.json      # Service categories
├── public/                 # Static assets
└── uploads/               # Uploaded files
```

## 🔧 Configuration

### Environment Variables (.env.local)

```bash
# Required
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password

# Optional (Backblaze B2 - for portfolio images)
B2_APPLICATION_KEY_ID=your_key
B2_APPLICATION_KEY=your_secret
B2_BUCKET_ID=your_bucket
B2_BUCKET_NAME=your_bucket_name

# Optional (Meta Marketing API - for ads performance tracking)
META_ACCESS_TOKEN=your_meta_access_token
META_AD_ACCOUNT_ID=act_your_ad_account_id
META_API_VERSION=v19.0
```

**Note**: Portfolio images are stored in Backblaze B2. The B2 bucket domain is configured in `next.config.mjs` under `images.remotePatterns` to enable Next.js Image Optimization.

### Generate Secret
```bash
openssl rand -base64 32
```

### Portfolio Images Configuration

Portfolio images are served from Backblaze B2 and optimized through Next.js Image Optimization.

**Required Configuration in `next.config.mjs`:**
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'ceritakita-images.s3.eu-central-003.backblazeb2.com',
      port: '',
      pathname: '/**',
    },
  ],
}
```

If you change your B2 bucket or use a different image host, update the `hostname` accordingly.

## 📊 Database

### Schema
- **bookings**: Main booking records with pricing breakdown
- **payments**: Payment records linked to bookings

### Persistence
SQLite database is stored at `data/bookings.db`. Ensure this file persists across deployments.

### Backup
```bash
# Manual backup
cp data/bookings.db /backup/bookings.db.$(date +%Y%m%d)

# Automated (cron)
0 2 * * * cp /var/www/ceritakita-booking/data/bookings.db /backup/bookings.db.$(date +\%Y\%m\%d)
```

## 🔒 Security Features

- **Authentication**: NextAuth.js with JWT strategy
- **Rate Limiting**: Configurable per endpoint
- **CSRF Protection**: Token-based protection
- **Input Validation**: Zod schemas for all API endpoints
- **File Upload Security**: Type validation, size limits, secure filenames
- **Type Safety**: Complete TypeScript coverage

## 🎨 Features

### Admin Dashboard
- Real-time metrics and statistics with **trend indicators**
- Calendar view of bookings
- Status management (Active, Completed, Cancelled, Rescheduled)
- Search and filter capabilities
- Payment tracking with progress visualization
- Excel export for bookings and financial reports
- Meta Ads performance tracking with ROI analysis
- **Leads Management with Kanban Board** (drag-and-drop)
- **Universal Invoice System** with preview modal
- **Analytics Integration** (Google Analytics, Meta Pixel)

### Booking System
- Multi-step booking form with validation
- Service selection with categories and **upgrade path logic**
- Portfolio image gallery for each service (Backblaze B2 integration)
- Add-ons system with quantity management
- Coupon system with validation and suggestions
- Smart time picker (24h format, 30min increments)
- Payment proof uploads
- Reschedule management with history tracking
- **CSRF protection** on authenticated requests

### Leads Management (Mini CRM)
- **Kanban Board View**: Drag-and-drop lead status management
- **Table View**: Traditional list with search and filter
- Status Pipeline: New → Contacted → Qualified → Converted → Lost
- Customer data tracking: Name, phone, email, source, notes
- Follow-up system with reminders
- Convert leads directly to bookings

### Invoice System
- **Universal Invoice Template**: Consistent invoice rendering
- **Centralized Settings**: Company info, bank details, tax rate configurable
- **Preview Modal**: Preview before generating
- **Dynamic Data Binding**: Auto-populate from bookings and settings

### Payment Tracking
- Multiple payments per booking
- Payment proof image uploads
- Down payment tracking
- Remaining balance calculations
- Payment progress visualization
- Detailed price breakdown

## 🚀 API Endpoints

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List bookings
- `PUT /api/bookings/update` - Update booking
- `POST /api/bookings/reschedule` - Reschedule booking
- `DELETE /api/bookings` - Delete booking

### Configuration
- `GET/POST /api/services` - Service management
- `GET/POST/PUT/DELETE /api/photographers` - Photographer management
- `GET/POST/PUT/DELETE /api/addons` - Add-ons management
- `GET/POST/PUT/DELETE /api/coupons` - Coupon management
- `POST /api/coupons/validate` - Validate coupon
- `POST /api/coupons/suggestions` - Get coupon suggestions

### Files & Export
- `GET /api/uploads/[...path]` - Serve uploaded files
- `GET /api/export/bookings` - Export bookings to Excel
- `GET /api/export/financial` - Export financial report to Excel

### Meta Ads Integration (Optional)
- `GET /api/meta/insights` - Fetch Meta Ads performance data
- `GET /api/meta/history` - Get historical ads data from database
- `POST /api/meta/backfill` - Backfill historical ads data (up to 90 days)

## 🎯 Price Calculation

```
Grand Total = (Service Base Price + Add-ons Total) - Base Discount - Coupon Discount
```

**Components:**
- **Service Base Price**: Original service price
- **Add-ons Total**: Sum of all add-ons × quantities
- **Base Discount**: Service package discount
- **Coupon Discount**: Applied coupon discount
- **Negative Prevention**: Total cannot go below zero

## 📈 Performance & Accessibility

- **WCAG 2.1 AA** compliant
- **Mobile-first** responsive design
- **Keyboard navigation** support
- **ARIA labels** throughout
- **Real-time validation**
- **Loading states** with skeletons
- **Smooth animations**

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>
```

### Database Issues
```bash
# Check integrity
sqlite3 data/bookings.db "PRAGMA integrity_check;"

# Vacuum database
sqlite3 data/bookings.db "VACUUM;"
```

### Cache Issues
```bash
# Clear Next.js cache
rm -rf .next/cache
rm -rf .next
npm run build
```

### PM2 Issues
```bash
# View logs
pm2 logs ceritakita-booking

# Restart
pm2 restart ceritakita-booking

# Status
pm2 status
```

## 📚 Documentation

- **User Manual**: `USER_MANUAL.md` - Non-technical guide for studio staff
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md` - Technical deployment and maintenance
- **Changelog**: `CHANGELOG.md` - Version history and recent changes

## 📊 Meta Ads Integration (Optional)

The system includes optional integration with Meta Marketing API for tracking ad performance and ROI analysis.

### Setup

1. Get Meta API credentials from [Meta Business Manager](https://business.facebook.com/)
   - Create a System User in Business Settings
   - Generate an Access Token
   - Get your Ad Account ID (format: `act_123456789`)

2. Add to `.env.local`:
   ```bash
   META_ACCESS_TOKEN=your_token_here
   META_AD_ACCOUNT_ID=act_123456789
   META_API_VERSION=v19.0  # Optional, defaults to v19.0
   ```

3. Access "Ads Performance" in the admin dashboard sidebar

### Features

- **Real-time Metrics**: Track spend, impressions, clicks, and reach
- **ROI Analysis**: Calculate return on ad spend and conversion rates
- **Historical Data**: Daily logging system for trend analysis
- **Dashboard Integration**: Ads metrics displayed in main dashboard
- **Backfill Support**: Import historical data up to 90 days

### Daily Logging System

The system automatically logs daily ads data when the dashboard is accessed. To backfill historical data:

```bash
curl -X POST "http://localhost:3000/api/meta/backfill?days=30"
```

Maximum backfill: 90 days. Data is stored in SQLite with daily granularity for accurate tracking.

## 🔄 Migration

### From JSON to SQLite
```bash
npx tsx scripts/migrate-to-sqlite.ts
```

### Image Migration
```bash
npx tsx scripts/migrate-images.ts
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#2563eb)
- **Secondary**: Purple (#7c3aed)
- **Success**: Emerald (#059669)
- **Warning**: Amber (#d97706)
- **Error**: Red (#dc2626)

### Typography
- **Headings**: Inter font
- **Body**: System font stack
- **Monospace**: For prices and codes

## 👨‍💻 Development

### Import Best Practices

The project uses barrel exports for cleaner imports. Always import from barrel entry points:

```typescript
// ✅ Good - Use barrel exports
import { useBookings, BookingsTable } from '@/components/admin';
import { Service, Booking } from '@/lib/types';
import { formatDate, formatDateTime } from '@/utils';

// ❌ Avoid - Deep imports
import { useBookings } from '@/components/admin/hooks/useBookings';
import { Service } from '@/lib/types/service';
import { formatDate } from '@/utils/dateFormatter';
```

**Available Barrel Exports:**
- `@/components/admin` - Admin components, hooks, tables, modals
- `@/components/booking` - Booking form components and steps
- `@/components/ui` - Reusable UI components
- `@/lib` - All library utilities and business logic
- `@/lib/types` - All type definitions
- `@/utils` - Utility functions

### Code Standards

- **TypeScript**: Use proper types, avoid `any`
- **Error Handling**: Use `createErrorResponse` helper for API routes
- **Logging**: Use `logger` utility instead of `console.log`
- **Validation**: Use Zod schemas for all API inputs
- **Components**: Keep components focused and under 300 lines

## 🤝 Contributing

This is a private project for CeritaKita photography services. All changes should be documented and tested.

## 📄 License

Private project for CeritaKita Studio. All rights reserved.
