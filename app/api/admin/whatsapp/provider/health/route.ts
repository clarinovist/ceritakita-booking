import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import {
  isWatzapConfigured,
  parseWatzapTemplateItems,
  watzapHealthCheck,
  watzapListTemplates,
  watzapSyncTemplates
} from '@/lib/watzap';
import { AppError, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function ensureAllowed(user: any) {
  if (!user || (user.role !== 'admin' && user.permissions?.whatsapp !== true)) {
    throw new AppError('Forbidden. WhatsApp permission required.', 403, 'FORBIDDEN');
  }
}

/**
 * GET /api/admin/whatsapp/provider/health
 * Check current provider readiness and Watzap account status
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    ensureAllowed(session.user as any);

    const provider = 'watzap';
    const watzapConfigured = isWatzapConfigured();
    const result = watzapConfigured ? await watzapHealthCheck() : null;

    return NextResponse.json({
      provider,
      watzapConfigured,
      watzap: result
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/admin/whatsapp/provider/health
 * Action body:
 *  - { action: 'sync_templates' }
 *  - { action: 'list_templates' }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    ensureAllowed(session.user as any);

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '').trim();

    if (!isWatzapConfigured()) {
      throw new AppError('WATZAP_API_KEY is not configured', 400, 'BAD_REQUEST');
    }

    if (action === 'sync_templates') {
      const syncResult = await watzapSyncTemplates();
      const listResult = await watzapListTemplates();
      const templates = parseWatzapTemplateItems(listResult?.data);

      return NextResponse.json({
        success: syncResult.ok,
        sync: syncResult,
        templatesCount: templates.length,
        templates
      });
    }

    if (action === 'list_templates') {
      const listResult = await watzapListTemplates();
      const templates = parseWatzapTemplateItems(listResult?.data);

      return NextResponse.json({
        success: listResult.ok,
        templatesCount: templates.length,
        templates,
        raw: listResult
      });
    }

    throw new AppError("Unsupported action. Use 'sync_templates' or 'list_templates'", 400, 'BAD_REQUEST');
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
