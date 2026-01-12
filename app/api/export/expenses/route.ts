import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getExpenses } from '@/lib/storage-expenses';
import { logger, createErrorResponse } from '@/lib/logger';
import * as XLSX from 'xlsx';

/**
 * Export expenses to Excel
 * GET /api/export/expenses
 */
export async function GET(req: NextRequest) {
    // Require authentication
    const authCheck = await requireAuth(req);
    if (authCheck) return authCheck;

    try {
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;

        // Fetch expenses
        const expenses = getExpenses(startDate, endDate);

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Prepare data
        const excelData: any[] = expenses.map(e => ({
            'Date': new Date(e.date).toLocaleDateString('id-ID'),
            'Category': e.category,
            'Description': e.description,
            'Amount (Rp)': e.amount,
            'Created By': e.created_by
        }));

        // Add totals
        const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
        excelData.push({
            'Date': 'TOTAL',
            'Category': '',
            'Description': '',
            'Amount (Rp)': totalAmount,
            'Created By': ''
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        worksheet['!cols'] = [
            { wch: 15 }, // Date
            { wch: 20 }, // Category
            { wch: 40 }, // Description
            { wch: 15 }, // Amount
            { wch: 15 }  // Created By
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

        // Generate Excel buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Generate filename
        const filename = `ceritakita-expenses-${new Date().toISOString().split('T')[0]}.xlsx`;

        return new NextResponse(excelBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
        logger.error('Error exporting expenses', {}, error as Error);
        return NextResponse.json(errorResponse, { status: statusCode });
    }
}
