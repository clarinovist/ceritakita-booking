import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadToB2 } from '@/lib/b2-s3-client';
import { randomUUID } from 'crypto';
import { logger, createErrorResponse, AppError } from '@/lib/logger';
import { FILE_CONSTRAINTS } from '@/lib/constants';
import { rateLimiters } from '@/lib/rate-limit';

function sanitizePathSegment(value: string): string {
  return value
    .split('/')
    .map((segment) => segment
      .toLowerCase()
      .replace(/\.\./g, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, ''))
    .filter(Boolean)
    .join('/');
}

function sanitizeFileName(fileName: string): string {
  const extension = fileName.includes('.') ? `.${fileName.split('.').pop()?.toLowerCase() || ''}` : '';
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const safeBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || 'file';

  return `${safeBase}${extension}`;
}

/**
 * POST /api/uploads
 * Upload a file to B2 storage
 */
export async function POST(req: NextRequest) {
  let folder = 'uploads';

  try {
    const rateLimitResult = rateLimiters.fileUpload(req);
    if (rateLimitResult) return rateLimitResult;

    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    folder = sanitizePathSegment((formData.get('folder') as string) || 'uploads') || 'uploads';

    if (!file) {
      throw new AppError('No file provided', 400, 'MISSING_FILE');
    }

    if (!FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES.includes(file.type as typeof FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES[number])) {
      throw new AppError('Invalid file type. Use JPG, PNG, GIF, or WEBP', 400, 'INVALID_FILE_TYPE');
    }

    if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
      throw new AppError('File too large. Maximum size is 5MB', 400, 'FILE_TOO_LARGE');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeFileName = sanitizeFileName(file.name);
    const key = `${folder}/${randomUUID()}-${safeFileName}`;

    try {
      const url = await uploadToB2(buffer, key, file.type);
      return NextResponse.json({ url, key }, { status: 201 });
    } catch (b2Error) {
      logger.warn('B2 upload failed, falling back to local storage', { folder, key, message: (b2Error as Error).message });

      try {
        const { writeFile, mkdir } = await import('fs/promises');
        const path = await import('path');

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const fileName = key.split('/').pop() || `${Date.now()}-image`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        const url = `/uploads/${fileName}`;
        return NextResponse.json({ url, key: fileName }, { status: 201 });
      } catch (localError) {
        logger.error('Local upload fallback failed', { folder, key }, localError as Error);
        throw new AppError('Upload failed completely (B2 and Local)', 500, 'UPLOAD_FAILED');
      }
    }
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Upload error', { folder }, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
