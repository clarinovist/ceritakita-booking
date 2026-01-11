import { NextRequest, NextResponse } from 'next/server';
// ✅ Ganti import lama dengan ini:
import { readData } from '@/lib/storage-sqlite';
import { requireAuth } from '@/lib/auth';
import { logger, createErrorResponse } from '@/lib/logger';
import * as XLSX from 'xlsx';

/**
 * Export financial report to Excel
 * GET /api/export/financial
 * Includes summary sheet and detailed payment breakdown
 */
export async function GET(req: NextRequest) {
  // Require authentication
  const authCheck = await requireAuth(req);
  if (authCheck) return authCheck;

  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch all bookings
    let bookings = readData();

    // Apply date filters
    if (startDate) {
      bookings = bookings.filter(b => {
        const bDate = b.booking.date.split('T')[0] ?? '';
        return bDate >= startDate;
      });
    }

    if (endDate) {
      bookings = bookings.filter(b => {
        const bDate = b.booking.date.split('T')[0] ?? '';
        return bDate <= endDate;
      });
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Financial Summary by Service Category
    const categoryMap = new Map<string, { count: number; totalRevenue: number; totalPaid: number; totalOutstanding: number }>();

    bookings.forEach(b => {
      const category = b.customer.category;
      const totalPaid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = b.finance.total_price - totalPaid;

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, totalRevenue: 0, totalPaid: 0, totalOutstanding: 0 });
      }

      const stats = categoryMap.get(category)!;
      stats.count++;
      stats.totalRevenue += b.finance.total_price;
      stats.totalPaid += totalPaid;
      stats.totalOutstanding += outstanding;
    });

    const summaryData = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      'Service Category': category,
      'Total Bookings': stats.count,
      'Total Revenue (Rp)': stats.totalRevenue,
      'Total Paid (Rp)': stats.totalPaid,
      'Outstanding Balance (Rp)': stats.totalOutstanding,
      'Collection Rate (%)': stats.totalRevenue > 0 ? ((stats.totalPaid / stats.totalRevenue) * 100).toFixed(2) : '0.00'
    }));

    // Add total row
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.finance.total_price, 0);
    const totalPaid = bookings.reduce((sum, b) => b.finance.payments.reduce((s, p) => s + p.amount, 0) + sum, 0);
    const totalOutstanding = totalRevenue - totalPaid;

    summaryData.push({
      'Service Category': 'TOTAL',
      'Total Bookings': totalBookings,
      'Total Revenue (Rp)': totalRevenue,
      'Total Paid (Rp)': totalPaid,
      'Outstanding Balance (Rp)': totalOutstanding,
      'Collection Rate (%)': totalRevenue > 0 ? ((totalPaid / totalRevenue) * 100).toFixed(2) : '0.00'
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary by Category');

    // Sheet 2: Detailed Payment Breakdown
    interface PaymentDetail {
      'Booking ID': string;
      'Customer Name': string;
      'Service Category': string;
      'Booking Date': string;
      'Payment #': number;
      'Payment Date': string;
      'Amount (Rp)': number;
      'Payment Note': string;
      'Total Price (Rp)': number;
      'Remaining Balance (Rp)': number;
    }
    const paymentDetails: PaymentDetail[] = [];

    bookings.forEach(b => {
      const totalPaid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = b.finance.total_price - totalPaid;

      b.finance.payments.forEach((payment, idx) => {
        paymentDetails.push({
          'Booking ID': b.id.substring(0, 8),
          'Customer Name': b.customer.name,
          'Service Category': b.customer.category,
          'Booking Date': new Date(b.booking.date).toLocaleDateString('id-ID'),
          'Payment #': idx + 1,
          'Payment Date': payment.date,
          'Amount (Rp)': payment.amount,
          'Payment Note': payment.note || '-',
          'Total Price (Rp)': b.finance.total_price,
          'Remaining Balance (Rp)': balance
        });
      });

      // Also show bookings with no payments
      if (b.finance.payments.length === 0) {
        paymentDetails.push({
          'Booking ID': b.id.substring(0, 8),
          'Customer Name': b.customer.name,
          'Service Category': b.customer.category,
          'Booking Date': new Date(b.booking.date).toLocaleDateString('id-ID'),
          'Payment #': 0,
          'Payment Date': '-',
          'Amount (Rp)': 0,
          'Payment Note': 'NO PAYMENTS YET',
          'Total Price (Rp)': b.finance.total_price,
          'Remaining Balance (Rp)': b.finance.total_price
        });
      }
    });

    const paymentSheet = XLSX.utils.json_to_sheet(paymentDetails);
    paymentSheet['!cols'] = [
      { wch: 12 },
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 18 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Payment Details');

    // Sheet 3: Outstanding Balances (Unpaid bookings)
    const unpaidBookings = bookings.filter(b => {
      const totalPaid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = b.finance.total_price - totalPaid;
      return balance > 0 && b.status !== 'Cancelled';
    }).map(b => {
      const totalPaid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = b.finance.total_price - totalPaid;

      return {
        'Customer Name': b.customer.name,
        'WhatsApp': b.customer.whatsapp,
        'Service Category': b.customer.category,
        'Session Date': new Date(b.booking.date).toLocaleDateString('id-ID'),
        'Total Price (Rp)': b.finance.total_price,
        'Paid (Rp)': totalPaid,
        'Outstanding (Rp)': balance,
        'Days Until Session': Math.ceil((new Date(b.booking.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        'Status': b.status
      };
    });

    const unpaidSheet = XLSX.utils.json_to_sheet(unpaidBookings);
    unpaidSheet['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, unpaidSheet, 'Outstanding Balances');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Generate filename with current date
    const filename = `ceritakita-financial-report-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const { error: errorResponse, statusCode } = createErrorResponse(error as Error);
    logger.error('Error exporting financial report', {}, error as Error);
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
