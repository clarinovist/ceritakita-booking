import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import {
    generateDailyReport,
    generateWeeklyReport,
    generateMonthlyReport
} from '@/lib/report-generator';
import {
    buildDailyDigestEmail,
    buildWeeklySummaryEmail,
    buildMonthlyReportEmail
} from '@/lib/email-templates';
import { logger, createErrorResponse } from '@/lib/logger';

// Do not cache this route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate via cron secret
        const authHeader = req.headers.get('x-cron-secret');
        const validSecret = process.env.REPORT_CRON_SECRET;

        if (!validSecret) {
            logger.error('REPORT_CRON_SECRET is not configured');
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        if (authHeader !== validSecret) {
            logger.warn('Unauthorized attempt to trigger email report');
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Determine report type
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'daily'; // daily, weekly, monthly

        const toEmail = process.env.REPORT_EMAIL_TO;
        if (!toEmail) {
            logger.error('REPORT_EMAIL_TO is not configured');
            return NextResponse.json(
                { success: false, error: 'Recipient email not configured' },
                { status: 500 }
            );
        }

        logger.info(`Generating ${type} email report`);

        // 3. Generate data and build HTML
        let subject = '';
        let html = '';

        if (type === 'daily') {
            const data = await generateDailyReport();
            subject = `🟢 CeritaKita Daily Digest - ${data.date}`;
            html = buildDailyDigestEmail(data);
        }
        else if (type === 'weekly') {
            const data = await generateWeeklyReport();
            subject = `📊 CeritaKita Weekly Summary (${data.startDate} to ${data.endDate})`;
            html = buildWeeklySummaryEmail(data);
        }
        else if (type === 'monthly') {
            const data = await generateMonthlyReport();
            subject = `📈 CeritaKita P&L Report - ${data.month}`;
            html = buildMonthlyReportEmail(data);
        }
        else {
            return NextResponse.json(
                { success: false, error: 'Invalid report type' },
                { status: 400 }
            );
        }

        // 4. Send Email
        const result = await sendEmail({
            to: toEmail,
            subject,
            html
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${type} report sent successfully to ${toEmail}`
        });

    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error triggering email report', {}, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
