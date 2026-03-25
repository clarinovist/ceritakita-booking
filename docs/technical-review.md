# Technical Review - ceritakita-booking

**Date:** 2026-03-25  
**Reviewer:** PicoClaw 🦞  
**Scope:** Next.js 14, SQLite, NextAuth, Docker, B2 Storage

---

## 1. CRITICAL FINDINGS

### 🔴 C1: Singleton DB in Hot-Reload Environment
**File:** `lib/db.ts`  
**Severity:** High  
**Risk:** Application crashes during development hot-reload

```typescript
let db: Database.Database | null = null;
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    // ...
  }
  return db;
}
```

**Problem:** The singleton pattern doesn't handle Next.js dev-server hot-reloads properly. The module stays cached but DB connection becomes stale.

**Fix:** Add connection validation or recreate on error:
```typescript
if (!db || !db.open) {
  if (db) { try { db.close(); } catch {} }
  db = new Database(DB_PATH);
}
```

---

### 🔴 C2: In-Memory Rate Limiter Not Scalable
**File:** `lib/rate-limit.ts`  
**Severity:** High  
**Risk:** Race conditions, memory leaks, ineffective across multiple instances

```typescript
const store = new Map<string, RateLimitData>();
```

**Problem:** In-memory store doesn't work in:
- Serverless environments (Vercel, AWS Lambda)
- Multi-instance Docker Swarm/K8s deployments
- Hot-reload scenarios

**Fix:** Use Redis or database-backed rate limiting for production.

---

### 🔴 C3: Auth Admin Auto-Seeding on Every Request
**File:** `app/api/auth/[...nextauth]/route.ts`  
**Severity:** Medium  
**Risk:** Performance degradation, potential race conditions

```typescript
async function initializeAdmin() {
  const { seedDefaultAdmin } = await import('@/lib/auth-server');
  seedDefaultAdmin();
}
initializeAdmin(); // Runs on EVERY module load
```

**Problem:** Module-level initialization runs repeatedly.

**Fix:** Use a flag or move to startup script.

---

### 🔴 C4: B2 Client Singleton Similar Issue
**File:** `lib/b2-s3-client.ts`  
**Severity:** Medium  
**Risk:** Stale credentials if env vars change

```typescript
let s3Client: S3Client | null = null;
```

**Problem:** Same singleton issue as DB. Also no retry logic.

**Fix:** Add connection validation and exponential backoff.

---

## 2. MEDIUM-RISK FINDINGS

### 🟡 M1: Missing Transaction Wrappers
**Files:** `lib/services/*.ts`  
**Risk:** Data inconsistency on partial failures

Booking creation involves multiple tables (bookings, payments, addons). If payment insert fails, booking remains orphaned.

**Fix:** Wrap operations in database transactions.

---

### 🟡 M2: Health Check Incomplete
**File:** `app/api/health/route.ts`  
**Risk:** False positives, missing dependencies

```typescript
const result = db.prepare('SELECT 1 as health_check').get()
```

**Missing checks:**
- B2 connectivity
- File system writable
- NextAuth secret configured

**Fix:** Expand health check to verify all critical dependencies.

---

### 🟡 M3: No API Input Sanitization Middleware
**Files:** All `app/api/*/route.ts`  
**Risk:** XSS, SQL injection (though mitigated by parameterized queries)

No centralized input validation middleware.

**Fix:** Add Zod validation middleware at route level.

---

### 🟡 M4: Error Stack Traces in Logs
**File:** `lib/logger.ts`  
**Risk:** Information disclosure

```typescript
parts.push(entry.error.stack);
```

**Fix:** Only log stack traces in non-production or add redaction layer.

---

### 🟡 M5: Missing Rate Limit Response Standardization
**File:** `lib/rate-limit.ts`  
**Risk:** Inconsistent error responses

Rate limit responses don't follow `AppError` format.

**Fix:** Use `createErrorResponse` for consistency.

---

## 3. TESTING GAPS

| Area | Status | Notes |
|------|--------|-------|
| Unit tests | ❌ Missing | No test framework configured |
| Integration tests | ❌ Missing | No API route tests |
| E2E tests | ❌ Missing | No Playwright/Cypress |
| DB migrations | ⚠️ Manual | ALTER TABLE with try/catch is fragile |
| Error scenarios | ❌ Untested | No chaos testing |

---

## 4. RECOMMENDED PRIORITIES

### Week 1 (Critical)
1. Fix DB singleton hot-reload issue
2. Add Redis for rate limiting (or database-backed fallback)
3. Improve health check endpoint

### Week 2 (High)
4. Add transaction wrappers for multi-table operations
5. Set up basic unit tests for services
6. Create database migration script

### Week 3 (Medium)
7. Add API validation middleware
8. Improve error response standardization
9. Add request ID tracing

### Week 4 (Nice to Have)
10. Set up E2E tests
11. Add performance monitoring
12. Implement circuit breaker for B2

---

## 5. ARCHITECTURE NOTES

### Strengths ✅
- Clean separation (lib/, app/, components/)
- Structured logging with context
- Good use of Zod for validation
- Docker-optimized build (standalone output)
- WAL mode for SQLite concurrency

### Concerns ⚠️
- SQLite as primary DB (good for this scale, but consider PostgreSQL for multi-instance)
- No cache layer (SWR is client-side only)
- Monolithic API routes (consider tRPC for type safety)
- Environment variables not validated at startup

---

## 6. SECURITY NOTES

| Check | Status |
|-------|--------|
| Auth on /admin | ✅ Protected |
| Auth on /api (most) | ✅ Protected |
| Rate limiting | ⚠️ In-memory only |
| SQL Injection | ✅ Parameterized |
| XSS Prevention | ✅ React handles auto-escape |
| File upload validation | ⚠️ Needs review |
| Secret management | ⚠️ .env in gitignore but no vault |
| CORS configuration | ⚠️ Needs verification |

---

*Review generated by PicoClaw 🦞 - 2026-03-25*
