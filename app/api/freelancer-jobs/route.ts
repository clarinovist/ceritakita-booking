import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getFreelancerJobs, createFreelancerJob, deleteFreelancerJob } from '@/lib/services/freelancer-service';
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
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const freelancerId = searchParams.get('freelancer_id') || undefined;

        const jobs = getFreelancerJobs(startDate, endDate, freelancerId);
        return NextResponse.json(jobs);
    } catch (error) {
        logger.error('Error fetching freelancer jobs', { error });
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

export async function POST(req: NextRequest) {
    try {
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) return rateLimitResult;

        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck; // In nextauth setup, authCheck is a NextResponse if unauthorized
        
        // In this specific app, requireAuth returns a Response if unauthorized, otherwise undefined.
        // We'll need the user session to know who created this record, let's extract it from the token
        // if possible, otherwise just use 'system'.
        
        const data = await req.json();

        if (!data.freelancer_id || !data.role_id || !data.work_date || data.fee === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const job = createFreelancerJob({
            freelancer_id: data.freelancer_id,
            booking_id: data.booking_id || null,
            role_id: data.role_id,
            work_date: data.work_date,
            fee: Number(data.fee),
            notes: data.notes || null,
            created_by: 'admin' // In a more complete setup we'd extract from session
        });

        return NextResponse.json(job, { status: 201 });
    } catch (error) {
        logger.error('Error creating freelancer job', { error });
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) return rateLimitResult;

        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        deleteFreelancerJob(id);

        return NextResponse.json({ success: true, message: 'Job log deleted successfully' });
    } catch (error) {
        logger.error('Error deleting freelancer job', { error });
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
