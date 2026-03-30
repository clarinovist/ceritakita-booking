/**
 * scripts/setup-telegram-webhook.ts
 *
 * Script sekali-jalan untuk mendaftarkan webhook URL bot Telegram ke server produksi.
 * Jalankan dengan: npx ts-node scripts/setup-telegram-webhook.ts
 * Atau: npx tsx scripts/setup-telegram-webhook.ts
 *
 * Pastikan file .env.local sudah berisi TELEGRAM_BOT_TOKEN yang benar sebelum menjalankan ini.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Muat environment variables dari .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = process.env.NEXTAUTH_URL || 'https://ceritakitastudio.site';

const TELEGRAM_API_BASE = 'https://api.telegram.org';
const WEBHOOK_PATH = '/api/telegram/webhook';
const WEBHOOK_URL = `${SITE_URL}${WEBHOOK_PATH}`;

async function setupWebhook() {
    if (!BOT_TOKEN) {
        console.error('❌ TELEGRAM_BOT_TOKEN tidak ditemukan di .env.local');
        process.exit(1);
    }

    console.log(`\n🤖 Setup Telegram Webhook`);
    console.log(`📡 Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
    console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
    console.log('');

    // 1. Cek info bot dulu
    console.log('1️⃣  Mengambil info bot...');
    const getMeRes = await fetch(`${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/getMe`);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
        console.error('❌ Gagal mengambil info bot:', getMeData.description);
        process.exit(1);
    }

    const bot = getMeData.result;
    console.log(`   ✅ Bot: @${bot.username} (${bot.first_name})`);
    console.log('');

    // 2. Cek webhook yang sedang aktif
    console.log('2️⃣  Mengecek webhook yang sedang aktif...');
    const getWebhookRes = await fetch(`${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/getWebhookInfo`);
    const getWebhookData = await getWebhookRes.json();

    if (getWebhookData.ok) {
        const current = getWebhookData.result;
        if (current.url) {
            console.log(`   ℹ️  Webhook saat ini: ${current.url}`);
            console.log(`   📊 Pending updates: ${current.pending_update_count}`);
            if (current.last_error_message) {
                console.log(`   ⚠️  Error terakhir: ${current.last_error_message}`);
            }
        } else {
            console.log('   ℹ️  Belum ada webhook yang terdaftar');
        }
    }
    console.log('');

    // 3. Set webhook baru
    console.log('3️⃣  Mendaftarkan webhook baru...');
    const setWebhookRes = await fetch(`${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: WEBHOOK_URL,
            allowed_updates: ['message', 'edited_message'],
            drop_pending_updates: false,
        }),
    });

    const setWebhookData = await setWebhookRes.json();

    if (!setWebhookData.ok) {
        console.error('❌ Gagal mendaftarkan webhook:', setWebhookData.description);
        process.exit(1);
    }

    console.log(`   ✅ Webhook berhasil didaftarkan!`);
    console.log(`   🔗 URL: ${WEBHOOK_URL}`);
    console.log('');

    // 4. Verifikasi
    console.log('4️⃣  Verifikasi webhook...');
    const verifyRes = await fetch(`${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/getWebhookInfo`);
    const verifyData = await verifyRes.json();

    if (verifyData.ok && verifyData.result.url === WEBHOOK_URL) {
        console.log('   ✅ Webhook terverifikasi aktif!');
    } else {
        console.warn('   ⚠️  Webhook mungkin belum aktif. Periksa kembali.');
    }

    console.log('');
    console.log('✅ Setup selesai!');
    console.log('');
    console.log('📝 Langkah berikutnya:');
    console.log('   1. Pastikan server produksi sudah berjalan');
    console.log(`   2. Coba kirim /help ke Telegram group Anda`);
    console.log('   3. Bot seharusnya merespons dengan daftar command');
    console.log('');
    console.log('💡 Untuk menghapus webhook (kembali ke polling):');
    console.log(`   curl -X POST ${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/deleteWebhook`);
    console.log('');
}

setupWebhook().catch((err) => {
    console.error('❌ Error tidak terduga:', err);
    process.exit(1);
});
