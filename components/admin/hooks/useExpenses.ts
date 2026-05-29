import { useState, useCallback } from 'react';
import { DateRange } from '@/lib/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/fetch';

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

    const fetchExpenses = useCallback(async (dateRange?: DateRange, signal?: AbortSignal) => {
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

            const data = await apiGet<Expense[]>(url, { signal });
            if (!signal?.aborted) {
                setExpenses(data);
            }
        } catch (err) {
            if (!signal?.aborted) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, []);

    const createExpense = async (data: ExpenseFormData) => {
        try {
            const newExpense = await apiPost<Expense>('/api/expenses', data);
            setExpenses(prev => [newExpense, ...prev]);
            return newExpense;
        } catch (err) {
            throw err;
        }
    };

    const updateExpense = async (id: string, data: ExpenseFormData) => {
        try {
            await apiPut<Expense>(`/api/expenses/${id}`, data);
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
            await apiDelete(`/api/expenses/${id}`);
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
