import { NextRequest, NextResponse } from 'next/server';
import {
  getAllAddons,
  getActiveAddons,
  createAddon,
  updateAddon,
  deleteAddon
} from '@/lib/addons';
import { type Addon } from '@/lib/types';
import { requireAuth } from '@/lib/auth';
import { logger, createErrorResponse } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for addon
const addonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  price: z.number().min(0, 'Price must be positive'),
  applicable_categories: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
});

/**
 * GET /api/addons
 * Get all add-ons or only active ones, optionally filtered by category
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';
    const category = searchParams.get('category');

    let addons: Addon[];

    if (activeOnly) {
      addons = getActiveAddons(category || undefined);
    } else {
      // Admin view - require auth
      const authCheck = await requireAuth(req);
      if (authCheck) return authCheck;

      addons = getAllAddons();
    }

    return NextResponse.json(addons);
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error fetching add-ons', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/addons
 * Create a new add-on
 */
export async function POST(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();

    // Validate input
    const validationResult = addonSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const addon = createAddon(validationResult.data);

    return NextResponse.json(addon, { status: 201 });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error creating add-on', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * PUT /api/addons
 * Update an existing add-on
 */
export async function PUT(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();

    // Validate ID
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'Invalid add-on ID' }, { status: 400 });
    }

    const addonId = body.id;

    // Validate update data
    const updateSchema = addonSchema.partial();
    const validationResult = updateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const success = updateAddon(addonId, validationResult.data);

    if (!success) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error updating add-on', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * DELETE /api/addons
 * Delete an add-on
 */
export async function DELETE(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Add-on ID is required' }, { status: 400 });
    }

    const success = deleteAddon(id);

    if (!success) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error deleting add-on', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
