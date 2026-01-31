import 'server-only';
import { randomUUID } from 'crypto';
import { getDb } from './db';
import { trackPerformance } from './monitoring';
import type { LeadInteraction, LeadInteractionFormData, InteractionType } from '@/lib/types/leads';

export class LeadInteractionDatabaseError extends Error {
    constructor(message: string, public cause?: any) {
        super(message);
        this.name = 'LeadInteractionDatabaseError';
    }
}

/**
 * Create a new lead interaction log
 */
export async function createLeadInteraction(
    leadId: string,
    data: LeadInteractionFormData,
    createdBy: string
): Promise<LeadInteraction> {
    return trackPerformance('createLeadInteraction', 'lead_interactions', async () => {
        try {
            const db = getDb();
            const id = randomUUID();
            const now = new Date().toISOString();

            const stmt = db.prepare(`
        INSERT INTO lead_interactions (
          id, lead_id, created_at, interaction_type, interaction_content, created_by, meta_event_sent
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

            const result = stmt.run(
                id,
                leadId,
                now,
                data.interaction_type,
                data.interaction_content || null,
                createdBy || null,
                0 // False (sqlite uses 0/1)
            );

            if (result.changes === 0) {
                throw new LeadInteractionDatabaseError('Failed to create interaction');
            }

            return {
                id,
                lead_id: leadId,
                created_at: now,
                interaction_type: data.interaction_type as InteractionType,
                interaction_content: data.interaction_content || null,
                created_by: createdBy || null,
                meta_event_sent: false,
                meta_event_id: null
            };
        } catch (error) {
            throw new LeadInteractionDatabaseError('Failed to create interaction log', error);
        }
    }, { leadId });
}

/**
 * Get all interactions for a lead
 */
export async function getLeadInteractions(leadId: string): Promise<LeadInteraction[]> {
    return trackPerformance('getLeadInteractions', 'lead_interactions', async () => {
        try {
            const db = getDb();
            const stmt = db.prepare(`
        SELECT * FROM lead_interactions 
        WHERE lead_id = ? 
        ORDER BY created_at DESC
      `);
            const rows = stmt.all(leadId) as any[];

            return rows.map(row => ({
                id: row.id,
                lead_id: row.lead_id,
                created_at: row.created_at,
                interaction_type: row.interaction_type as InteractionType,
                interaction_content: row.interaction_content,
                created_by: row.created_by,
                meta_event_sent: Boolean(row.meta_event_sent),
                meta_event_id: row.meta_event_id
            }));
        } catch (error) {
            throw new LeadInteractionDatabaseError('Failed to fetch interactions', error);
        }
    }, { leadId });
}

/**
 * Mark interaction as sent to Meta CAPI
 */
export async function markInteractionMetaSent(
    interactionId: string,
    eventId: string
): Promise<void> {
    try {
        const db = getDb();
        const stmt = db.prepare(`
      UPDATE lead_interactions 
      SET meta_event_sent = 1, meta_event_id = ?
      WHERE id = ?
    `);
        stmt.run(eventId, interactionId);
    } catch (error) {
        throw new LeadInteractionDatabaseError('Failed to mark meta event sent', error);
    }
}
