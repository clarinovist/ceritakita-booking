import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger, createErrorResponse } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  sanitizeUsers,
  sanitizeUser,
  seedDefaultAdmin
} from '@/lib/auth-server';

// Initialize default admin on first request
seedDefaultAdmin();

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimiters.moderate(req);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded for GET users', {
        ip: req.headers.get('x-forwarded-for')
      });
      return rateLimitResult;
    }

    // Require authentication
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const users = getAllUsers();
    const sanitizedUsers = sanitizeUsers(users);

    logger.info('Users retrieved successfully', {
      count: sanitizedUsers.length
    });

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimiters.moderate(req);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded for POST users', {
        ip: req.headers.get('x-forwarded-for')
      });
      return rateLimitResult;
    }

    // Require authentication
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const body = await req.json();
    const newUser = createUser(body);

    logger.info('User created successfully', {
      username: newUser.username,
      role: newUser.role
    });

    const sanitizedUser = sanitizeUser(newUser);
    return NextResponse.json(sanitizedUser, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Username already exists') {
      return NextResponse.json(
        { error: 'Username already exists', code: 'DUPLICATE_USERNAME' },
        { status: 409 }
      );
    }

    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimiters.moderate(req);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded for PUT users', {
        ip: req.headers.get('x-forwarded-for')
      });
      return rateLimitResult;
    }

    // Require authentication
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const updatedUser = updateUser(id, updateData);

    logger.info('User updated successfully', {
      userId: id,
      username: updatedUser.username
    });

    const sanitizedUser = sanitizeUser(updatedUser);
    return NextResponse.json(sanitizedUser);
  } catch (error: any) {
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    if (error.message === 'Username already exists') {
      return NextResponse.json(
        { error: 'Username already exists', code: 'DUPLICATE_USERNAME' },
        { status: 409 }
      );
    }

    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimiters.moderate(req);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded for DELETE users', {
        ip: req.headers.get('x-forwarded-for')
      });
      return rateLimitResult;
    }

    // Require authentication
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // deleteUser already validates last admin protection
    deleteUser(id);

    logger.info('User deleted successfully', {
      userId: id
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    if (error.message === 'Cannot delete the last active admin user') {
      return NextResponse.json(
        { error: 'Cannot delete the last active admin user', code: 'LAST_ADMIN' },
        { status: 400 }
      );
    }

    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
