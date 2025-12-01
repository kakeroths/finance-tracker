// src/components/TransactionsList.tsx
'use client';
import React, { useMemo, useState } from 'react';
import API from '@/lib/api';
import type { Tx, TxListResponse } from '@/types';
import axios, { AxiosError } from 'axios';
import { format } from 'date-fns';

type Props = {
  data: TxListResponse;
  onRefresh: (q?: { page?: number }) => void;
  query: {
    page: number;
    limit: number;
    type?: '' | 'income' | 'expense';
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
    sortBy?: 'date' | 'amount' | 'type';
    sortDir?: 'asc' | 'desc';
  };
  setQuery: (q: Partial<Props['query']>) => void;
};

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const aErr = err as AxiosError<{ message?: string }>;
    return aErr.response?.data?.message ?? aErr.message ?? 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

type LocalEdits = Partial<{
  type: '' | 'income' | 'expense';
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: 'date' | 'amount' | 'type';
  sortDir: 'asc' | 'desc';
}>;

export default function TransactionsList({ data, onRefresh, query, setQuery }: Props) {
  const [edits, setEdits] = useState<LocalEdits>({});

  // ensure we always use a numeric limit (default 8)
  const limit = Number(query.limit ?? 8) || 8;

  const shown = useMemo(() => {
    return {
      type: (edits.type ?? (query.type ?? '')) as '' | 'income' | 'expense',
      startDate: edits.startDate ?? query.startDate ?? '',
      endDate: edits.endDate ?? query.endDate ?? '',
      minAmount: edits.minAmount ?? query.minAmount ?? '',
      maxAmount: edits.maxAmount ?? query.maxAmount ?? '',
      sortBy: (edits.sortBy ?? query.sortBy ?? 'date') as 'date' | 'amount' | 'type',
      sortDir: (edits.sortDir ?? query.sortDir ?? 'desc') as 'asc' | 'desc'
    };
  }, [edits, query]);

  const goToPage = (newPage: number) => {
    // preserve the limit when navigating
    setQuery({ page: newPage, limit });
    // parent may use onRefresh to fetch immediately; keep existing contract
    onRefresh({ page: newPage });
  };

  const applyFilters = () => {
    setQuery({
      page: 1,
      limit,
      type: shown.type === '' ? undefined : shown.type,
      startDate: shown.startDate === '' ? undefined : shown.startDate,
      endDate: shown.endDate === '' ? undefined : shown.endDate,
      minAmount: shown.minAmount === '' ? undefined : shown.minAmount,
      maxAmount: shown.maxAmount === '' ? undefined : shown.maxAmount,
      sortBy: shown.sortBy,
      sortDir: shown.sortDir
    });
    // trigger refresh for page 1
    onRefresh({ page: 1 });
    setEdits({});
  };

  const clearFilters = () => {
    setEdits({});
    setQuery({
      page: 1,
      limit,
      type: undefined,
      startDate: undefined,
      endDate: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      sortBy: 'date',
      sortDir: 'desc'
    });
    onRefresh({ page: 1 });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await API.delete(`/transactions/${id}`);
      // After deletion, go to page 1 (preserving limit)
      goToPage(1);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex gap-2 items-center flex-wrap">
          <select
            value={shown.type}
            onChange={e => setEdits(prev => ({ ...prev, type: (e.target.value as '' | 'income' | 'expense') }))}
            className="p-2 border rounded-lg bg-white"
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <input
            type="date"
            value={shown.startDate}
            onChange={e => setEdits(prev => ({ ...prev, startDate: e.target.value }))}
            className="p-2 border rounded-lg bg-white"
          />
          <input
            type="date"
            value={shown.endDate}
            onChange={e => setEdits(prev => ({ ...prev, endDate: e.target.value }))}
            className="p-2 border rounded-lg bg-white"
          />
          <input
            placeholder="min"
            value={shown.minAmount}
            onChange={e => setEdits(prev => ({ ...prev, minAmount: e.target.value }))}
            className="p-2 border rounded-lg w-20"
          />
          <input
            placeholder="max"
            value={shown.maxAmount}
            onChange={e => setEdits(prev => ({ ...prev, maxAmount: e.target.value }))}
            className="p-2 border rounded-lg w-20"
          />
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={shown.sortBy}
            onChange={e => setEdits(prev => ({ ...prev, sortBy: e.target.value as 'date' | 'amount' | 'type' }))}
            className="p-2 border rounded-lg bg-white"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="type">Sort by Type</option>
          </select>

          <select
            value={shown.sortDir}
            onChange={e => setEdits(prev => ({ ...prev, sortDir: e.target.value as 'asc' | 'desc' }))}
            className="p-2 border rounded-lg bg-white"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>

          <button onClick={applyFilters} className="px-3 py-1 rounded-lg bg-indigo-600 text-white">Apply</button>
          <button onClick={clearFilters} className="px-3 py-1 rounded-lg border">Clear</button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm">
        {(!data || (data.items ?? []).length === 0) ? (
          <div className="p-4 text-sm text-slate-500">No transactions</div>
        ) : (
          <ul>
            {(data.items ?? []).slice(0, limit).map((t: Tx) => (
              <li key={t._id} className="flex justify-between items-center gap-4 py-3 px-4 hover:bg-slate-50">
                <div className="flex gap-3 items-start">
                  <div className="flex flex-col">
                    <div className="font-medium text-slate-800">{t.description || (t.type === 'income' ? 'Income' : 'Expense')}</div>
                    <div className="text-xs text-slate-500">
                      {t.date ? (() => { try { return format(new Date(t.date), 'yyyy-MM-dd HH:mm'); } catch { return String(t.date); } })() : '—'}
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${t.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {t.amount}
                  </div>
                  <div className="text-xs mt-1">
                    <button onClick={() => remove(t._id)} className="text-xs text-rose-500 hover:underline">Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-slate-600">Page {data?.page ?? 0} / {data?.pages ?? 0} • Total {data?.total ?? 0}</div>
        <div className="space-x-2">
          <button
            disabled={(data?.page ?? 0) <= 1}
            onClick={() => goToPage((data?.page ?? 1) - 1)}
            className="px-3 py-1 rounded-lg border disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={(data?.page ?? 0) >= (data?.pages ?? 0)}
            onClick={() => goToPage((data?.page ?? 1) + 1)}
            className="px-3 py-1 rounded-lg border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
