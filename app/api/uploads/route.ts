import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadToB2 } from '@/lib/b2-s3-client';
import { randomUUID } from 'crypto';
import { logger, createErrorResponse } from '@/lib/logger';

/**
 * POST /api/uploads
 * Upload a file to B2 storage
 * 
 * Expected form data:
 * - file: The file to upload
 * - folder: Optional folder name (e.g., 'qris', 'portfolio')
 * 
 * Returns: { url: string }
 */
export async function POST(req: NextRequest) {
  let folder = 'uploads';

  try {
    // Require authentication
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const formData = await req.formData();
    const file = formData.get('file') as File;
    folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Use JPG, PNG, GIF, or WEBP' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique key
    const key = `${folder}/${randomUUID()}-${file.name}`;

    try {
      // Try Upload to B2
      const url = await uploadToB2(buffer, key, file.type);
      return NextResponse.json(
        { url, key },
        { status: 201 }
      );
    } catch (b2Error) {
      console.warn('B2 Upload failed, falling back to local storage:', b2Error);

      // Fallback: Upload to local public/uploads
      try {
        const { writeFile, mkdir } = await import('fs/promises');
        const path = await import('path');

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        // Sanitize filename for local storage
        const sanitizedParams = key.split('/');
        const fileName = sanitizedParams[sanitizedParams.length - 1] || `${Date.now()}-image`; // Use the ID-Name part or fallback
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        const url = `/uploads/${fileName}`;
        return NextResponse.json(
          { url, key: fileName },
          { status: 201 }
        );
      } catch (localError) {
        logger.error('Local upload fallback failed', { folder }, localError as Error);
        // Return generic error if both fail
        return NextResponse.json(
          { error: 'Upload failed completely (B2 and Local)' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Upload error', { folder }, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}