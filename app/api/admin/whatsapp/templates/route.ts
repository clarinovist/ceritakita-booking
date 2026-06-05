import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { AppError, createErrorResponse } from '@/lib/logger';
import { isWatzapConfigured, parseWatzapTemplateItems, watzapListTemplates, watzapSyncTemplates } from '@/lib/watzap';

export const dynamic = 'force-dynamic';

function ensureAllowed(user: any) {
  if (!user || (user.role !== 'admin' && user.permissions?.whatsapp !== true)) {
    throw new AppError('Forbidden. WhatsApp permission required.', 403, 'FORBIDDEN');
  }
}

/**
 * GET /api/admin/whatsapp/templates
 * Query params:
 * - include_unapproved=true|false (default false)
 * - sync_first=true|false (default false)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    ensureAllowed(session.user as any);

    if (!isWatzapConfigured()) {
      throw new AppError('WATZAP_API_KEY is not configured', 400, 'BAD_REQUEST');
    }

    const includeUnapproved = request.nextUrl.searchParams.get('include_unapproved') === 'true';
    const syncFirst = request.nextUrl.searchParams.get('sync_first') === 'true';

    let syncResult: any = null;
    if (syncFirst) {
      syncResult = await watzapSyncTemplates();
    }

    const listResult = await watzapListTemplates();
    const rawItems = parseWatzapTemplateItems(listResult?.data);

    const normalized = rawItems.map((t: any) => ({
      id: t.id || t.template_id || null,
      name: t.name || null,
      language: t.language || t.locale || null,
      category: t.category || null,
      status: t.status || null,
      parameter_format: t.parameter_format || t.format || null,
      raw: t
    }));

    const templates = includeUnapproved
      ? normalized
      : normalized.filter((t) => String(t.status || '').toUpperCase() === 'APPROVED');

    return NextResponse.json({
      success: listResult.ok,
      count: templates.length,
      templates,
      meta: {
        include_unapproved: includeUnapproved,
        sync_first: syncFirst,
        total_from_provider: normalized.length
      },
      ...(syncResult ? { sync: syncResult } : {})
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
