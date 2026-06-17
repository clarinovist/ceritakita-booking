import { readData as readBookings } from '../lib/repositories/bookings';
import { getExpenses } from '../lib/storage-expenses';
import { getSystemSettings } from '../lib/repositories/settings';

// Ensure data exists, otherwise populate some dummy data or use what's there

function runOriginal(allBookings: any[], expenses: any[], start: Date, end: Date, initialCashBalance: number) {
    const monthlyData: Record<string, { cashIn: number; cashOut: number }> = {};
    let current = new Date(start);
    while (current <= end) {
        const key = current.toISOString().substring(0, 7);
        monthlyData[key] = { cashIn: 0, cashOut: 0 };
        current.setMonth(current.getMonth() + 1);
    }

    // 1. Process Payments (Cash In)
    allBookings.forEach(booking => {
        booking.finance.payments.forEach((payment: any) => {
            const pDate = new Date(payment.date);
            const key = pDate.toISOString().substring(0, 7);
            if (monthlyData[key]) {
                monthlyData[key].cashIn += payment.amount;
            }
        });
    });

    // 2. Process Expenses (Cash Out)
    expenses.forEach((expense: any) => {
        const eDate = new Date(expense.date);
        const key = eDate.toISOString().substring(0, 7);
        if (monthlyData[key]) {
            monthlyData[key].cashOut += expense.amount;
        }
    });

    // 3. Calculate Running Balance
    let totalCashIn = 0;
    let totalCashOut = 0;

    allBookings.forEach(b => {
        b.finance.payments.forEach((p: any) => totalCashIn += p.amount);
    });
    expenses.forEach((e: any) => totalCashOut += e.amount);

    const currentPosition = initialCashBalance + totalCashIn - totalCashOut;

    // Prepare monthly breakdown with running balance
    let priorCashIn = 0;
    let priorCashOut = 0;

    allBookings.forEach(booking => {
        booking.finance.payments.forEach((payment: any) => {
            if (new Date(payment.date) < start) {
                priorCashIn += payment.amount;
            }
        });
    });
    expenses.forEach((expense: any) => {
        if (new Date(expense.date) < start) {
            priorCashOut += expense.amount;
        }
    });

    let runningBalance = initialCashBalance + priorCashIn - priorCashOut;

    // just do some work
    const breakdown = Object.keys(monthlyData).sort().map(month => {
        const data = monthlyData[month];
        if (!data) return null;
        runningBalance += (data.cashIn - data.cashOut);
        return { runningBalance };
    });

    return currentPosition;
}

function runOptimized(allBookings: any[], expenses: any[], start: Date, end: Date, initialCashBalance: number) {
    const monthlyData: Record<string, { cashIn: number; cashOut: number }> = {};
    let current = new Date(start);
    while (current <= end) {
        const key = current.toISOString().substring(0, 7);
        monthlyData[key] = { cashIn: 0, cashOut: 0 };
        current.setMonth(current.getMonth() + 1);
    }

    let totalCashIn = 0;
    let totalCashOut = 0;
    let priorCashIn = 0;
    let priorCashOut = 0;

    // SINGLE PASS for bookings
    for (let i = 0; i < allBookings.length; i++) {
        const payments = allBookings[i].finance.payments;
        for (let j = 0; j < payments.length; j++) {
            const payment = payments[j];
            const amount = payment.amount;
            totalCashIn += amount;

            // Assuming ISO date string like YYYY-MM-DDTHH:mm:ss.sssZ
            // Extract YYYY-MM quickly without Date object for the key
            const dateStr = payment.date;

            const pDate = new Date(dateStr);
            if (pDate < start) {
                priorCashIn += amount;
            } else {
                const key = dateStr.substring(0, 7);
                if (monthlyData[key]) {
                    monthlyData[key].cashIn += amount;
                }
            }
        }
    }

    // SINGLE PASS for expenses
    for (let i = 0; i < expenses.length; i++) {
        const expense = expenses[i];
        const amount = expense.amount;
        totalCashOut += amount;

        const dateStr = expense.date;
        const eDate = new Date(dateStr);
        if (eDate < start) {
            priorCashOut += amount;
        } else {
            const key = dateStr.substring(0, 7);
            if (monthlyData[key]) {
                monthlyData[key].cashOut += amount;
            }
        }
    }

    const currentPosition = initialCashBalance + totalCashIn - totalCashOut;
    let runningBalance = initialCashBalance + priorCashIn - priorCashOut;

    const breakdown = Object.keys(monthlyData).sort().map(month => {
        const data = monthlyData[month];
        if (!data) return null;
        runningBalance += (data.cashIn - data.cashOut);
        return { runningBalance };
    });

    return currentPosition;
}

// Generate large dummy data to see a real difference
const dummyBookings = Array.from({ length: 50000 }).map(() => ({
    finance: {
        payments: Array.from({ length: 5 }).map(() => ({
            date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
            amount: 100
        }))
    }
}));

const dummyExpenses = Array.from({ length: 150000 }).map(() => ({
    date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    amount: 50
}));

const start = new Date(Date.now() - 5000000000);
const end = new Date();

// Warm up
runOriginal(dummyBookings, dummyExpenses, start, end, 1000);
runOptimized(dummyBookings, dummyExpenses, start, end, 1000);

let originalTotal = 0;
console.time('Original');
for (let i = 0; i < 5; i++) {
    runOriginal(dummyBookings, dummyExpenses, start, end, 1000);
}
console.timeEnd('Original');

let optimizedTotal = 0;
console.time('Optimized');
for (let i = 0; i < 5; i++) {
    runOptimized(dummyBookings, dummyExpenses, start, end, 1000);
}
console.timeEnd('Optimized');
