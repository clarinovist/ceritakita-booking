import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * API Key authentication for /api/v1/* endpoints.
 * Used by external Hermes agents — Bearer token in Authorization header.
 *
 * READ-ONLY by design. No POST/PUT/DELETE through this layer.
 */

const API_KEY = process.env.AGENT_API_KEY;

export interface AuthResult {
  authenticated: boolean;
  response?: NextResponse;
}

/**
 * Validate the request has a valid Bearer token.
 * Returns { authenticated: true } if OK, or { authenticated: false, response: 401 } if not.
 */
export function authenticateAgentRequest(req: NextRequest): AuthResult {
  // Check API key is configured
  if (!API_KEY) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'AGENT_API_KEY not configured on server' },
        { status: 500 }
      ),
    };
  }

  // Extract Bearer token
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Missing Authorization header. Expected: Bearer <AGENT_API_KEY>' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7); // Remove "Bearer "
  if (token !== API_KEY) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      ),
    };
  }

  return { authenticated: true };
}

/**
 * Apply rate limiting for agent API requests.
 * Returns NextResponse if rate limited, null if OK.
 */
export function checkAgentRateLimit(req: NextRequest): NextResponse | null {
  const result = checkRateLimit(req, {
    windowMs: 60_000,  // 1 minute window
    maxRequests: 60,   // 60 requests per minute
    key: 'agent-api',
  });

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 60 requests per minute.' },
      {
        status: 429,
        headers: result.headers,
      }
    );
  }

  return null;
}

/**
 * Standard auth + rate limit check for all /api/v1/* routes.
 * Returns early with error response if any check fails.
 */
export function requireAgentAuth(req: NextRequest): NextResponse | null {
  // 1. Rate limit
  const rateLimitResponse = checkAgentRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Auth
  const auth = authenticateAgentRequest(req);
  if (!auth.authenticated) return auth.response!;

  return null; // All good
}
