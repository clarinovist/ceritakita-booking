import { Resend } from 'resend';
import { logger } from './logger';

// Initialize Resend with API key
// We check if it exists so we don't crash if it's missing, but we'll return errors on send
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

interface SendEmailParams {
    to: string | string[];
    subject: string;
    html: string;
    from?: string; // Optional, defaults to the standard sender
    replyTo?: string;
}

/**
 * Sends an email using the Resend service
 * 
 * @param params Email parameters (to, subject, html, from, replyTo)
 * @returns Result object with success boolean, data (if success), or error (if failed)
 */
export async function sendEmail({
    to,
    subject,
    html,
    from = 'CeritaKita Reports <noreply@resend.dev>', // Default to Resend testing domain if you haven't verified yours yet
    replyTo
}: SendEmailParams): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        if (!resend) {
            const msg = 'RESEND_API_KEY is not configured in environment variables.';
            logger.warn(msg);
            return { success: false, error: msg };
        }

        const toArray = Array.isArray(to) ? to : [to];

        const response = await resend.emails.send({
            from,
            to: toArray,
            subject,
            html,
            ...(replyTo && { reply_to: replyTo })
        });

        if (response.error) {
            logger.error('Failed to send email via Resend', { error: response.error, to: toArray, subject });
            return { success: false, error: response.error.message };
        }

        logger.info('Email sent successfully', { id: response.data?.id, to: toArray, subject });
        return { success: true, data: response.data };

    } catch (error) {
        logger.error('Exception while sending email', {}, error as Error);
        return { success: false, error: (error as Error).message };
    }
}
