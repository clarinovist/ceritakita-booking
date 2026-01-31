import 'server-only';
import crypto from 'crypto';
import { getSystemSettings } from '@/lib/repositories/settings';

export interface MetaCAPIEvent {
    event_name: 'Contact' | 'Lead' | 'Schedule' | 'Purchase';
    event_time: number; // Unix timestamp
    action_source: 'website' | 'phone_call' | 'chat' | 'other';
    user_data: {
        ph?: string[]; // Hashed phone number
        em?: string[]; // Hashed email
        fn?: string; // Hashed first name
        ln?: string; // Hashed last name
    };
    custom_data?: {
        status?: string;
        value?: number;
        currency?: string;
        content_name?: string;
    };
    event_source_url?: string;
}

/**
 * Hash data using SHA-256 for CAPI compliance
 */
function hashSHA256(text: string): string {
    return crypto.createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
}

/**
 * Send conversion event to Meta CAPI
 */
export async function sendMetaConversionEvent(
    event: MetaCAPIEvent
): Promise<{ success: boolean; event_id?: string; error?: string }> {
    try {
        const settings = getSystemSettings();
        // Prioritize environment variable, fallback to database settings
        // Check both potential locations in settings (flat key or nested seo object)
        const pixelId = process.env.META_PIXEL_ID ||
            (settings.seo?.metaPixelId) ||
            (settings as any).meta_pixel_id;

        const accessToken = process.env.META_ACCESS_TOKEN;
        const apiVersion = process.env.META_API_VERSION || 'v19.0';

        if (!pixelId || !accessToken) {
            console.warn('Meta CAPI not configured (missing PIXEL_ID or ACCESS_TOKEN)');
            return { success: false, error: 'Meta CAPI not configured' };
        }

        const url = `https://graph.facebook.com/${apiVersion}/${pixelId}/events`;

        const payload = {
            data: [event],
            access_token: accessToken
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Meta CAPI Error:', error);
            return { success: false, error: error.error?.message || 'Unknown error' };
        }

        const result = await response.json();
        const eventId = result.events_received > 0 ? crypto.randomUUID() : undefined;

        return { success: true, event_id: eventId };
    } catch (error) {
        console.error('Meta CAPI Exception:', error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Helper: Send "Contact" event when admin logs interaction with lead
 */
export async function sendContactEvent(
    leadName: string,
    leadPhone: string,
    leadEmail?: string
): Promise<{ success: boolean; event_id?: string }> {
    const userData: MetaCAPIEvent['user_data'] = {
        ph: [hashSHA256(leadPhone)]
    };

    if (leadEmail) {
        userData.em = [hashSHA256(leadEmail)];
    }

    const nameParts = leadName.split(' ');
    if (nameParts.length > 0) {
        userData.fn = hashSHA256(nameParts[0] || '');
        if (nameParts.length > 1) {
            userData.ln = hashSHA256(nameParts.slice(1).join(' '));
        }
    }

    return sendMetaConversionEvent({
        event_name: 'Contact',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'chat',
        user_data: userData,
        custom_data: {
            content_name: 'Lead Interaction'
        }
    });
}

/**
 * Helper: Send "Lead" event when lead status changes to qualified status
 */
export async function sendLeadEvent(
    leadName: string,
    leadPhone: string,
    leadEmail?: string,
    status?: string
): Promise<{ success: boolean; event_id?: string }> {
    const userData: MetaCAPIEvent['user_data'] = {
        ph: [hashSHA256(leadPhone)]
    };

    if (leadEmail) {
        userData.em = [hashSHA256(leadEmail)];
    }

    const nameParts = leadName.split(' ');
    if (nameParts.length > 0) {
        userData.fn = hashSHA256(nameParts[0] || '');
        if (nameParts.length > 1) {
            userData.ln = hashSHA256(nameParts.slice(1).join(' '));
        }
    }

    return sendMetaConversionEvent({
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: userData,
        custom_data: {
            status: status || 'Qualified'
        }
    });
}

/**
 * Helper: Send "Purchase" event when lead converts to booking
 */
export async function sendPurchaseEvent(
    leadName: string,
    leadPhone: string,
    leadEmail: string | undefined,
    bookingValue: number
): Promise<{ success: boolean; event_id?: string }> {
    const userData: MetaCAPIEvent['user_data'] = {
        ph: [hashSHA256(leadPhone)]
    };

    if (leadEmail) {
        userData.em = [hashSHA256(leadEmail)];
    }

    const nameParts = leadName.split(' ');
    if (nameParts.length > 0) {
        userData.fn = hashSHA256(nameParts[0] || '');
        if (nameParts.length > 1) {
            userData.ln = hashSHA256(nameParts.slice(1).join(' '));
        }
    }

    return sendMetaConversionEvent({
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: userData,
        custom_data: {
            value: bookingValue,
            currency: 'IDR',
            content_name: 'Photography Session'
        }
    });
}
