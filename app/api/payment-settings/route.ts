import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadToB2 } from '@/lib/b2-s3-client';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { AppError, logger, createErrorResponse, createValidationError } from '@/lib/logger';
import { paymentSettingsSchema, validateImageUpload } from '@/lib/validation/api-routes';

interface PaymentMethod {
  id: string;
  name: string;
  account_name: string;
  account_number: string;
  qris_image_url: string | null;
  updated_at: string;
}

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

export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const formData = await req.formData();
    const qrisFile = formData.get('qris_file') as File | null;

    const validationResult = paymentSettingsSchema.safeParse({
      bank_name: formData.get('bank_name'),
      account_name: formData.get('account_name'),
      account_number: formData.get('account_number'),
    });

    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    let qrisImageUrl: string | null = null;

    if (qrisFile) {
      const uploadValidation = validateImageUpload(qrisFile, 'QRIS file');
      if (!uploadValidation.success) {
        const appError = new AppError(uploadValidation.error, 400, uploadValidation.code);
        const { error: errorResponse, statusCode } = createErrorResponse(appError);
        return NextResponse.json(errorResponse, { status: statusCode });
      }

      const bytes = await qrisFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const key = `payment/qris/${randomUUID()}-${qrisFile.name}`;
      qrisImageUrl = await uploadToB2(buffer, key, qrisFile.type);
    }

    const { bank_name, account_name, account_number } = validationResult.data;
    const db = getDb();
    const methodId = randomUUID();
    const existing = db.prepare('SELECT id FROM payment_methods WHERE is_active = 1 LIMIT 1').get() as { id: string } | null;

    if (existing) {
      db.prepare(`
        UPDATE payment_methods
        SET name = ?, account_name = ?, account_number = ?,
            qris_image_url = COALESCE(?, qris_image_url), updated_at = ?
        WHERE id = ?
      `).run(bank_name, account_name, account_number, qrisImageUrl, new Date().toISOString(), existing.id);
    } else {
      db.prepare(`
        INSERT INTO payment_methods (id, name, provider_name, account_name, account_number, qris_image_url, display_order, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(methodId, bank_name, bank_name, account_name, account_number, qrisImageUrl, 0, new Date().toISOString());
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error updating payment settings', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
