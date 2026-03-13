import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getFreelancers, updateFreelancer, deleteFreelancer } from '@/lib/services/freelancer-service';
import { logger, createErrorResponse } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) return rateLimitResult;

        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const freelancers = getFreelancers();
        const freelancer = freelancers.find(f => f.id === params.id);

        if (!freelancer) {
            return NextResponse.json({ error: 'Freelancer not found' }, { status: 404 });
        }

        return NextResponse.json(freelancer);
    } catch (error) {
        logger.error('Error fetching freelancer', { error, id: params.id });
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) return rateLimitResult;

        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const data = await req.json();

        updateFreelancer(params.id, {
            name: data.name,
            phone: data.phone,
            default_fee: data.default_fee !== undefined ? Number(data.default_fee) : undefined,
            is_active: data.is_active !== undefined ? Boolean(data.is_active) : undefined
        });

        // Fetch updated
        const freelancers = getFreelancers();
        const freelancer = freelancers.find(f => f.id === params.id);

        return NextResponse.json(freelancer);
    } catch (error) {
        logger.error('Error updating freelancer', { error, id: params.id });
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) return rateLimitResult;

        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        deleteFreelancer(params.id);

        return NextResponse.json({ success: true, message: 'Freelancer deleted successfully' });
    } catch (error) {
        logger.error('Error deleting freelancer', { error, id: params.id });
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
