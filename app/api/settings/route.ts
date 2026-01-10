import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSystemSettings, updateSystemSettings } from '@/lib/storage-sqlite';
import { FILE_CONSTRAINTS } from '@/lib/constants';
import { logger, createErrorResponse } from '@/lib/logger';

/**
 * Validate if a URL points to a valid image
 */
function isValidImageUrl(url: string): boolean {
  try {
    // Allow relative paths
    if (url.startsWith('/')) {
      return FILE_CONSTRAINTS.ALLOWED_IMAGE_EXTENSIONS.some(ext =>
        url.toLowerCase().endsWith(ext)
      );
    }

    // Validate absolute URLs
    const parsed = new URL(url);
    return FILE_CONSTRAINTS.ALLOWED_IMAGE_EXTENSIONS.some(ext =>
      parsed.pathname.toLowerCase().endsWith(ext)
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/settings
 * Fetch all system settings
 */
export async function GET(_req: NextRequest) {
  try {
    const settings = getSystemSettings();

    return NextResponse.json(settings, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300'
      }
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Settings GET error', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/settings
 * Update system settings (supports batch updates)
 */
export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body. Expected an object with key-value pairs.' },
        { status: 400 }
      );
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No settings provided to update' },
        { status: 400 }
      );
    }

    // Perbaikan: Container untuk data yang sudah dikonversi ke string
    const settingsToUpdate: Record<string, string> = {};

    // Perbaikan: Validasi type yang lebih fleksibel (String, Number, Boolean)
    for (const [key, value] of Object.entries(body)) {
      // Izinkan string, number, dan boolean
      if (
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean'
      ) {
        return NextResponse.json(
          { error: `Invalid value type for key "${key}". Must be string, number, or boolean.` },
          { status: 400 }
        );
      }

      // Konversi semua nilai ke string untuk penyimpanan
      settingsToUpdate[key] = String(value);
    }

    // Validate logo URL only if it's explicitly passed as a string
    if (typeof body.site_logo === 'string' && body.site_logo && !isValidImageUrl(body.site_logo)) {
      return NextResponse.json(
        {
          error: 'Invalid logo URL. Must be an image file (.jpg, .jpeg, .png, .gif, .webp)',
          code: 'INVALID_LOGO_URL'
        },
        { status: 400 }
      );
    }

    const { getSession } = await import('@/lib/auth');
    const session = await getSession();
    const updatedBy = session?.user?.name || session?.user?.email || 'unknown';

    // Update settings using the converted string values
    updateSystemSettings(settingsToUpdate, updatedBy);

    const updatedSettings = getSystemSettings();
    return NextResponse.json(
      {
        success: true,
        message: 'Settings updated successfully',
        settings: updatedSettings
      },
      { status: 200 }
    );
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Settings POST error', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}