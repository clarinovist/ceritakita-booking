import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadToB2 } from '@/lib/b2-s3-client';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { logger, createErrorResponse } from '@/lib/logger';

interface PaymentMethod {
  id: string;
  name: string;
  account_name: string;
  account_number: string;
  qris_image_url: string | null;
  updated_at: string;
}

// GET - Fetch payment settings (returns first active payment method)
export async function GET() {
  try {
    const db = getDb();
    const method = db.prepare('SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY display_order ASC LIMIT 1').get() as PaymentMethod | null;
    
    if (method) {
      return NextResponse.json({
        id: method.id,
        bank_name: method.name,
        account_name: method.account_name,
        account_number: method.account_number,
        qris_image_url: method.qris_image_url,
        updated_at: method.updated_at
      });
    }
    
    // Return empty default if no payment methods exist
    return NextResponse.json({
      id: 'default',
      bank_name: '',
      account_name: '',
      account_number: '',
      qris_image_url: null,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error fetching payment settings', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// POST - Update payment settings (creates/updates payment method)
export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const formData = await req.formData();
    const bankName = formData.get('bank_name') as string;
    const accountName = formData.get('account_name') as string;
    const accountNumber = formData.get('account_number') as string;
    const qrisFile = formData.get('qris_file') as File | null;

    if (!bankName || !accountName || !accountNumber) {
      return NextResponse.json({ error: 'Bank name, account name, and account number required' }, { status: 400 });
    }

    let qrisImageUrl: string | null = null;

    // Upload QRIS image if provided
    if (qrisFile) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(qrisFile.type)) {
        return NextResponse.json({ error: 'Invalid QRIS file type' }, { status: 400 });
      }

      const bytes = await qrisFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const key = `payment/qris/${randomUUID()}-${qrisFile.name}`;
      qrisImageUrl = await uploadToB2(buffer, key, qrisFile.type);
    }

    const db = getDb();
    const methodId = randomUUID();
    
    // Check if payment methods exist
    const existing = db.prepare('SELECT id FROM payment_methods WHERE is_active = 1 LIMIT 1').get() as { id: string } | null;
    
    if (existing) {
      // Update existing
      db.prepare(`
        UPDATE payment_methods
        SET name = ?, account_name = ?, account_number = ?,
            qris_image_url = COALESCE(?, qris_image_url), updated_at = ?
        WHERE id = ?
      `).run(bankName, accountName, accountNumber, qrisImageUrl, new Date().toISOString(), existing.id);
    } else {
      // Create new
      db.prepare(`
        INSERT INTO payment_methods (id, name, provider_name, account_name, account_number, qris_image_url, display_order, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(methodId, bankName, bankName, accountName, accountNumber, qrisImageUrl, 0, new Date().toISOString());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error updating payment settings', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}