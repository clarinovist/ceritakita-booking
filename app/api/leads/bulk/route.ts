import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { bulkUpdateLeadStatus, bulkDeleteLeads } from '@/lib/leads';
import { AppError, createErrorResponse, createValidationError } from '@/lib/logger';
import { leadBulkActionSchema } from '@/lib/validation/leads';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const validationResult = leadBulkActionSchema.safeParse(body);

    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const { ids, action, data } = validationResult.data;

    if (action !== 'update_status') {
      throw new AppError('Invalid action', 400, 'INVALID_ACTION');
    }

    const affectedCount = await bulkUpdateLeadStatus(ids, data!.status!);

    return NextResponse.json({
      success: true,
      count: affectedCount,
      message: `Successfully updated ${affectedCount} leads`
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const validationResult = leadBulkActionSchema.safeParse({ ...body, action: 'delete' });

    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const { ids } = validationResult.data;
    const affectedCount = await bulkDeleteLeads(ids);

    return NextResponse.json({
      success: true,
      count: affectedCount,
      message: `Successfully deleted ${affectedCount} leads`
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
