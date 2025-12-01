// src/components/TransactionForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import API from '@/lib/api';
import { getErrorMessage } from '@/lib/error';

export default function TransactionForm({ onAdded }: { onAdded?: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [form, setForm] = useState({
    type: 'expense',
    description: '',
    amount: '',
    date: '',
  });

  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/transactions', {
        type: form.type,
        description: form.description,
        amount: Number(form.amount),
        date: form.date || undefined,
      });
      setForm({ type: 'expense', description: '', amount: '', date: '' });
      onAdded?.();
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="bg-white p-4 rounded" aria-hidden>
        <div className="h-8 w-1/3 bg-slate-100 rounded mb-3" />
        <div className="space-y-3 opacity-50">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
        <select
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value as 'income' | 'expense' })}
          className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-200"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <input
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="e.g., Grocery, Salary"
          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Amount</label>
        <input
          value={form.amount}
          onChange={e => setForm({ ...form, amount: e.target.value })}
          placeholder="0.00"
          type="number"
          min="0"
          step="0.01"
          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
        <input
          value={form.date}
          onChange={e => setForm({ ...form, date: e.target.value })}
          placeholder="YYYY-MM-DD"
          type="date"
          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div>
        <button
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium shadow hover:opacity-95 disabled:opacity-60"
        >
          {loading ? 'Adding...' : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Transaction
            </>
          )}
        </button>
      </div>
    </form>
  );
}
