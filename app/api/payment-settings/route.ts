import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadToB2 } from '@/lib/b2-s3-client';
import { randomUUID } from 'crypto';
import { AppError, logger, createErrorResponse, createValidationError } from '@/lib/logger';
import { paymentSettingsSchema, validateImageUpload } from '@/lib/validation/api-routes';
import {
  getActivePaymentMethod,
  getFirstActivePaymentMethodId,
  updatePaymentMethod,
  insertPaymentMethod
} from '@/lib/repositories/payment-settings';

export async function GET() {
  try {
    const method = getActivePaymentMethod();

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
    const existingId = getFirstActivePaymentMethodId();

    if (existingId) {
      updatePaymentMethod(existingId, {
        name: bank_name,
        account_name,
        account_number,
        qris_image_url: qrisImageUrl
      });
    } else {
      const methodId = randomUUID();
      insertPaymentMethod({
        id: methodId,
        name: bank_name,
        provider_name: bank_name,
        account_name,
        account_number,
        qris_image_url: qrisImageUrl,
        display_order: 0
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error updating payment settings', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
