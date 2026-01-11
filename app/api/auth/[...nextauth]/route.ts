import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { rateLimiters } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { authOptions } from '@/lib/auth-config';

// Initialize default admin on first load (server-side)
async function initializeAdmin() {
  try {
    const { seedDefaultAdmin } = await import('@/lib/auth-server');
    seedDefaultAdmin();
  } catch {
    // Ignore errors during initialization
  }
}

// Call on module load
initializeAdmin();

// Wrap the handler with rate limiting
const originalHandler = NextAuth(authOptions);

export async function GET(req: NextRequest, context: { params: { nextauth: string[] } }) {
  // Apply rate limiting to auth endpoints
  const rateLimitResult = rateLimiters.authlogin(req);
  if (rateLimitResult) {
    logger.warn('Rate limit exceeded for auth endpoint', {
      ip: req.headers.get('x-forwarded-for')
    });
    return rateLimitResult;
  }

  return originalHandler(req, context);
}

export async function POST(req: NextRequest, context: { params: { nextauth: string[] } }) {
  // Apply rate limiting to auth endpoints
  const rateLimitResult = rateLimiters.authlogin(req);
  if (rateLimitResult) {
    logger.warn('Rate limit exceeded for auth endpoint', {
      ip: req.headers.get('x-forwarded-for')
    });
    return rateLimitResult;
  }

  return originalHandler(req, context);
}
