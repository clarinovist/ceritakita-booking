import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadToB2 } from '@/lib/b2-s3-client';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';

// GET - Fetch portfolio images for a service
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get('serviceId');
    
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
    console.error('Error fetching portfolio images:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio images' }, { status: 500 });
  }
}

// POST - Upload portfolio image
export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const serviceId = formData.get('serviceId') as string;

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
      INSERT INTO portfolio_images (id, service_id, image_url, display_order)
      VALUES (?, ?, ?, COALESCE((SELECT MAX(display_order) + 1 FROM portfolio_images WHERE service_id = ?), 0))
    `).run(newId, serviceId, imageUrl, serviceId);

    return NextResponse.json({
      id: newId,
      service_id: serviceId,
      image_url: imageUrl
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading portfolio image:', error);
    return NextResponse.json({ error: 'Failed to upload portfolio image' }, { status: 500 });
  }
}

// DELETE - Remove portfolio image
export async function DELETE(req: NextRequest) {
  try {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const { id } = await req.json();
    
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
    console.error('Error deleting portfolio image:', error);
    return NextResponse.json({ error: 'Failed to delete portfolio image' }, { status: 500 });
  }
}