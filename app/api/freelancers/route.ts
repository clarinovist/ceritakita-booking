import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getFreelancers, createFreelancer, getFreelancerRoles } from '@/lib/services/freelancer-service';
import { logger, createErrorResponse } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) return rateLimitResult;

        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get('active') === '1';
        const type = searchParams.get('type') || 'freelancers';

        if (type === 'roles') {
            const roles = getFreelancerRoles(activeOnly);
            return NextResponse.json(roles);
        }

        const freelancers = getFreelancers(activeOnly);
        return NextResponse.json(freelancers);
    } catch (error) {
        logger.error('Error fetching freelancers', { error });
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

export async function POST(req: NextRequest) {
    try {
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) return rateLimitResult;

        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const data = await req.json();

        // Basic validation
        if (!data.name || typeof data.name !== 'string') {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const freelancer = createFreelancer({
            name: data.name,
            phone: data.phone || null,
            default_fee: data.default_fee !== undefined ? Number(data.default_fee) : null,
            is_active: data.is_active !== undefined ? Boolean(data.is_active) : true
        });

        return NextResponse.json(freelancer, { status: 201 });
    } catch (error) {
        logger.error('Error creating freelancer', { error });
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
