/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CSRF protection utilities
 * Generates and validates CSRF tokens for form submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
const CSRF_COOKIE_NAME = 'csrf-token';

// Store tokens in memory (consider Redis for production)
// Map<token, {userId: string, expiresAt: number}>
const tokenStore = new Map<string, { userId: string; expiresAt: number }>();

// Cleanup expired tokens
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(tokenStore.entries());
  for (const [token, data] of entries) {
    if (data.expiresAt < now) {
      tokenStore.delete(token);
    }
  }
}, 60000); // Cleanup every minute

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(userId: string): string {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour
  
  tokenStore.set(token, { userId, expiresAt });
  
  return token;
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string, userId: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const data = tokenStore.get(token);
  
  if (!data) {
    return false;
  }
  
  // Check expiration
  if (data.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return false;
  }
  
  // Check user ownership
  if (data.userId !== userId) {
    return false;
  }
  
  return true;
}

/**
 * Invalidate a CSRF token (logout, etc.)
 */
export function invalidateCSRFToken(token: string): void {
  tokenStore.delete(token);
}

/**
 * Get CSRF token from request (header or cookie)
 */
export function getCSRFTokenFromRequest(req: NextRequest): string | null {
  // Try header first
  const headerToken = req.headers.get(CSRF_TOKEN_HEADER);
  if (headerToken) {
    return headerToken;
  }
  
  // Try cookie
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const csrfCookie = cookies.find(c => c.startsWith(`${CSRF_COOKIE_NAME}=`));
    if (csrfCookie) {
      const value = csrfCookie.split('=')[1];
      return value || null;
    }
  }
  
  return null;
}

/**
 * Middleware to validate CSRF token for state-changing requests
 */
export function csrfProtectionMiddleware(req: NextRequest, userId: string): NextResponse | null {
  const method = req.method?.toUpperCase();
  
  // Only protect state-changing methods
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!protectedMethods.includes(method)) {
    return null;
  }
  
  const token = getCSRFTokenFromRequest(req);
  
  if (!token || !validateCSRFToken(token, userId)) {
    return NextResponse.json(
      {
        error: 'Invalid or missing CSRF token',
        code: 'CSRF_TOKEN_INVALID'
      },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * Create CSRF-protected response with token
 * Used for login and session initialization
 */
export function createCSRFProtectedResponse(userId: string, additionalData?: Record<string, any>) {
  const token = generateCSRFToken(userId);
  
  return {
    token,
    ...additionalData
  };
}

/**
 * Set CSRF token in response cookie
 * Helper for frontend integration
 */
export function setCSRFCookie(response: NextResponse, token: string): void {
  response.headers.set(
    'Set-Cookie',
    `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`
  );
}

/**
 * Clear CSRF cookie
 */
export function clearCSRFCookie(response: NextResponse): void {
  response.headers.set(
    'Set-Cookie',
    `${CSRF_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
  );
}

/**
 * Generate CSRF token for forms (HTML helper)
 */
export function generateCSRFInput(token: string): string {
  return `<input type="hidden" name="_csrf" value="${token}" />`;
}

/**
 * Validate CSRF token from form data
 */
export function validateFormCSRF(formData: Record<string, any>, userId: string): boolean {
  const token = formData._csrf || formData.csrfToken;
  if (!token) {
    return false;
  }
  return validateCSRFToken(token, userId);
}