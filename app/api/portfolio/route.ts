import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadToB2 } from '@/lib/b2-s3-client';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { logger, createErrorResponse } from '@/lib/logger';

// GET - Fetch portfolio images for a service
export async function GET(req: NextRequest) {
  let serviceId: string | null = null;
  try {
    const { searchParams } = new URL(req.url);
    serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json({ error: 'serviceId required' }, { status: 400 });
    }

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

// POST - Upload portfolio image
export async function POST(req: NextRequest) {
  let serviceId: string | null = null;
  try {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    serviceId = formData.get('serviceId') as string;

    if (!file || !serviceId) {
      return NextResponse.json({ error: 'File and serviceId required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique key
    const key = `portfolio/${serviceId}/${randomUUID()}-${file.name}`;

    // Upload to B2
    const imageUrl = await uploadToB2(buffer, key, file.type);

    // Save to database
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

// DELETE - Remove portfolio image
export async function DELETE(req: NextRequest) {
  let id: string | null = null;
  try {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const body = await req.json();
    id = body.id;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const db = getDb();

    // Get image URL for potential deletion from B2 (optional)
    db.prepare('SELECT image_url FROM portfolio_images WHERE id = ?').get(id);

    // Delete from database
    db.prepare('DELETE FROM portfolio_images WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error deleting portfolio image', { imageId: id }, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

// PATCH - Update portfolio image (toggle visibility)
export async function PATCH(req: NextRequest) {
  let id: string | null = null;
  try {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const body = await req.json();
    id = body.id;
    const { is_active } = body;

    if (!id || is_active === undefined) {
      return NextResponse.json({ error: 'ID and is_active required' }, { status: 400 });
    }

    const db = getDb();

    // Update is_active
    db.prepare(`
      UPDATE portfolio_images 
      SET is_active = ? 
      WHERE id = ?
    `).run(is_active ? 1 : 0, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error updating portfolio image', { imageId: id }, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}