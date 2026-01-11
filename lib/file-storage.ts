import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { withLock } from './file-lock';
import { uploadToB2 } from './b2-s3-client';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'payment-proofs');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Use B2 if credentials are configured
const USE_B2 = !!(
  process.env.B2_APPLICATION_KEY_ID &&
  process.env.B2_APPLICATION_KEY &&
  process.env.B2_ENDPOINT &&
  process.env.B2_BUCKET_NAME
);

export class FileStorageError extends Error {
  constructor(
    message: string,
    public code: 'WRITE_FAILED' | 'READ_FAILED' | 'INVALID_PATH' | 'INVALID_FILE' | 'PERMISSION_DENIED',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'FileStorageError';
  }
}

export interface UploadedFile {
  filename: string;            // Generated filename
  originalName: string;        // User's original filename
  mimeType: string;
  size: number;
  relativePath: string;        // Relative path from uploads/ or B2 key
  url?: string;                // B2 URL if uploaded to B2
  storage: 'local' | 'b2';     // Storage backend used
}

/**
 * Validate uploaded file
 */
export function validateFile(file: { size: number; type: string; name: string }): void {
  // Check size
  if (file.size > MAX_FILE_SIZE) {
    throw new FileStorageError(
      `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      'INVALID_FILE'
    );
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new FileStorageError(
      `File type '${file.type}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      'INVALID_FILE'
    );
  }

  // Check extension
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new FileStorageError(
      `File extension '${ext}' is not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
      'INVALID_FILE'
    );
  }
}

/**
 * Generate secure filename
 * Format: {bookingId}_{paymentIndex}_{timestamp}_{uuid}.{ext}
 */
export function generateFilename(
  bookingId: string,
  paymentIndex: number,
  originalName: string
): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();

  return `${bookingId}_${paymentIndex}_${timestamp}_${uuid}${ext}`;
}

/**
 * Get year-month subdirectory for organizing files
 */
function getYearMonthDir(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get full filesystem path for a filename
 */
export async function getUploadPath(filename: string): Promise<string> {
  // Validate filename to prevent directory traversal
  // Allow forward slash for year-month subdirectories, but prevent .. and backslash
  if (filename.includes('..') || filename.includes('\\')) {
    throw new FileStorageError('Invalid filename: contains path separators', 'INVALID_PATH');
  }

  // Extract year-month from filename (assuming it's in the path)
  const parts = filename.split('/');
  if (parts.length === 2) {
    // Format: YYYY-MM/filename
    const [yearMonth, file] = parts;

    // Additional validation: year-month should match expected format
    if (!/^\d{4}-\d{2}$/.test(yearMonth ?? '')) {
      throw new FileStorageError('Invalid year-month format in path', 'INVALID_PATH');
    }

    // File part should not contain any slashes
    if ((file ?? '').includes('/') || (file ?? '').includes('\\')) {
      throw new FileStorageError('Invalid filename in subdirectory', 'INVALID_PATH');
    }

    return path.join(UPLOADS_DIR, yearMonth ?? '', file ?? '');
  }

  // Legacy: just filename without subdirectory
  // Ensure no slashes in legacy filenames
  if (filename.includes('/')) {
    throw new FileStorageError('Invalid filename format', 'INVALID_PATH');
  }

  return path.join(UPLOADS_DIR, filename);
}

/**
 * Save uploaded file to B2 or local filesystem with file locking
 */
export async function saveUploadedFile(
  fileBuffer: Buffer,
  bookingId: string,
  paymentIndex: number,
  originalName: string,
  mimeType: string
): Promise<UploadedFile> {
  const lockResource = `upload:${bookingId}:${paymentIndex}`;

  try {
    const result = await withLock(
      lockResource,
      async () => {
        // Generate filename
        const filename = generateFilename(bookingId, paymentIndex, originalName);
        const yearMonth = getYearMonthDir();

        // Upload to B2 if configured
        if (USE_B2) {
          try {
            const b2Key = `payment-proofs/${yearMonth}/${filename}`;
            const url = await uploadToB2(fileBuffer, b2Key, mimeType);

            logger.info('File uploaded successfully to B2', {
              bookingId,
              paymentIndex,
              filename,
              size: fileBuffer.length,
              mimeType,
              b2Key,
              storage: 'b2'
            });

            return {
              filename,
              originalName,
              mimeType,
              size: fileBuffer.length,
              relativePath: `${yearMonth}/${filename}`,
              url,
              storage: 'b2' as const
            };
          } catch (b2Error) {
            logger.warn('B2 upload failed, falling back to local storage', {
              bookingId,
              paymentIndex,
              error: b2Error
            });
            // Fall through to local storage
          }
        }

        // Upload to local filesystem (default or fallback)
        const subdirPath = path.join(UPLOADS_DIR, yearMonth);
        await fs.mkdir(subdirPath, { recursive: true });
        const fullPath = path.join(subdirPath, filename);
        await fs.writeFile(fullPath, fileBuffer);
        await fs.chmod(fullPath, 0o644);

        logger.info('File uploaded successfully to local storage', {
          bookingId,
          paymentIndex,
          filename,
          size: fileBuffer.length,
          mimeType,
          storage: 'local'
        });

        return {
          filename,
          originalName,
          mimeType,
          size: fileBuffer.length,
          relativePath: `${yearMonth}/${filename}`,
          storage: 'local' as const
        };
      },
      60000 // 1 minute timeout for file uploads
    );

    return result;
  } catch (error) {
    logger.error('Failed to save uploaded file', {
      bookingId,
      paymentIndex,
      originalName
    }, error as Error);

    if (error instanceof FileStorageError) {
      throw error;
    }

    throw new FileStorageError(
      'Failed to save uploaded file',
      'WRITE_FAILED',
      error as Error
    );
  }
}

/**
 * Save base64 image to filesystem (for migration)
 */
export async function saveBase64Image(
  base64Data: string,
  bookingId: string,
  paymentIndex: number
): Promise<UploadedFile> {
  try {
    // Extract MIME type and base64 string
    const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new FileStorageError('Invalid base64 data format', 'INVALID_FILE');
    }

    const mimeType = matches[1] ?? 'image/jpeg';
    const base64String = matches[2] ?? '';

    // Decode base64 to buffer
    const buffer = Buffer.from(base64String, 'base64');

    // Determine extension from MIME type
    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };
    const ext = extMap[mimeType] || '.jpg';
    const originalName = `image${ext}`;

    // Validate
    validateFile({ size: buffer.length, type: mimeType, name: originalName });

    // Save file
    return await saveUploadedFile(buffer, bookingId, paymentIndex, originalName, mimeType);
  } catch (error) {
    if (error instanceof FileStorageError) {
      throw error;
    }
    throw new FileStorageError(
      'Failed to save base64 image',
      'WRITE_FAILED',
      error as Error
    );
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filename: string): Promise<boolean> {
  try {
    const fullPath = await getUploadPath(filename);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete file
 */
export async function deleteFile(filename: string): Promise<void> {
  try {
    const fullPath = await getUploadPath(filename);
    await fs.unlink(fullPath);
  } catch (error) {
    throw new FileStorageError(
      'Failed to delete file',
      'WRITE_FAILED',
      error as Error
    );
  }
}
