/**
 * Rate limiting utilities for API endpoints
 * Prevents brute force attacks and abuse
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  key?: string;          // Custom key for grouping
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

// In-memory store (consider Redis for production)
const store = new Map<string, RateLimitData>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  store.forEach((data, key) => {
    if (data.resetTime < now) {
      store.delete(key);
    }
  });
}, 60000); // Cleanup every minute

/**
 * Generate rate limit key from request
 */
function getRateLimitKey(req: NextRequest, customKey?: string): string {
  if (customKey) return customKey;

  const ip = req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown-ip';

  const path = new URL(req.url).pathname;

  return `rl:${ip}:${path}`;
}

/**
 * Check rate limit for a request
 * Returns true if allowed, false if rate limited
 */
export function checkRateLimit(req: NextRequest, config: RateLimitConfig): {
  allowed: boolean;
  headers: Record<string, string>;
} {
  const key = getRateLimitKey(req, config.key);
  const now = Date.now();

  const existing = store.get(key);

  if (!existing || existing.resetTime < now) {
    // New window
    store.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });

    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': (config.maxRequests - 1).toString(),
        'X-RateLimit-Reset': (now + config.windowMs).toString()
      }
    };
  }

  if (existing.count >= config.maxRequests) {
    // Rate limited
    return {
      allowed: false,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': existing.resetTime.toString(),
        'Retry-After': Math.ceil((existing.resetTime - now) / 1000).toString()
      }
    };
  }

  // Increment count
  existing.count++;
  store.set(key, existing);

  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': (config.maxRequests - existing.count).toString(),
      'X-RateLimit-Reset': existing.resetTime.toString()
    }
  };
}

/**
 * Express-style middleware for rate limiting
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  return (req: NextRequest): NextResponse | null => {
    const result = checkRateLimit(req, config);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.headers['Retry-After']
        },
        {
          status: 429,
          headers: result.headers
        }
      );
    }

    return null; // Continue processing
  };
}

/**
 * Pre-configured rate limiters for common scenarios
 */
export const rateLimiters = {
  // Auth Login: For login attempts
  authlogin: (req: NextRequest) => {
    return rateLimitMiddleware({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60,
      key: 'rl:auth:login'
    })(req);
  },

  // Moderate: For API endpoints
  moderate: (req: NextRequest) => {
    return rateLimitMiddleware({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    })(req);
  },

  // Lenient: For general requests
  lenient: (req: NextRequest) => {
    return rateLimitMiddleware({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 300
    })(req);
  },

  // File uploads: More restrictive due to size
  fileUpload: (req: NextRequest) => {
    return rateLimitMiddleware({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      key: 'rl:upload'
    })(req);
  }
};

/**
 * Reset rate limit for a specific key (useful for testing or manual intervention)
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(key: string): RateLimitData | null {
  return store.get(key) || null;
}