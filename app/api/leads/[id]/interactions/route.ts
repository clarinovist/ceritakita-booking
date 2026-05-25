import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import {
  createLeadInteraction,
  getLeadInteractions
} from '@/lib/lead-interactions';
import { getLeadById } from '@/lib/leads';
import { sendContactEvent } from '@/lib/meta-capi';
import { AppError, createErrorResponse, createValidationError } from '@/lib/logger';
import { leadIdSchema, leadInteractionSchema } from '@/lib/validation/leads';

interface Context {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/leads/[id]/interactions
 * Get all interactions for a lead
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

    const interactions = await getLeadInteractions(paramData.data.id);
    return NextResponse.json(interactions);
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/leads/[id]/interactions
 * Create a new interaction log and optionally send to Meta CAPI
 */
export async function POST(request: NextRequest, { params }: Context) {
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
    const validationResult = leadInteractionSchema.safeParse(body);
    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const lead = await getLeadById(paramData.data.id);
    if (!lead) {
      throw new AppError('Lead not found', 404, 'NOT_FOUND');
    }

    const interaction = await createLeadInteraction(
      paramData.data.id,
      {
        interaction_type: validationResult.data.interaction_type,
        interaction_content: validationResult.data.interaction_content
      },
      (session.user as { id?: string } | undefined)?.id || 'unknown'
    );

    if (validationResult.data.send_to_meta && validationResult.data.interaction_type === 'WhatsApp') {
      await sendContactEvent(
        lead.name,
        lead.whatsapp,
        lead.email || undefined
      );
    }

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
