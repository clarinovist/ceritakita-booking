import 'server-only';
import getDb from './db';
import { logger, AppError } from './logger';
import { safeString, safeNumber } from './type-utils';

export interface Expense {
    id: string;
    date: string;
    category: 'operational' | 'equipment' | 'marketing' | 'salary' | 'other';
    description: string;
    amount: number;
    created_by: string;
    created_at: string;
}

export type CreateExpenseInput = Omit<Expense, 'created_at'>;
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'created_at'>> & { id: string };

interface ExpenseRow {
    id: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    created_by: string;
    created_at: string;
}

/**
 * Get all expenses, optionally filtered by date range
 */
export function getExpenses(startDate?: string, endDate?: string): Expense[] {
    const db = getDb();

    let query = 'SELECT * FROM expenses';
    const params: string[] = [];

    if (startDate && endDate) {
        query += ' WHERE date >= ? AND date <= ?';
        params.push(startDate, endDate);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as ExpenseRow[];

    return rows.map(row => ({
        id: safeString(row.id),
        date: safeString(row.date),
        category: row.category as Expense['category'],
        description: safeString(row.description),
        amount: safeNumber(row.amount),
        created_by: safeString(row.created_by),
        created_at: safeString(row.created_at)
    }));
}

/**
 * Get a single expense by ID
 */
export function getExpense(id: string): Expense | null {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM expenses WHERE id = ?');
    const row = stmt.get(id) as ExpenseRow | undefined;

    if (!row) return null;

    return {
        id: safeString(row.id),
        date: safeString(row.date),
        category: row.category as Expense['category'],
        description: safeString(row.description),
        amount: safeNumber(row.amount),
        created_by: safeString(row.created_by),
        created_at: safeString(row.created_at)
    };
}

/**
 * Create a new expense
 */
export function createExpense(expense: CreateExpenseInput): void {
    const db = getDb();

    try {
        const stmt = db.prepare(`
      INSERT INTO expenses (id, date, category, description, amount, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            expense.id,
            expense.date,
            expense.category,
            expense.description,
            expense.amount,
            expense.created_by
        );

        logger.info('Created expense', { expenseId: expense.id, amount: expense.amount });
    } catch (error) {
        logger.error('Failed to create expense', { error });
        throw new AppError('Failed to create expense', 500, 'EXPENSE_CREATE_FAILED');
    }
}

/**
 * Update an existing expense
 */
export function updateExpense(update: UpdateExpenseInput): void {
    const db = getDb();

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];

    if (update.date !== undefined) {
        fields.push('date = ?');
        values.push(update.date);
    }
    if (update.category !== undefined) {
        fields.push('category = ?');
        values.push(update.category);
    }
    if (update.description !== undefined) {
        fields.push('description = ?');
        values.push(update.description);
    }
    if (update.amount !== undefined) {
        fields.push('amount = ?');
        values.push(update.amount);
    }
    if (update.created_by !== undefined) {
        fields.push('created_by = ?');
        values.push(update.created_by);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (fields.length === 1) return; // Only updated_at, meaning no real changes

    const query = `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`;
    values.push(update.id);

    try {
        const stmt = db.prepare(query);
        const result = stmt.run(...values);

        if (result.changes === 0) {
            throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
        }

        logger.info('Updated expense', { expenseId: update.id });
    } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error('Failed to update expense', { error });
        throw new AppError('Failed to update expense', 500, 'EXPENSE_UPDATE_FAILED');
    }
}

/**
 * Delete an expense
 */
export function deleteExpense(id: string): void {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
        logger.warn('Attempted to delete non-existent expense', { expenseId: id });
    } else {
        logger.info('Deleted expense', { expenseId: id });
    }
}

/**
 * Get expense summary by category
 */
export function getExpenseSummaryByCategory(startDate?: string, endDate?: string): Record<string, number> {
    const db = getDb();
    let query = 'SELECT category, SUM(amount) as total FROM expenses';
    const params: string[] = [];

    if (startDate && endDate) {
        query += ' WHERE date >= ? AND date <= ?';
        params.push(startDate, endDate);
    }

    query += ' GROUP BY category';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as { category: string; total: number }[];

    const summary: Record<string, number> = {};
    rows.forEach(row => {
        summary[row.category] = row.total;
    });

    return summary;
}

