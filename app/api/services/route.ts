import { NextRequest, NextResponse } from 'next/server';
import { readServices, writeServices } from '@/lib/storage';
import { requireAuth } from '@/lib/auth';
import { servicesArraySchema } from '@/lib/validation';
import { logger, createErrorResponse } from '@/lib/logger';

// Public endpoint - customers need to see active services
export async function GET() {
    const data = readServices();
    return NextResponse.json(data);
}

// Protected endpoint - only admins can modify services
export async function POST(req: NextRequest) {
    // Require authentication for modifying services
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const body = await req.json();

        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid payload: expected array' }, { status: 400 });
        }

        // Validate services array using Zod
        const validationResult = servicesArraySchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.issues },
                { status: 400 }
            );
        }

        await writeServices(validationResult.data);
        return NextResponse.json(validationResult.data);
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error updating services', {}, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
