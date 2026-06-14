import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { readServices, writeServices } from '@/lib/repositories/services';
import { requireAuth } from '@/lib/auth';
import { servicesArraySchema } from '@/lib/validation';
import { logger, createErrorResponse } from '@/lib/logger';

// Force dynamic — always read fresh data from disk (never serve stale cached response)
export const dynamic = 'force-dynamic';

// Public endpoint - customers need to see active services
export async function GET() {
    const data = await readServices();
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
            // Collect all invalid service entries for logging
            const invalidEntries = validationResult.error.issues.reduce((acc: Record<string, string[]>, issue) => {
              const idx = issue.path[0] as number;
              const field = issue.path.slice(1).join('.');
              const key = `services[${idx}]`;
              if (!acc[key]) acc[key] = [];
              acc[key].push(`${field}: ${issue.message}`);
              return acc;
            }, {});

            logger.error('Services validation failed', {
              issueCount: validationResult.error.issues.length,
              issues: validationResult.error.issues,
              invalidEntries,
              payloadPreview: body.filter((_, i) =>
                validationResult.error.issues.some(issue => issue.path[0] === i)
              ).slice(0, 5)
            });
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.issues },
                { status: 400 }
            );
        }

        await writeServices(validationResult.data);

        // Invalidate cache so booking page sees fresh data immediately
        revalidatePath('/booking');
        revalidatePath('/api/services');

        return NextResponse.json(validationResult.data);
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error updating services', {}, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
