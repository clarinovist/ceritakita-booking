import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getExpense, updateExpense, deleteExpense } from '@/lib/storage-expenses';
import { expenseSchema } from '@/lib/validation';
import { logger, createErrorResponse, createValidationError } from '@/lib/logger';
import { rateLimiters } from '@/lib/rate-limit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const requestId = crypto.randomUUID();
    try {
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) return rateLimitResult;

        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const id = params.id;
        if (!id) {
            return NextResponse.json({ error: 'Missing ID', code: 'MISSING_ID' }, { status: 400 });
        }

        const existing = getExpense(id);
        if (!existing) {
            return NextResponse.json({ error: 'Expense not found', code: 'NOT_FOUND' }, { status: 404 });
        }

        const body = await req.json();

        // Validate fields
        // We use strict schema, but allow partial updates? Usually PUT is full update, PATCH is partial.
        // Let's assume full update for simplicity or validate present fields.
        // Validation schema is strict.
        const validationResult = expenseSchema.safeParse(body);
        if (!validationResult.success) {
            const validationError = createValidationError(validationResult.error.issues, requestId);
            return NextResponse.json(validationError.error, { status: validationError.statusCode });
        }

        const { date, category, description, amount } = validationResult.data;

        updateExpense({
            id,
            date,
            category,
            description,
            amount,
            created_by: 'Admin' // Placeholder
        });

        logger.info('Expense updated', { requestId, expenseId: id });

        return NextResponse.json({ success: true, id });
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error, requestId);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const requestId = crypto.randomUUID();
    try {
        const rateLimitResult = rateLimiters.moderate(req);
        if (rateLimitResult) return rateLimitResult;

        const authCheck = await requireAuth(req);
        if (authCheck) return authCheck;

        const id = params.id;
        if (!id) {
            return NextResponse.json({ error: 'Missing ID', code: 'MISSING_ID' }, { status: 400 });
        }

        const existing = getExpense(id);
        if (!existing) {
            return NextResponse.json({ error: 'Expense not found', code: 'NOT_FOUND' }, { status: 404 });
        }

        deleteExpense(id);
        logger.info('Expense deleted', { requestId, expenseId: id });

        return NextResponse.json({ success: true, id });
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error, requestId);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
