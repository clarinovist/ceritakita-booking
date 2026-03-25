import { format } from 'date-fns';
import { readData as readBookings } from './lib/repositories/bookings';

async function testDailyRevenue() {
    console.log("Testing with hardcoded date...");
    const targetDateStr = '2026-01-02';
    
    // Simulate what generateDailyReport does
    const allBookings = readBookings();
    console.log(`Total Bookings Fetched: ${allBookings.length}`);
    
    let dbTotalPaymentsFound = 0;
    allBookings.forEach(b => {
      dbTotalPaymentsFound += b.finance.payments.length;
    });
    console.log(`Total payments in all bookings: ${dbTotalPaymentsFound}`);

    const paymentsReceived: Array<any> = [];
    let revenueToday = 0;

    allBookings.forEach(booking => {
        booking.finance.payments.forEach(payment => {
            if (payment.date.startsWith(targetDateStr)) {
                paymentsReceived.push({ booking, payment });
                revenueToday += payment.amount;
            }
        });
    });

    console.log(`Date: ${targetDateStr}`);
    console.log(`Payments count: ${paymentsReceived.length}`);
    console.log(`Revenue calculated: ${revenueToday}`);
}

testDailyRevenue().catch(console.error);
