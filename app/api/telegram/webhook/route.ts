/**
 * app/api/telegram/webhook/route.ts
 *
 * Endpoint POST yang menerima update dari Telegram Bot API (webhook).
 * Memproses slash commands dari Telegram group CeritaKita Booking.
 *
 * Keamanan: hanya merespons pesan dari TELEGRAM_CHAT_ID yang dikonfigurasi.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
    sendTelegramMessage,
    formatDailyReport,
    formatWeeklyReport,
    formatMonthlyReport,
    formatStatusMessage,
    formatHelpMessage,
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
        const body = await req.json();

        // Ambil pesan dari update Telegram
        const message = body?.message || body?.edited_message;
        if (!message) {
            // Bukan pesan teks biasa (bisa callback_query, dll), abaikan saja
            return NextResponse.json({ ok: true });
        }

        const chatId = String(message.chat?.id);
        const text: string = message.text || '';
        const allowedChatId = process.env.TELEGRAM_CHAT_ID;

        // Keamanan: hanya proses pesan dari group yang dikonfigurasi
        if (!allowedChatId || chatId !== allowedChatId) {
            logger.warn('Telegram webhook: pesan dari chat tidak diizinkan', { chatId });
            return NextResponse.json({ ok: true });
        }

        // Ambil command (hapus @mention bot jika ada, misalnya /laporan@CeritaKitaBot)
        const command = text.split('@')[0].toLowerCase().trim();

        logger.info('Telegram webhook: menerima command', { chatId, command });

        switch (command) {
            case '/laporan':
            case '/daily': {
                const data = await generateDailyReport();
                const msg = formatDailyReport(data);
                await sendTelegramMessage(msg, chatId);
                break;
            }

            case '/status': {
                const data = await generateDailyReport();
                const msg = formatStatusMessage(data);
                await sendTelegramMessage(msg, chatId);
                break;
            }

            case '/rekap_mingguan':
            case '/weekly': {
                const data = await generateWeeklyReport();
                const msg = formatWeeklyReport(data);
                await sendTelegramMessage(msg, chatId);
                break;
            }

            case '/rekap_bulanan':
            case '/monthly': {
                const data = await generateMonthlyReport();
                const msg = formatMonthlyReport(data);
                await sendTelegramMessage(msg, chatId);
                break;
            }

            case '/help':
            case '/start': {
                const msg = formatHelpMessage();
                await sendTelegramMessage(msg, chatId);
                break;
            }

            default: {
                // Jika bukan command yang dikenal (atau bukan command sama sekali), abaikan
                if (text.startsWith('/')) {
                    await sendTelegramMessage(
                        `❓ Command tidak dikenali: \`${command}\`\n\nKetik /help untuk melihat daftar command.`,
                        chatId
                    );
                }
                break;
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        logger.error('Telegram webhook error', {}, error as Error);
        // Selalu kembalikan 200 ke Telegram agar tidak retry terus-menerus
        return NextResponse.json({ ok: true });
    }
}

// GET untuk verifikasi webhook masih aktif (opsional, untuk debugging)
export async function GET() {
    return NextResponse.json({ status: 'Telegram webhook active', ok: true });
}
