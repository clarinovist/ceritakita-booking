import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { updateLeadStatus, getLeadById } from '@/lib/repositories/leads';
import { AppError, createErrorResponse, createValidationError } from '@/lib/logger';
import { leadIdSchema, leadStatusUpdateSchema } from '@/lib/validation/leads';

interface Context {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/leads/[id]/status
 * Update lead status only
 */
export async function PATCH(request: NextRequest, { params }: Context) {
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
    const validationResult = leadStatusUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const existingLead = await getLeadById(paramData.data.id);
    if (!existingLead) {
      throw new AppError('Lead not found', 404, 'NOT_FOUND');
    }

    const updatedLead = await updateLeadStatus(paramData.data.id, validationResult.data.status);
    return NextResponse.json(updatedLead);
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
