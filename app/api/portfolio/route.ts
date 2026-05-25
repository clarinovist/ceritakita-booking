import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadToB2 } from '@/lib/b2-s3-client';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { AppError, logger, createErrorResponse, createValidationError } from '@/lib/logger';
import {
  portfolioQuerySchema,
  portfolioDeleteSchema,
  portfolioPatchSchema,
  validateImageUpload,
} from '@/lib/validation/api-routes';

export async function GET(req: NextRequest) {
  let serviceId: string | null = null;
  try {
    const { searchParams } = new URL(req.url);
    const validationResult = portfolioQuerySchema.safeParse({
      serviceId: searchParams.get('serviceId'),
    });

    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    serviceId = validationResult.data.serviceId;

    const db = getDb();
    const images = db.prepare(`
      SELECT * FROM portfolio_images 
      WHERE service_id = ? 
      ORDER BY display_order ASC
    `).all(serviceId);

    return NextResponse.json(images);
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error fetching portfolio images', { serviceId }, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

export async function POST(req: NextRequest) {
  let serviceId: string | null = null;
  try {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    const validationResult = portfolioQuerySchema.safeParse({
      serviceId: formData.get('serviceId'),
    });

    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    const fileValidation = validateImageUpload(file, 'File');
    if (!fileValidation.success) {
      const appError = new AppError(fileValidation.error, 400, fileValidation.code);
      const { error: errorResponse, statusCode } = createErrorResponse(appError);
      return NextResponse.json(errorResponse, { status: statusCode });
    }

    serviceId = validationResult.data.serviceId;
    const bytes = await file!.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const key = `portfolio/${serviceId}/${randomUUID()}-${file!.name}`;
    const imageUrl = await uploadToB2(buffer, key, file!.type);

    const db = getDb();
    const newId = randomUUID();
    db.prepare(`
      INSERT INTO portfolio_images (id, service_id, image_url, display_order, is_active)
      VALUES (?, ?, ?, COALESCE((SELECT MAX(display_order) + 1 FROM portfolio_images WHERE service_id = ?), 0), 1)
    `).run(newId, serviceId, imageUrl, serviceId);

    return NextResponse.json({
      id: newId,
      service_id: serviceId,
      image_url: imageUrl
    }, { status: 201 });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error uploading portfolio image', { serviceId }, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

export async function DELETE(req: NextRequest) {
  let id: string | null = null;
  try {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const body = await req.json();
    const validationResult = portfolioDeleteSchema.safeParse(body);
    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    id = validationResult.data.id;
    const db = getDb();
    const existing = db.prepare('SELECT image_url FROM portfolio_images WHERE id = ?').get(id) as { image_url: string } | undefined;

    if (!existing) {
      throw new AppError('Portfolio image not found', 404, 'NOT_FOUND');
    }

    db.prepare('DELETE FROM portfolio_images WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error deleting portfolio image', { imageId: id }, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

export async function PATCH(req: NextRequest) {
  let id: string | null = null;
  try {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const body = await req.json();
    const validationResult = portfolioPatchSchema.safeParse(body);
    if (!validationResult.success) {
      const validationError = createValidationError(validationResult.error.issues);
      return NextResponse.json(validationError.error, { status: validationError.statusCode });
    }

    id = validationResult.data.id;
    const db = getDb();
    const existing = db.prepare('SELECT id FROM portfolio_images WHERE id = ?').get(id) as { id: string } | undefined;

    if (!existing) {
      throw new AppError('Portfolio image not found', 404, 'NOT_FOUND');
    }

    db.prepare(`
      UPDATE portfolio_images 
      SET is_active = ? 
      WHERE id = ?
    `).run(validationResult.data.is_active ? 1 : 0, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error updating portfolio image', { imageId: id }, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
