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
 * PUBLIC ENDPOINT: Logo and branding info should be accessible without authentication
 */
export async function GET(req: NextRequest) {
  try {
    // No authentication required for GET - settings are public branding information
    const settings = getSystemSettings();

    return NextResponse.json(settings, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300' // Cache for 5 minutes
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
 * Expected body: { [key]: value }
 */
export async function POST(req: NextRequest) {
  try {
    // Require authentication for updates
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body. Expected an object with key-value pairs.' },
        { status: 400 }
      );
    }

    // Validate that we have at least one setting to update
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No settings provided to update' },
        { status: 400 }
      );
    }

    // Validate that all values are strings
    for (const [key, value] of Object.entries(body)) {
      if (typeof value !== 'string') {
        return NextResponse.json(
          { error: `Invalid value for key "${key}". All values must be strings.` },
          { status: 400 }
        );
      }
    }

    // Validate logo URL if present
    if (body.site_logo && !isValidImageUrl(body.site_logo)) {
      return NextResponse.json(
        {
          error: 'Invalid logo URL. Must be an image file (.jpg, .jpeg, .png, .gif, .webp)',
          code: 'INVALID_LOGO_URL'
        },
        { status: 400 }
      );
    }

    // Get user info from session for audit trail
    const { getSession } = await import('@/lib/auth');
    const session = await getSession();
    const updatedBy = session?.user?.name || session?.user?.email || 'unknown';

    // Update settings with audit trail
    updateSystemSettings(body, updatedBy);

    // Return updated settings
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