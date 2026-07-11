import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import {
  getLeadById,
  updateLead,
  deleteLead
} from '@/lib/repositories/leads';
import { AppError, createErrorResponse, createValidationError } from '@/lib/logger';
import { leadIdSchema, leadUpdateSchema } from '@/lib/validation/leads';

interface Context {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/leads/[id]
 * Get a single lead by ID
 */
export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const paramData = leadIdSchema.safeParse(await params);
    if (!paramData.success) {
      const validationError = createValidationError(paramData.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const lead = await getLeadById(paramData.data.id);
    if (!lead) {
      throw new AppError('Lead not found', 404, 'NOT_FOUND');
    }

    return NextResponse.json(lead);
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * PUT /api/leads/[id]
 * Update a lead
 */
export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const paramData = leadIdSchema.safeParse(await params);
    if (!paramData.success) {
      const validationError = createValidationError(paramData.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const body = await request.json();
    const validationResult = leadUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const existingLead = await getLeadById(paramData.data.id);
    if (!existingLead) {
      throw new AppError('Lead not found', 404, 'NOT_FOUND');
    }

    const updatedLead = await updateLead(paramData.data.id, validationResult.data);
    return NextResponse.json(updatedLead);
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * DELETE /api/leads/[id]
 * Delete a lead
 */
export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const paramData = leadIdSchema.safeParse(await params);
    if (!paramData.success) {
      const validationError = createValidationError(paramData.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const existingLead = await getLeadById(paramData.data.id);
    if (!existingLead) {
      throw new AppError('Lead not found', 404, 'NOT_FOUND');
    }

    const success = await deleteLead(paramData.data.id);
    if (!success) {
      throw new AppError('Failed to delete lead', 500, 'DELETE_FAILED');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
