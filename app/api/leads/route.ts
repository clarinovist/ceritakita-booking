import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import {
  getLeads,
  getLeadsPaginated,
  createLead,
  getLeadStats
} from '@/lib/leads';
import type { LeadFilters } from '@/lib/types';
import { AppError, createErrorResponse, createValidationError } from '@/lib/logger';
import { leadCreateSchema, leadFiltersSchema } from '@/lib/validation/leads';

/**
 * GET /api/leads
 * Get all leads with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validationResult = leadFiltersSchema.safeParse(queryParams);

    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const { stats, page, limit, ...filters } = validationResult.data;

    if (stats === 'true') {
      const statsData = await getLeadStats();
      return NextResponse.json(statsData);
    }

    if (page || limit) {
      const result = await getLeadsPaginated(filters as LeadFilters, page || 1, limit || 20);
      return NextResponse.json(result);
    }

    const leads = await getLeads(filters as LeadFilters);
    return NextResponse.json(leads);
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/leads
 * Create a new lead
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const validationResult = leadCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const lead = await createLead(validationResult.data);
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      const duplicateError = new AppError(
        'Lead with this WhatsApp number already exists',
        409,
        'DUPLICATE_LEAD'
      );
      const { error: errorResponse, statusCode } = createErrorResponse(duplicateError);
      return NextResponse.json(errorResponse, { status: statusCode });
    }

    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
