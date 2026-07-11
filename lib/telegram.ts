/**
 * lib/telegram.ts
 *
 * Helper library untuk mengirim pesan dan memformat laporan ke Telegram.
 * Menggunakan Bot API Telegram langsung via HTTP (tanpa library eksternal).
 */

import { DailyReportData, WeeklyReportData, MonthlyReportData } from '@/lib/report-generator';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

function getBotToken(): string {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    return token;
}

function getChatId(): string {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) throw new Error('TELEGRAM_CHAT_ID is not configured');
    return chatId;
}

/**
 * Kirim pesan teks ke Telegram (mendukung Markdown)
 */
export async function sendTelegramMessage(
    text: string,
    chatId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const token = getBotToken();
        const targetChatId = chatId || getChatId();

        const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: targetChatId,
                text,
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
            }),
        });

        const data = await res.json();
        if (!data.ok) {
            return { success: false, error: data.description };
        }

        return { success: true };
    } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error };
    }
}

/**
 * Format angka sebagai Rupiah
 */
export function formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format dan kirim notifikasi order masuk
 */
export async function sendNewBookingNotification(booking: any): Promise<void> {
    try {
        const lines: string[] = [];
        lines.push(`🔥 *Order Baru Masuk!*`);
        lines.push(`Nama: ${booking.customer.name}`);
        if (booking.customer.whatsapp) lines.push(`WA: ${booking.customer.whatsapp}`);
        lines.push(`Layanan: ${booking.customer.category || '-'}`);
        try {
            const dateStr = format(new Date(booking.booking.date), 'dd MMM yyyy HH:mm', { locale: localeId });
            lines.push(`Tgl: ${dateStr}`);
        } catch {
            lines.push(`Tgl: ${booking.booking.date}`);
        }
        lines.push(`Total: ${formatRupiah(booking.finance.total_price)}`);
        
        await sendTelegramMessage(lines.join('\n'));
    } catch (e) {
        console.error('Telegram notification error:', e);
    }
}

/**
 * Format dan kirim notifikasi pembayaran masuk
 */
export async function sendNewPaymentNotification(booking: any, paymentAmount: number): Promise<void> {
    try {
        const lines: string[] = [];
        lines.push(`💳 *Pembayaran Masuk!*`);
        lines.push(`Nama: ${booking.customer.name}`);
        lines.push(`Layanan: ${booking.customer.category || '-'}`);
        lines.push(`Nominal: ${formatRupiah(paymentAmount)}`);
        
        await sendTelegramMessage(lines.join('\n'));
    } catch (e) {
        console.error('Telegram notification error:', e);
    }
}

/**
 * Format tanggal ke format Indonesia
 */
function formatTanggal(dateStr: string): string {
    try {
        return format(new Date(dateStr), 'EEEE, d MMMM yyyy', { locale: localeId });
    } catch {
        return dateStr;
    }
}

/**
 * Format laporan harian untuk dikirim ke Telegram
 */
export function formatDailyReport(data: DailyReportData): string {
    const lines: string[] = [];

    lines.push(`📊 *Laporan Harian — CeritaKita*`);
    lines.push(`📅 ${formatTanggal(data.date)}`);
    lines.push('');

    // Metrik utama bulan ini
    lines.push(`💰 *Revenue Bulan Ini:* ${formatRupiah(data.metrics.revenueThisMonth)}`);
    lines.push(`📋 *Booking Bulan Ini:* ${data.metrics.newBookingsThisMonthCount} booking`);
    lines.push(`🎯 *Leads Bulan Ini:* ${data.metrics.newLeadsThisMonthCount} leads`);

    // Pembayaran hari ini
    if (data.paymentsReceived.length > 0) {
        lines.push('');
        lines.push(`💳 *Pembayaran Hari Ini:*`);
        data.paymentsReceived.slice(0, 5).forEach(({ booking, payment }) => {
            lines.push(`• ${booking.customer.name} — ${formatRupiah(payment.amount)}`);
        });
        if (data.paymentsReceived.length > 5) {
            lines.push(`  _...dan ${data.paymentsReceived.length - 5} lainnya_`);
        }
    }

    // Upcoming bookings
    if (data.upcomingBookings.length > 0) {
        lines.push('');
        lines.push(`📅 *Jadwal 3 Hari ke Depan:*`);
        data.upcomingBookings.slice(0, 5).forEach((b) => {
            const tgl = format(new Date(b.booking.date), 'd MMM', { locale: localeId });
            const kategori = b.customer.category || 'Foto';
            lines.push(`• ${tgl} — ${b.customer.name} _(${kategori})_`);
        });
    } else {
        lines.push('');
        lines.push(`📅 _Tidak ada jadwal dalam 3 hari ke depan_`);
    }

    // Overdue Follow-ups — lead yang perlu di-follow up
    if (data.overdueFollowUps.length > 0) {
        lines.push('');
        lines.push(`⏰ *Follow-Up Overdue (${data.overdueFollowUps.length}):*`);
        data.overdueFollowUps.slice(0, 10).forEach((l) => {
            const followUpDate = new Date(l.next_follow_up);
            const today = new Date(data.date);
            const daysOverdue = Math.floor((today.getTime() - followUpDate.getTime()) / (1000 * 60 * 60 * 24));
            const label = daysOverdue > 0 ? `${daysOverdue}hr lalu` : 'hari ini';
            lines.push(`• ${l.name} — ${l.status} _(${l.source || '-'})_ — FU ${label}`);
        });
        if (data.overdueFollowUps.length > 10) {
            lines.push(`  _...dan ${data.overdueFollowUps.length - 10} lainnya_`);
        }
    } else {
        lines.push('');
        lines.push(`✅ _Tidak ada follow-up overdue_`);
    }

    // Outstanding Payments — booking dengan sisa bayar
    if (data.outstandingPayments.length > 0) {
        const totalOutstanding = data.outstandingPayments.reduce((sum, p) => sum + p.balance, 0);
        lines.push('');
        lines.push(`💰 *Sisa Bayar (${data.outstandingPayments.length} booking):*`);
        lines.push(`   Total outstanding: *${formatRupiah(totalOutstanding)}*`);
        data.outstandingPayments.slice(0, 8).forEach((p) => {
            lines.push(`• ${p.customerName} — ${formatRupiah(p.balance)} dari ${formatRupiah(p.totalPrice)} _(${p.category})_`);
        });
        if (data.outstandingPayments.length > 8) {
            lines.push(`  _...dan ${data.outstandingPayments.length - 8} lainnya_`);
        }
    } else {
        lines.push('');
        lines.push(`✅ _Semua booking sudah lunas_`);
    }

    // Top Scored Leads — lead bernilai tinggi
    if (data.topScoredLeads.length > 0) {
        lines.push('');
        lines.push(`🔥 *Top Lead (Score Tertinggi):*`);
        data.topScoredLeads.forEach((l) => {
            const scoreEmoji = l.scoreLabel === 'Hot' ? '🔴' : l.scoreLabel === 'Warm' ? '🟡' : '⚪';
            const contactInfo = l.daysSinceContact !== null ? `${l.daysSinceContact}hr lalu` : 'baru';
            lines.push(`• ${scoreEmoji} ${l.name} — ${l.score}pts _(${l.source}, ${contactInfo})_`);
        });
    }

    // Ads + WA Click insights
    if (data.adsInsights) {
        const ads = data.adsInsights;
        lines.push('');
        lines.push('📢 *Meta Ads (3 Hari Terakhir)*');
        lines.push(`   💸 Spend: ${formatRupiah(ads.spend)}`);
        lines.push(`   👁 Impressions: ${ads.impressions.toLocaleString('id-ID')}`);
        lines.push(`   🔗 Link Clicks: ${ads.linkClicks.toLocaleString('id-ID')}`);
        lines.push(`   📊 CTR: ${ads.ctr.toFixed(2)}% | CPC: ${formatRupiah(ads.cpc)}`);
        lines.push(`   👥 Reach: ${ads.reach.toLocaleString('id-ID')}`);
        lines.push('');
        lines.push('📱 *WA Clicks (Clean, Bot-Filtered)*');
        lines.push(`   Total: ${ads.waClicks} clicks`);
        if (ads.waClicksBySource.length > 0) {
            ads.waClicksBySource.forEach(({ source, clicks }) => {
                const label = source === 'meta1' ? 'Keluarga' : source === 'meta2' ? 'Self Photo' : source === 'meta3' ? 'Birthday' : source;
                lines.push(`   • ${label}: ${clicks}`);
            });
        }
        // Funnel: Meta link clicks → WA clicks
        if (ads.linkClicks > 0 && ads.waClicks > 0) {
            const conversionRate = ((ads.waClicks / ads.linkClicks) * 100).toFixed(1);
            lines.push(`   🔄 Link→WA: ${conversionRate}%`);
        }
    } else {
        lines.push('');
        lines.push('📢 _Data iklan tidak tersedia_');
    }

    lines.push('');
    lines.push(`_Generated: ${format(new Date(), 'HH:mm', { locale: localeId })} WIB_`);

    return lines.join('\n');
}

/**
 * Format laporan mingguan untuk dikirim ke Telegram
 */
export function formatWeeklyReport(data: WeeklyReportData): string {
    const lines: string[] = [];

    const growthEmoji = data.metrics.revenueGrowth >= 0 ? '📈' : '📉';
    const growthSign = data.metrics.revenueGrowth >= 0 ? '+' : '';
    const growthStr = `${growthSign}${data.metrics.revenueGrowth.toFixed(1)}%`;

    lines.push(`📊 *Rekap Mingguan — CeritaKita*`);
    lines.push(`📅 ${data.startDate} s/d ${data.endDate}`);
    lines.push('');

    lines.push(`💰 *Revenue:* ${formatRupiah(data.metrics.revenue)} ${growthEmoji} ${growthStr}`);
    lines.push(`  _vs minggu lalu: ${formatRupiah(data.metrics.revenuePrevWeek)}_`);
    lines.push('');

    lines.push(`📋 *Booking:* ${data.metrics.bookingsCount} _(vs ${data.metrics.bookingsPrevWeek} minggu lalu)_`);
    lines.push(`🎯 *Leads:* ${data.metrics.leadsCount} leads`);
    lines.push(`🔄 *Konversi:* ${data.metrics.conversionRate.toFixed(1)}%`);

    if (data.topServices.length > 0) {
        lines.push('');
        lines.push(`🏆 *Top Layanan Minggu Ini:*`);
        data.topServices.forEach((s, i) => {
            lines.push(`${i + 1}. ${s.name} — ${s.count}x _(${formatRupiah(s.revenue)})_`);
        });
    }

    lines.push('');
    lines.push(`_Generated: ${format(new Date(), 'HH:mm', { locale: localeId })} WIB_`);

    return lines.join('\n');
}

/**
 * Format laporan bulanan P&L untuk dikirim ke Telegram
 */
export function formatMonthlyReport(data: MonthlyReportData): string {
    const lines: string[] = [];
    const profitEmoji = data.metrics.netProfit >= 0 ? '✅' : '❌';

    lines.push(`📈 *Laporan Bulanan P&L — CeritaKita*`);
    lines.push(`📅 ${data.month}`);
    lines.push('');

    lines.push(`💰 *Revenue:* ${formatRupiah(data.metrics.revenue)}`);
    lines.push(`💸 *Pengeluaran:* ${formatRupiah(data.metrics.expenses)}`);
    lines.push(`${profitEmoji} *Net Profit:* ${formatRupiah(data.metrics.netProfit)}`);
    lines.push(`🏦 *Cash Position:* ${formatRupiah(data.metrics.cashPosition)}`);

    if (data.revenueByCategory.length > 0) {
        lines.push('');
        lines.push(`📂 *Revenue per Kategori:*`);
        data.revenueByCategory.slice(0, 5).forEach((c) => {
            lines.push(`• ${c.category}: ${formatRupiah(c.amount)}`);
        });
    }

    if (data.expenseByCategory.length > 0) {
        lines.push('');
        lines.push(`📂 *Pengeluaran per Kategori:*`);
        data.expenseByCategory.slice(0, 5).forEach((c) => {
            lines.push(`• ${c.category}: ${formatRupiah(c.amount)}`);
        });
    }

    lines.push('');
    lines.push(`_Generated: ${format(new Date(), 'HH:mm', { locale: localeId })} WIB_`);

    return lines.join('\n');
}

/**
 * Format pesan status singkat (untuk command /status)
 */
export function formatStatusMessage(data: DailyReportData): string {
    const lines: string[] = [];
    const totalPembayaranHariIni = data.paymentsReceived.reduce(
        (sum, { payment }) => sum + payment.amount,
        0
    );

    lines.push(`⚡ *Status Hari Ini — CeritaKita*`);
    lines.push(`📅 ${formatTanggal(data.date)}`);
    lines.push('');
    lines.push(`💳 *Pembayaran Masuk:* ${formatRupiah(totalPembayaranHariIni)} (${data.paymentsReceived.length} transaksi)`);
    lines.push(`📋 *Booking Bulan Ini:* ${data.metrics.newBookingsThisMonthCount}`);
    lines.push(`💰 *Revenue Bulan Ini:* ${formatRupiah(data.metrics.revenueThisMonth)}`);
    lines.push(`📅 *Jadwal Mendatang:* ${data.upcomingBookings.length} sesi`);
    lines.push(`⏰ *Follow-Up Overdue:* ${data.overdueFollowUps.length}`);

    if (data.outstandingPayments.length > 0) {
        const totalOutstanding = data.outstandingPayments.reduce((sum, p) => sum + p.balance, 0);
        lines.push(`💰 *Sisa Bayar:* ${formatRupiah(totalOutstanding)} (${data.outstandingPayments.length} booking)`);
    }

    return lines.join('\n');
}

/**
 * Format pesan help/daftar command
 */
export function formatHelpMessage(): string {
    return [
        `🤖 *CeritaKita Booking Bot*`,
        ``,
        `Perintah yang tersedia:`,
        ``,
        `/laporan — Laporan harian lengkap`,
        `/status — Status ringkas hari ini`,
        `/rekap\\_mingguan — Rekap performa minggu ini`,
        `/rekap\\_bulanan — Laporan P&L bulan ini`,
        `/help — Tampilkan daftar perintah ini`,
        ``,
        `_Laporan otomatis dikirim setiap 08:00 & 20:00 WIB_`,
    ].join('\n');
}
