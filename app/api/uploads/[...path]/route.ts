import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getUploadPath } from '@/lib/file-storage';
import { stat } from 'fs/promises';
import path from 'path';

/**
 * Serve uploaded files with authentication
 * Route: /api/uploads/[...path]
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

    // Get full filesystem path
    const filename = params.path.slice(1).join('/'); // Remove 'payment-proofs' prefix
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
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
