import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getConversations } from '@/lib/repositories/whatsapp';
import { AppError, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/whatsapp/follow-ups
 * Retrieve due/overdue follow-ups
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = session.user as any;
    if (user.role !== 'admin' && user.permissions?.whatsapp !== true) {
      throw new AppError('Forbidden. WhatsApp permission required.', 403, 'FORBIDDEN');
    }

    const { searchParams } = new URL(request.url);
    const label = searchParams.get('label') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const result = getConversations({
      crmLabel: label,
      dueFollowUp: true,
      page,
      limit
    });

    return NextResponse.json({
      items: result.conversations,
      total: result.total
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
