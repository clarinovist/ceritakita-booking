import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/api-v1-auth';
import { logger } from '@/lib/logger';
import { getRawLeadsList } from '@/lib/repositories/leads';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/leads
 * List leads with optional filters.
 * Query params: status, source, assigned_to, page, limit
 */
export async function GET(req: NextRequest) {
  const authError = requireAgentAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const assignedTo = searchParams.get('assigned_to');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    const { total, leads } = await getRawLeadsList({
      status,
      source,
      assignedTo,
      limit,
      offset
    });

    logger.info('Agent API: leads listed', { count: leads.length, page, limit });

    return NextResponse.json({
      data: leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Agent API: leads error', { error: (error as Error).message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
