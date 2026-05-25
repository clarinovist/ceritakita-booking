/**
 * Rate limiting utilities for API endpoints
 * Prevents brute force attacks and abuse
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  key?: string;
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitData>();

setInterval(() => {
  const now = Date.now();
  store.forEach((data, key) => {
    if (data.resetTime < now) {
      store.delete(key);
    }
  });
}, 60000);

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown-ip';
  }

  return req.headers.get('x-real-ip') || 'unknown-ip';
}

function getRateLimitKey(req: NextRequest, customKey?: string): string {
  const ip = getClientIp(req);
  const path = new URL(req.url).pathname;

  if (customKey) {
    return `${customKey}:${ip}`;
  }

  return `rl:${ip}:${path}`;
}

export function checkRateLimit(req: NextRequest, config: RateLimitConfig): {
  allowed: boolean;
  headers: Record<string, string>;
} {
  const key = getRateLimitKey(req, config.key);
  const now = Date.now();

  const existing = store.get(key);

  if (!existing || existing.resetTime < now) {
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

    return null;
  };
}

export const rateLimiters = {
  authlogin: (req: NextRequest) => {
    return rateLimitMiddleware({
      windowMs: 60 * 1000,
      maxRequests: 60,
      key: 'rl:auth:login'
    })(req);
  },

  moderate: (req: NextRequest) => {
    return rateLimitMiddleware({
      windowMs: 15 * 60 * 1000,
      maxRequests: 300
    })(req);
  },

  lenient: (req: NextRequest) => {
    return rateLimitMiddleware({
      windowMs: 60 * 1000,
      maxRequests: 300
    })(req);
  },

  fileUpload: (req: NextRequest) => {
    return rateLimitMiddleware({
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
      key: 'rl:upload'
    })(req);
  }
};

export function resetRateLimit(key: string): void {
  store.delete(key);
}

export function getRateLimitStatus(key: string): RateLimitData | null {
  return store.get(key) || null;
}
