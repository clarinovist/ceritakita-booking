import { NextRequest, NextResponse } from 'next/server';
// ✅ Ganti import lama dengan ini:
import { readData } from '@/lib/storage-sqlite';
import { requireAuth } from '@/lib/auth';
import { logger, createErrorResponse } from '@/lib/logger';
import * as XLSX from 'xlsx';

/**
 * Export bookings to Excel
 * GET /api/export/bookings
 * Query params:
 * - status: Filter by status (Active, Completed, Cancelled)
 * - startDate: Filter from this date
 * - endDate: Filter to this date
 */
export async function GET(req: NextRequest) {
  // Require authentication
  const authCheck = await requireAuth(req);
  if (authCheck) return authCheck;

  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch bookings with filters applied at database level for better performance
    const bookings = readData(
      startDate || undefined,
      endDate || undefined,
      status || undefined
    );

    // Prepare data for Excel
    const excelData = bookings.map(b => {
      const totalPaid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = b.finance.total_price - totalPaid;
      const isPaidOff = balance <= 0 && b.finance.total_price > 0;

      return {
        'Booking ID': b.id,
        'Created Date': new Date(b.created_at).toLocaleDateString('id-ID'),
        'Status': b.status,
        'Customer Name': b.customer.name,
        'WhatsApp': b.customer.whatsapp,
        'Service Category': b.customer.category,
        'Session Date': new Date(b.booking.date).toLocaleDateString('id-ID'),
        'Session Time': new Date(b.booking.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        'Location Link': b.booking.location_link || '-',
        'Notes': b.booking.notes || '-',
        'Total Price (Rp)': b.finance.total_price,
        'Total Paid (Rp)': totalPaid,
        'Balance (Rp)': balance,
        'Payment Status': isPaidOff ? 'LUNAS' : 'BELUM LUNAS',
        'Number of Payments': b.finance.payments.length
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 36 }, // Booking ID
      { wch: 15 }, // Created Date
      { wch: 12 }, // Status
      { wch: 25 }, // Customer Name
      { wch: 15 }, // WhatsApp
      { wch: 20 }, // Service Category
      { wch: 15 }, // Session Date
      { wch: 12 }, // Session Time
      { wch: 30 }, // Location Link
      { wch: 30 }, // Notes
      { wch: 15 }, // Total Price
      { wch: 15 }, // Total Paid
      { wch: 15 }, // Balance
      { wch: 15 }, // Payment Status
      { wch: 12 }, // Number of Payments
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Generate filename with current date
    const filename = `ceritakita-bookings-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error exporting bookings', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
