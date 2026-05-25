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
    const format = searchParams.get('format');
    const isJson = format === 'json';

    // Fetch all bookings
    const bookings = readData();

    // Create workbook (only needed for excel, but logic is shared)
    const workbook = XLSX.utils.book_new();

    // OPTIMIZATION: Single pass for filtering and aggregation
    // Sheet 1: Financial Summary by Service Category
    const categoryMap = new Map<string, { count: number; totalRevenue: number; totalPaid: number; totalOutstanding: number }>();

    // Totals
    let totalBookings = 0;
    let totalRevenue = 0;
    let totalPaidAll = 0;

    // Arrays for details
    // We use any[] here to accommodate both JSON and Excel structures conditionally
    const paymentDetails: any[] = [];
    const unpaidBookings: any[] = [];

    // Single loop over bookings
    for (const b of bookings) {
       // Filter Logic
       if (startDate || endDate) {
           const bDate = b.booking.date.split('T')[0] ?? '';
           if (startDate && bDate < startDate) continue;
           if (endDate && bDate > endDate) continue;
       }

       // Common Calculations
       const bTotalPaid = b.finance.payments.reduce((sum, p) => sum + p.amount, 0);
       const bBalance = b.finance.total_price - bTotalPaid;

       // Update Totals
       totalBookings++;
       totalRevenue += b.finance.total_price;
       totalPaidAll += bTotalPaid;

       // Update Category Map
       const category = b.customer.category;
       let stats = categoryMap.get(category);
       if (!stats) {
           stats = { count: 0, totalRevenue: 0, totalPaid: 0, totalOutstanding: 0 };
           categoryMap.set(category, stats);
       }
       stats.count++;
       stats.totalRevenue += b.finance.total_price;
       stats.totalPaid += bTotalPaid;
       stats.totalOutstanding += bBalance;

       // Populate Details
       if (isJson) {
           // JSON Format
           const bookingDateFormatted = new Date(b.booking.date).toLocaleDateString('id-ID');

           if (b.finance.payments.length > 0) {
               b.finance.payments.forEach((payment, idx) => {
                   paymentDetails.push({
                       bookingId: b.id.substring(0, 8),
                       customerName: b.customer.name,
                       category: b.customer.category,
                       bookingDate: bookingDateFormatted,
                       paymentIndex: idx + 1,
                       paymentDate: payment.date,
                       amount: payment.amount,
                       note: payment.note || '-',
                       totalPrice: b.finance.total_price,
                       remainingBalance: bBalance
                   });
               });
           } else {
               paymentDetails.push({
                   bookingId: b.id.substring(0, 8),
                   customerName: b.customer.name,
                   category: b.customer.category,
                   bookingDate: bookingDateFormatted,
                   paymentIndex: 0,
                   paymentDate: '-',
                   amount: 0,
                   note: 'NO PAYMENTS YET',
                   totalPrice: b.finance.total_price,
                   remainingBalance: b.finance.total_price
               });
           }

           if (bBalance > 0 && b.status !== 'Cancelled') {
               unpaidBookings.push({
                    customerName: b.customer.name,
                    whatsapp: b.customer.whatsapp,
                    category: b.customer.category,
                    sessionDate: bookingDateFormatted,
                    totalPrice: b.finance.total_price,
                    paid: bTotalPaid,
                    outstanding: bBalance,
                    daysUntilSession: Math.ceil((new Date(b.booking.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                    status: b.status
               });
           }

       } else {
           // Excel Format
           const bookingDateFormatted = new Date(b.booking.date).toLocaleDateString('id-ID');

           if (b.finance.payments.length > 0) {
               b.finance.payments.forEach((payment, idx) => {
                   paymentDetails.push({
                      'Booking ID': b.id.substring(0, 8),
                      'Customer Name': b.customer.name,
                      'Service Category': b.customer.category,
                      'Booking Date': bookingDateFormatted,
                      'Payment #': idx + 1,
                      'Payment Date': payment.date,
                      'Amount (Rp)': payment.amount,
                      'Payment Note': payment.note || '-',
                      'Total Price (Rp)': b.finance.total_price,
                      'Remaining Balance (Rp)': bBalance
                   });
               });
           } else {
               paymentDetails.push({
                  'Booking ID': b.id.substring(0, 8),
                  'Customer Name': b.customer.name,
                  'Service Category': b.customer.category,
                  'Booking Date': bookingDateFormatted,
                  'Payment #': 0,
                  'Payment Date': '-',
                  'Amount (Rp)': 0,
                  'Payment Note': 'NO PAYMENTS YET',
                  'Total Price (Rp)': b.finance.total_price,
                  'Remaining Balance (Rp)': b.finance.total_price
               });
           }

           if (bBalance > 0 && b.status !== 'Cancelled') {
               unpaidBookings.push({
                    'Customer Name': b.customer.name,
                    'WhatsApp': b.customer.whatsapp,
                    'Service Category': b.customer.category,
                    'Session Date': bookingDateFormatted,
                    'Total Price (Rp)': b.finance.total_price,
                    'Paid (Rp)': bTotalPaid,
                    'Outstanding (Rp)': bBalance,
                    'Days Until Session': Math.ceil((new Date(b.booking.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                    'Status': b.status
               });
           }
       }
    }

    const totalOutstanding = totalRevenue - totalPaidAll;

    const summaryData = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      totalBookings: stats.count,
      totalRevenue: stats.totalRevenue,
      totalPaid: stats.totalPaid,
      outstandingBalance: stats.totalOutstanding,
      collectionRate: stats.totalRevenue > 0 ? (stats.totalPaid / stats.totalRevenue) * 100 : 0
    }));

    if (isJson) {
        return NextResponse.json({
            summary: {
                byCategory: summaryData,
                totals: {
                    totalBookings,
                    totalRevenue,
                    totalPaid: totalPaidAll,
                    totalOutstanding,
                    collectionRate: totalRevenue > 0 ? (totalPaidAll / totalRevenue) * 100 : 0
                }
            },
            details: paymentDetails,
            outstanding: unpaidBookings
        });
    }

    // EXCEL GENERATION
    const summaryDataExcel = summaryData.map(stats => ({
      'Service Category': stats.category,
      'Total Bookings': stats.totalBookings,
      'Total Revenue (Rp)': stats.totalRevenue,
      'Total Paid (Rp)': stats.totalPaid,
      'Outstanding Balance (Rp)': stats.outstandingBalance,
      'Collection Rate (%)': stats.collectionRate.toFixed(2)
    }));

    summaryDataExcel.push({
      'Service Category': 'TOTAL',
      'Total Bookings': totalBookings,
      'Total Revenue (Rp)': totalRevenue,
      'Total Paid (Rp)': totalPaidAll,
      'Outstanding Balance (Rp)': totalOutstanding,
      'Collection Rate (%)': totalRevenue > 0 ? ((totalPaidAll / totalRevenue) * 100).toFixed(2) : '0.00'
    });

    const summarySheet = XLSX.utils.json_to_sheet(summaryDataExcel);
    summarySheet['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary by Category');

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
