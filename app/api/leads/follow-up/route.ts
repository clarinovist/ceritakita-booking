/**
 * GET /api/leads/follow-up
 *
 * Returns a prioritized shortlist of leads needing follow-up,
 * each with a pre-generated WhatsApp draft message.
 *
 * Used by the assisted follow-up feature (A2).
 * CS reviews drafts, edits if needed, then approves and sends via WA.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getLeads } from '@/lib/repositories/leads';
import { generateFollowUpDrafts, type FollowUpDraft } from '@/lib/follow-up-drafts';
import { AppError, createErrorResponse } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface FollowUpResponse {
  drafts: FollowUpDraft[];
  summary: {
    total: number;
    newLeads: number;
    overdueFollowUp: number;
    longSilence: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(request.url);
    const maxResults = Math.min(
      parseInt(searchParams.get('limit') ?? '20', 10) || 20,
      50
    );

    // Fetch all eligible leads
    const leads = await getLeads();

    // Generate follow-up drafts
    const drafts = generateFollowUpDrafts(leads, { maxResults });

    // Compute summary
    const newLeads = drafts.filter(d => d.status === 'New').length;
    const overdueFollowUp = drafts.filter(d => d.daysOverdue !== null && d.daysOverdue > 0).length;
    const longSilence = drafts.filter(d => d.daysSinceContact !== null && d.daysSinceContact > 14).length;

    const response: FollowUpResponse = {
      drafts,
      summary: {
        total: drafts.length,
        newLeads,
        overdueFollowUp,
        longSilence,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
