import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getUploadPath } from '@/lib/file-storage';
import { stat } from 'fs/promises';
import path from 'path';
import { getDb } from '@/lib/db';
import { logger, createErrorResponse } from '@/lib/logger';

/**
 * Serve uploaded files with authentication
 * Route: /api/uploads/[...path]
 *
 * Supports both local filesystem and B2-stored files.
 * For B2 files, redirects to the B2 URL.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Require authentication
  const authCheck = await requireAuth(req);
  if (authCheck) return authCheck;

  try {
    // Validate path parameters
    if (!params.path || params.path.length === 0) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Security: Validate path components
    for (const component of params.path) {
      if (component.includes('..') || component.includes('\\')) {
        return NextResponse.json(
          { error: 'Invalid file path' },
          { status: 400 }
        );
      }
    }

    // Get filename from path
    const filename = params.path.slice(1).join('/'); // Remove 'payment-proofs' prefix

    // Check database to see if this file is stored in B2
    const db = getDb();
    const payment = db.prepare(`
      SELECT proof_url, storage_backend
      FROM payments
      WHERE proof_filename = ?
      LIMIT 1
    `).get(filename) as { proof_url?: string; storage_backend?: string } | undefined;

    // If file is in B2, redirect to B2 URL
    if (payment?.storage_backend === 'b2' && payment?.proof_url) {
      return NextResponse.redirect(payment.proof_url);
    }

    // Otherwise, serve from local filesystem
    const fullPath = await getUploadPath(filename);

    // Check if file exists
    const fileStats = await stat(fullPath);
    if (!fileStats.isFile()) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Determine MIME type from extension
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Read file
    const { readFile } = await import('fs/promises');
    const fileBuffer = await readFile(fullPath);

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': 'inline'
      }
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error serving file', { path: params.path }, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
