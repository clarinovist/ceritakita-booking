import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimiters.authlogin(req);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded for auth verify', {
        ip: req.headers.get('x-forwarded-for')
      });
      return rateLimitResult;
    }

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Import server-side function
    const { verifyUserCredentials } = await import('@/lib/auth-server');
    const user = verifyUserCredentials(username, password);

    if (!user) {
      logger.warn('Failed auth verify attempt', { username });
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.is_active === 0) {
      logger.warn('Auth verify attempt to inactive account', { username });
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      );
    }

    logger.info('Auth verify successful', { username, role: user.role });

    // Return user without password hash
    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      permissions: user.permissions
    });
  } catch (error) {
    logger.error('Auth verify error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}