/**
 * app/api/telegram/send-report/route.ts
 *
 * Endpoint POST untuk trigger laporan ke Telegram secara terprogram.
 * Dipanggil oleh GitHub Actions (cronjob) secara terjadwal.
 *
 * Autentikasi: menggunakan REPORT_CRON_SECRET yang sama dengan email report.
 * Query param: ?type=daily|weekly|monthly
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, createErrorResponse } from '@/lib/logger';
import {
    sendTelegramMessage,
    formatDailyReport,
    formatWeeklyReport,
    formatMonthlyReport,
} from '@/lib/telegram';
import {
    generateDailyReport,
    generateWeeklyReport,
    generateMonthlyReport,
} from '@/lib/report-generator';

// Jangan cache route ini
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        // 1. Autentikasi via cron secret
        const authHeader = req.headers.get('x-cron-secret');
        const validSecret = process.env.REPORT_CRON_SECRET;

        if (!validSecret) {
            logger.error('REPORT_CRON_SECRET tidak dikonfigurasi');
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        if (authHeader !== validSecret) {
            logger.warn('Unauthorized: percobaan trigger Telegram report tanpa secret yang valid');
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Tentukan jenis laporan dari query param
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'daily'; // daily | weekly | monthly

        logger.info(`Mengirim Telegram ${type} report`);

        let message = '';

        if (type === 'daily') {
            const data = await generateDailyReport();
            message = formatDailyReport(data);
        } else if (type === 'weekly') {
            const data = await generateWeeklyReport();
            message = formatWeeklyReport(data);
        } else if (type === 'monthly') {
            const data = await generateMonthlyReport();
            message = formatMonthlyReport(data);
        } else {
            return NextResponse.json(
                { success: false, error: 'Jenis laporan tidak valid. Gunakan: daily, weekly, atau monthly.' },
                { status: 400 }
            );
        }

        // 3. Kirim ke Telegram
        const result = await sendTelegramMessage(message);

        if (!result.success) {
            logger.error('Gagal mengirim Telegram report', { error: result.error });
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        logger.info(`Telegram ${type} report berhasil dikirim`);
        return NextResponse.json({
            success: true,
            message: `Laporan ${type} berhasil dikirim ke Telegram`,
        });
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error saat trigger Telegram report', {}, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
