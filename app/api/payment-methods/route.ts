import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getAllPaymentMethods,
  getActivePaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  seedDefaultPaymentMethods
} from '@/lib/payment-methods';
import { logger, createErrorResponse } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';

// Initialize default payment methods on first request
// seedDefaultPaymentMethods();

export async function GET(req: NextRequest) {
  try {
    seedDefaultPaymentMethods();
    
    // Rate limiting
    const rateLimitResult = rateLimiters.moderate(req);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded for GET payment-methods', {
        ip: req.headers.get('x-forwarded-for')
      });
      return rateLimitResult;
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Check if authentication is required
    if (activeOnly) {
      // Public endpoint for active methods
      const methods = getActivePaymentMethods();
      return NextResponse.json(methods);
    } else {
      // Admin endpoint - require auth
      const authCheck = await requireAuth(req);
      if (authCheck) return authCheck;

      const methods = getAllPaymentMethods();
      
      logger.info('Payment methods retrieved successfully', {
        count: methods.length
      });

      return NextResponse.json(methods);
    }
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
      logger.warn('Rate limit exceeded for POST payment-methods', {
        ip: req.headers.get('x-forwarded-for')
      });
      return rateLimitResult;
    }

    // Require authentication
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const body = await req.json();
    const { name, provider_name, account_name, account_number, qris_image_url, is_active, display_order } = body;

    // Validation
    if (!name || !provider_name || !account_name || !account_number) {
      return NextResponse.json(
        { error: 'Name, provider_name, account_name, and account_number are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const newMethod = createPaymentMethod({
      name,
      provider_name,
      account_name,
      account_number,
      qris_image_url,
      is_active,
      display_order
    });

    logger.info('Payment method created successfully', {
      name: newMethod.name,
      provider: newMethod.provider_name
    });

    return NextResponse.json(newMethod, { status: 201 });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = rateLimiters.moderate(req);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded for PUT payment-methods', {
        ip: req.headers.get('x-forwarded-for')
      });
      return rateLimitResult;
    }

    // Require authentication
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const body = await req.json();
    const { id, name, provider_name, account_name, account_number, qris_image_url, is_active, display_order } = body;

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'Payment method ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const updatedMethod = updatePaymentMethod(id, {
      name,
      provider_name,
      account_name,
      account_number,
      qris_image_url,
      is_active,
      display_order
    });

    logger.info('Payment method updated successfully', {
      paymentMethodId: id,
      name: updatedMethod.name
    });

    return NextResponse.json(updatedMethod);
  } catch (error: any) {
    if (error.message === 'Payment method not found') {
      return NextResponse.json(
        { error: 'Payment method not found', code: 'NOT_FOUND' },
        { status: 404 }
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
      logger.warn('Rate limit exceeded for DELETE payment-methods', {
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
        { error: 'Payment method ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    deletePaymentMethod(id);

    logger.info('Payment method deleted successfully', {
      paymentMethodId: id
    });

    return NextResponse.json({ success: true, paymentMethodId: id });
  } catch (error: any) {
    if (error.message === 'Payment method not found') {
      return NextResponse.json(
        { error: 'Payment method not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
