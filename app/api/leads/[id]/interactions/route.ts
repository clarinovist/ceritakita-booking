import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import {
    createLeadInteraction,
    getLeadInteractions
} from '@/lib/lead-interactions';
import { getLeadById } from '@/lib/leads';
import { sendContactEvent } from '@/lib/meta-capi';
import type { LeadInteractionFormData } from '@/lib/types/leads';

interface Context {
    params: {
        id: string;
    };
}

/**
 * GET /api/leads/[id]/interactions
 * Get all interactions for a lead
 */
export async function GET(_request: NextRequest, { params }: Context) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const interactions = await getLeadInteractions(id);

        return NextResponse.json(interactions);
    } catch (error) {
        console.error('Error fetching interactions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch interactions' },
            { status: 500 }
        );
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const data: LeadInteractionFormData & { send_to_meta?: boolean } = await request.json();

        // Validate lead exists
        const lead = await getLeadById(id);
        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Create interaction log
        const interaction = await createLeadInteraction(
            id,
            {
                interaction_type: data.interaction_type,
                interaction_content: data.interaction_content
            },
            (session.user as any)?.id || 'unknown'
        );

        // Send to Meta CAPI if requested (quality interactions only)
        if (data.send_to_meta && data.interaction_type === 'WhatsApp') {
            const metaResult = await sendContactEvent(
                lead.name,
                lead.whatsapp,
                lead.email || undefined
            );

            // Note: In a real implementation we might update the interaction to link the meta_event_id
            // but we do this fire-and-forget style here to not block the UI
            if (metaResult.success && metaResult.event_id) {
                // Optionally update the DB async later
            }
        }

        return NextResponse.json(interaction, { status: 201 });
    } catch (error) {
        console.error('Error creating interaction:', error);
        return NextResponse.json(
            { error: 'Failed to create interaction' },
            { status: 500 }
        );
    }
}
