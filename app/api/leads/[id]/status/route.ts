import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { updateLeadStatus, getLeadById } from '@/lib/leads';
import type { LeadStatus } from '@/lib/types';

interface Context {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/leads/[id]/status
 * Update lead status only
 */
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    // Validate status
    const validStatuses: LeadStatus[] = ['New', 'Contacted', 'Follow Up', 'Won', 'Lost', 'Converted'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if lead exists
    const existingLead = await getLeadById(id);
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updatedLead = await updateLeadStatus(id, status);
    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead status:', error);
    return NextResponse.json(
      { error: 'Failed to update lead status' },
      { status: 500 }
    );
  }
}