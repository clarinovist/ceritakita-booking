import { useState, useCallback } from 'react';
import { DateRange } from '@/lib/types';

export interface Expense {
    id: string;
    date: string;
    category: 'operational' | 'equipment' | 'marketing' | 'salary' | 'other';
    description: string;
    amount: number;
    created_by: string;
    created_at: string;
}

export type ExpenseFormData = Omit<Expense, 'id' | 'created_at' | 'created_by'>;

export function useExpenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Form data state
    const [formData, setFormData] = useState<ExpenseFormData>({
        date: new Date().toISOString().split('T')[0] ?? '',
        category: 'operational',
        description: '',
        amount: 0
    });

    const fetchExpenses = useCallback(async (dateRange?: DateRange) => {
        setLoading(true);
        try {
            let url = '/api/expenses';
            if (dateRange) {
                const params = new URLSearchParams({
                    startDate: dateRange.start,
                    endDate: dateRange.end
                });
                url += `?${params.toString()}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch expenses');
            const data = await res.json();
            setExpenses(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    const createExpense = async (data: ExpenseFormData) => {
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to create expense');
            }

            const newExpense = await res.json();
            setExpenses(prev => [newExpense, ...prev]);
            return newExpense;
        } catch (err) {
            throw err;
        }
    };

    const updateExpense = async (id: string, data: ExpenseFormData) => {
        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to update expense');
            }

            // Refetch or optimistic update
            setExpenses(prev => prev.map(exp =>
                exp.id === id ? { ...exp, ...data } : exp
            ));
        } catch (err) {
            throw err;
        }
    };

    const deleteExpense = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete expense');

            setExpenses(prev => prev.filter(exp => exp.id !== id));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete');
        }
    };

    const handleOpenModal = (expense?: Expense) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData({
                date: expense.date,
                category: expense.category,
                description: expense.description,
                amount: expense.amount
            });
        } else {
            setEditingExpense(null);
            setFormData({
                date: new Date().toISOString().split('T')[0] ?? '',
                category: 'operational',
                description: '',
                amount: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingExpense) {
                await updateExpense(editingExpense.id, formData);
                alert('Expense updated successfully');
            } else {
                await createExpense(formData);
                alert('Expense created successfully');
            }
            setIsModalOpen(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Operation failed');
        }
    };

    return {
        expenses,
        loading,
        error,
        fetchExpenses,
        createExpense,
        updateExpense,
        deleteExpense,
        isModalOpen,
        setIsModalOpen,
        editingExpense,
        formData,
        setFormData,
        handleOpenModal,
        handleSubmit
    };
}
