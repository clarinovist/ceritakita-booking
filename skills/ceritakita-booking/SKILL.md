---
name: ceritakita-booking
description: CeritaKita Booking system - Indonesian photography studio management with Next.js, SQLite, NextAuth, and Backblaze B2. Use when working with clarinovist/ceritakita-booking project: (1) Reviewing code, (2) Managing bookings/payments/addons, (3) Admin authentication and permissions, (4) Meta Ads analytics integration, (5) Database operations with better-sqlite3, (6) Docker deployment, (7) File uploads to B2.
---

# CeritaKita Booking - Skill Reference

## Project Overview

CeritaKita is an Indonesian photography studio booking system with:
- **Frontend:** Next.js 14, React 18, Tailwind CSS, Shadcn UI
- **Auth:** NextAuth.js with credentials provider
- **Database:** SQLite with better-sqlite3 (WAL mode)
- **Storage:** Backblaze B2 via AWS SDK
- **Analytics:** Meta Marketing API for ads tracking
- **Email:** Resend for transactional emails
- **Deployment:** Docker with standalone output

## Key Paths

```
PROJECT_ROOT=/home/claudia/.picoclaw/workspace/ceritakita-booking

├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/            # Admin dashboard
│   ├── booking/          # Booking pages
│   └── login/            # Auth pages
├── lib/                   # Core libraries
│   ├── db.ts             # SQLite connection & schema
│   ├── auth*.ts          # NextAuth config
│   ├── rate-limit.ts     # Rate limiting
│   ├── logger.ts         # Structured logging
│   ├── b2-s3-client.ts   # B2 storage
│   └── services/         # Business logic
├── components/            # React components
├── docs/                  # Documentation
├── scripts/              # Utility scripts
├── ops/                  # Operations scripts
└── data/                 # SQLite DB location
```

## Core Concepts

### Database Schema
- **bookings:** Core booking records with status (Active/Cancelled/Rescheduled/Completed)
- **payments:** Payment records linked to bookings
- **addons:** Available add-on services
- **booking_addons:** Junction table for many-to-many
- **coupons:** Discount codes
- **photographers:** Staff photographers
- **leads:** Mini CRM leads
- **freelancers:** Freelance staff
- **expenses:** Business expenses
- **homepage_content:** CMS for public pages

### Authentication
- NextAuth with credentials provider
- Roles: admin, staff
- Permissions system with granular access control
- Session: JWT, 24 hours

### API Structure
- `/api/bookings/*` - Booking CRUD
- `/api/payments/*` - Payment management
- `/api/addons/*` - Add-on services
- `/api/photographers/*` - Photographer management
- `/api/leads/*` - CRM operations
- `/api/admin/*` - Admin-only endpoints
- `/api/auth/*` - NextAuth handlers
- `/api/health` - Health check

## Common Tasks

### Restart Application
```bash
cd /home/claudia/.picoclaw/workspace/ceritakita-booking
docker-compose restart app
```

### Check Logs
```bash
tail -100 /home/claudia/.picoclaw/workspace/ceritakita-booking/logs/app.log
tail -100 /home/claudia/.picoclaw/workspace/ceritakita-booking/logs/error.log
```

### Database Operations
```bash
# Access SQLite
sqlite3 /home/claudia/.picoclaw/workspace/ceritakita-booking/data/bookings.db

# Run benchmarks
./scripts/benchmark-services.ts
./scripts/benchmark-rate-limit.ts
```

### Check Health
```bash
curl http://localhost:3001/api/health
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| NEXTAUTH_URL | Auth callback URL | Yes |
| NEXTAUTH_SECRET | JWT secret | Yes |
| B2_* | Backblaze B2 credentials | Yes |
| META_* | Meta Marketing API | For ads |
| RESEND_* | Email service | Optional |

## Development Commands

```bash
npm run dev          # Sync and start dev server
npm run build         # Production build
npm run lint          # ESLint check
```

## References

- [API Documentation](references/api-reference.md)
- [Database Schema](references/schema.md)
- [Deployment Guide](references/deployment.md)
- [Technical Review](docs/technical-review.md)
