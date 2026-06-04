import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { updateConversationCrm, getConversationById } from '@/lib/repositories/whatsapp';
import { AppError, createErrorResponse, logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface Context {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/admin/whatsapp/conversations/[id]/crm
 * Update CRM metadata for a WhatsApp conversation (set by admin)
 */
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = session.user as any;
    if (user.role !== 'admin' && user.permissions?.whatsapp !== true) {
      throw new AppError('Forbidden. WhatsApp permission required.', 403, 'FORBIDDEN');
    }

    // 1. Validate conversation exists
    const conversation = getConversationById(params.id);
    if (!conversation) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    const body = await request.json();
    const { crmLabel, nextFuAt, fuNote, fuTemplateKey } = body;
    const validLabels = new Set(['leads', 'warm', 'booking', 'completed', 'testimoni', 'cold']);

    if (crmLabel !== undefined && !validLabels.has(crmLabel)) {
      throw new AppError('Invalid CRM label', 400, 'BAD_REQUEST');
    }

    if (nextFuAt !== undefined && nextFuAt !== null && Number.isNaN(new Date(nextFuAt).getTime())) {
      throw new AppError('Invalid next follow-up datetime', 400, 'BAD_REQUEST');
    }

    // 2. Perform update
    updateConversationCrm(params.id, {
      crmLabel,
      nextFuAt: nextFuAt || null,
      fuNote: fuNote || null,
      fuTemplateKey: fuTemplateKey || null,
      labelSource: 'admin' // Force source to admin since this is from UI
    });

    // 3. Audit Log
    const adminIdentifier = user.username || user.email || user.name || 'unknown';
    logger.info(`[AUDIT] WhatsApp CRM updated by admin: ${adminIdentifier}. Conv: ${params.id}, Label: ${crmLabel}`, {
      action: 'UPDATE_CRM_LABEL',
      conversationId: params.id,
      crmLabel,
      nextFuAt,
      admin: adminIdentifier
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
