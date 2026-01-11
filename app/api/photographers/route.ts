import { NextRequest, NextResponse } from 'next/server';
import {
  getAllPhotographers,
  getActivePhotographers,
  createPhotographer,
  updatePhotographer,
  deletePhotographer,
} from '@/lib/photographers';
import { requireAuth } from '@/lib/auth';
import { logger, createErrorResponse } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for photographer
const photographerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().max(20, 'Phone too long').optional(),
  specialty: z.string().max(100, 'Specialty too long').optional(),
  is_active: z.boolean().default(true),
});

/**
 * GET /api/photographers
 * Get all photographers or only active ones
 */
export async function GET(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    const photographers = activeOnly ? getActivePhotographers() : getAllPhotographers();

    return NextResponse.json(photographers);
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error fetching photographers', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * POST /api/photographers
 * Create a new photographer
 */
export async function POST(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();

    // Validate input
    const validationResult = photographerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const photographer = createPhotographer(validationResult.data);

    return NextResponse.json(photographer, { status: 201 });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error creating photographer', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * PUT /api/photographers
 * Update an existing photographer
 */
export async function PUT(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();

    // Validate ID
    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'Invalid photographer ID' }, { status: 400 });
    }

    const photographerId = body.id;

    // Validate update data
    const updateSchema = photographerSchema.partial();
    const validationResult = updateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const success = updatePhotographer(photographerId, validationResult.data);

    if (!success) {
      return NextResponse.json({ error: 'Photographer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error updating photographer', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}

/**
 * DELETE /api/photographers
 * Delete a photographer
 */
export async function DELETE(req: NextRequest) {
  const authCheck = await requireAuth(req);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Photographer ID is required' }, { status: 400 });
    }

    const success = deletePhotographer(id);

    if (!success) {
      return NextResponse.json({ error: 'Photographer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error deleting photographer', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
