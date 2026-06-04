import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getDb } from '@/lib/db';
import { AppError, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface Context {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/admin/whatsapp/conversations/[id]
 * Update conversation status or assignment (with permission checks)
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

    const body = await request.json();
    const { status, assignedTo } = body;

    const db = getDb();

    // Check if conversation exists
    const conv = db.prepare('SELECT id FROM whatsapp_conversations WHERE id = ?').get(params.id);
    if (!conv) {
      throw new AppError('Conversation not found', 404, 'NOT_FOUND');
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (assignedTo !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assignedTo);
    }

    if (updates.length > 0) {
      db.prepare(`
        UPDATE whatsapp_conversations
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(...values, params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
