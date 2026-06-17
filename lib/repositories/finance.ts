import 'server-only';
import getDb from '../db';
import { safeNumber } from '../type-utils';

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
