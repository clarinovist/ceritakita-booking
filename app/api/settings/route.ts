import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/auth';
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

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1';
  return fallback;
}

function normalizeAIBrainSettings(raw: any) {
  const allowedProviders = new Set(['openai', 'gemini', 'deepseek', 'openrouter', 'custom']);
  const provider = String(raw?.ai_cs_provider || 'openai').toLowerCase();

  return {
    ai_cs_enabled: toBool(raw?.ai_cs_enabled, false),
    ai_cs_provider: allowedProviders.has(provider) ? provider : 'openai',
    ai_cs_model: String(raw?.ai_cs_model || 'gpt-4o-mini').trim() || 'gpt-4o-mini',
    ai_cs_base_url: String(raw?.ai_cs_base_url || '').trim(),
    ai_cs_temperature: clampNumber(raw?.ai_cs_temperature, 0, 2, 0.2),
    ai_cs_max_context_messages: Math.floor(clampNumber(raw?.ai_cs_max_context_messages, 1, 200, 30)),
    ai_cs_confidence_auto_send_threshold: clampNumber(raw?.ai_cs_confidence_auto_send_threshold, 0, 1, 0.85),
    ai_cs_allowed_auto_intents: String(raw?.ai_cs_allowed_auto_intents || 'schedule_check,booking_request,testimonial,unknown').trim(),
    ai_cs_insight_enabled: toBool(raw?.ai_cs_insight_enabled, false),
    ai_cs_draft_enabled: toBool(raw?.ai_cs_draft_enabled, false),
    ai_cs_auto_send_enabled: toBool(raw?.ai_cs_auto_send_enabled, false),
    ai_cs_system_prompt: String(raw?.ai_cs_system_prompt || '').trim()
  };
}

function canManageSettings(user: any): boolean {
  return user?.role === 'admin' || user?.permissions?.settings === true;
}

/**
 * GET /api/settings
 * Fetch all system settings
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    const canViewPrivateSettings = canManageSettings(session?.user as any);
    const settings = getSystemSettings();
    const responseSettings = canViewPrivateSettings ? settings : { ...settings };

    if (!canViewPrivateSettings) {
      delete (responseSettings as any).ai_brain;
    }

    return NextResponse.json(responseSettings, {
      status: 200,
      headers: {
        'Cache-Control': canViewPrivateSettings
          ? 'private, no-store'
          : 'public, max-age=300, s-maxage=300'
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
    const session = await getSession();
    const user = session?.user as any;
    if (!canManageSettings(user)) {
      return NextResponse.json(
        { error: 'Forbidden. Settings permission required.' },
        { status: 403 }
      );
    }

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

    // Normalize AI Brain payload first (server-side safety)
    if (body.ai_brain && typeof body.ai_brain === 'object') {
      const existing = getSystemSettings() as any;
      const mergedAiBrain = { ...(existing.ai_brain || {}), ...(body.ai_brain || {}) };
      body.ai_brain = normalizeAIBrainSettings(mergedAiBrain);
    }

    // Perbaikan: Validasi type yang lebih fleksibel (String, Number, Boolean, Object)
    for (const [key, value] of Object.entries(body)) {
      // Izinkan string, number, boolean, dan object
      if (
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean' &&
        (typeof value !== 'object' || value === null)
      ) {
        return NextResponse.json(
          { error: `Invalid value type for key "${key}". Must be string, number, boolean, or object.` },
          { status: 400 }
        );
      }

      // Konversi semua nilai ke string untuk penyimpanan
      if (typeof value === 'object') {
        settingsToUpdate[key] = JSON.stringify(value);
      } else {
        settingsToUpdate[key] = String(value);
      }
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

    const updatedBy = user?.name || user?.email || 'unknown';

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
