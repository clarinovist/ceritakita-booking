import 'server-only';
import { getDb } from '@/lib/db';
import { safeNumber } from '@/lib/type-utils';

export function getTotalCashIn(): number {
    const db = getDb();
    const result = db.prepare('SELECT SUM(amount) as total FROM payments').get() as { total: number | null };
    return safeNumber(result?.total) || 0;
}

export function getTotalCashOut(): number {
    const db = getDb();
    const result = db.prepare('SELECT SUM(amount) as total FROM expenses').get() as { total: number | null };
    return safeNumber(result?.total) || 0;
}

export function getInitialCashBalance(): number {
  const db = getDb();
  const settingRow = db.prepare("SELECT value FROM system_settings WHERE key = 'initial_cash_balance'").get() as { value: string } | undefined;
  return settingRow ? Number(settingRow.value) || 0 : 0;
}

export function getAllPaymentsForCashFlow(): Array<{ amount: number; date: string }> {
  const db = getDb();
  return db.prepare(`
    SELECT pay.amount, pay.date
    FROM payments pay
    ORDER BY pay.date ASC
  `).all() as Array<{ amount: number; date: string }>;
}

export function getAllExpensesForCashFlow(): Array<{ amount: number; date: string }> {
  const db = getDb();
  return db.prepare(`
    SELECT amount, date
    FROM expenses
    ORDER BY date ASC
  `).all() as Array<{ amount: number; date: string }>;
}

export function getRevenueForPnL(filters: { startDate?: string | null; endDate?: string | null }): Array<{
  customer_category: string;
  total_price: number;
}> {
  const db = getDb();
  let query = 'SELECT customer_category, total_price FROM bookings WHERE status != ?';
  const params: string[] = ['Cancelled'];

  if (filters.startDate) {
    query += ' AND booking_date >= ?';
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ' AND booking_date <= ?';
    params.push(filters.endDate);
  }

  return db.prepare(query).all(...params) as Array<{
    customer_category: string;
    total_price: number;
  }>;
}

export function getExpensesForPnL(filters: { startDate?: string | null; endDate?: string | null }): Array<{
  category: string;
  amount: number;
}> {
  const db = getDb();
  let query = 'SELECT category, amount FROM expenses';
  const params: string[] = [];
  const conditions: string[] = [];

  if (filters.startDate) {
    conditions.push('date >= ?');
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push('date <= ?');
    params.push(filters.endDate);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  return db.prepare(query).all(...params) as Array<{
    category: string;
    amount: number;
  }>;
}
