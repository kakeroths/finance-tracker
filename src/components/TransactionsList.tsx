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

// Explicit small helper types (no `any`)
type TxType = '' | 'income' | 'expense';
type SortBy = 'date' | 'amount' | 'type';
type SortDir = 'asc' | 'desc';

type LocalEdits = Partial<{
  type: TxType;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: SortBy;
  sortDir: SortDir;
}>;

export default function TransactionsList({ data, onRefresh, query, setQuery }: Props) {
  const [edits, setEdits] = useState<LocalEdits>({});

  const limit = Number(query.limit ?? 8) || 8;

  const shown = useMemo(
    () => ({
      type: (edits.type ?? query.type ?? '') as TxType,
      startDate: edits.startDate ?? query.startDate ?? '',
      endDate: edits.endDate ?? query.endDate ?? '',
      minAmount: edits.minAmount ?? query.minAmount ?? '',
      maxAmount: edits.maxAmount ?? query.maxAmount ?? '',
      sortBy: (edits.sortBy ?? query.sortBy ?? 'date') as SortBy,
      sortDir: (edits.sortDir ?? query.sortDir ?? 'desc') as SortDir,
    }),
    [edits, query]
  );

  const goToPage = (newPage: number) => {
    setQuery({ page: newPage, limit });
    onRefresh({ page: newPage });
  };

  const applyFilters = () => {
    setQuery({
      page: 1,
      limit,
      type: shown.type || undefined,
      startDate: shown.startDate || undefined,
      endDate: shown.endDate || undefined,
      minAmount: shown.minAmount || undefined,
      maxAmount: shown.maxAmount || undefined,
      sortBy: shown.sortBy,
      sortDir: shown.sortDir,
    });
    onRefresh({ page: 1 });
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
      sortDir: 'desc',
    });
    onRefresh({ page: 1 });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await API.delete(`/transactions/${id}`);
      goToPage(1);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div>
      {/* FILTERS */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <select
            value={shown.type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setEdits(prev => ({ ...prev, type: e.target.value as TxType }))
            }
            className="p-2 border rounded-lg bg-white w-full sm:w-auto"
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <input
            type="date"
            value={shown.startDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdits(prev => ({ ...prev, startDate: e.target.value }))}
            className="p-2 border rounded-lg bg-white w-full sm:w-auto"
          />
          <input
            type="date"
            value={shown.endDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdits(prev => ({ ...prev, endDate: e.target.value }))}
            className="p-2 border rounded-lg bg-white w-full sm:w-auto"
          />

          <input
            placeholder="min"
            value={shown.minAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdits(prev => ({ ...prev, minAmount: e.target.value }))}
            className="p-2 border rounded-lg w-full sm:w-20"
          />
          <input
            placeholder="max"
            value={shown.maxAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEdits(prev => ({ ...prev, maxAmount: e.target.value }))}
            className="p-2 border rounded-lg w-full sm:w-20"
          />
        </div>

        {/* Right Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={shown.sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setEdits(prev => ({ ...prev, sortBy: e.target.value as SortBy }))
            }
            className="p-2 border rounded-lg bg-white w-full sm:w-auto"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="type">Sort by Type</option>
          </select>

          <select
            value={shown.sortDir}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setEdits(prev => ({ ...prev, sortDir: e.target.value as SortDir }))
            }
            className="p-2 border rounded-lg bg-white w-full sm:w-auto"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>

          <button onClick={applyFilters} className="px-3 py-1 rounded-lg bg-indigo-600 text-white w-full sm:w-auto">
            Apply
          </button>
          <button onClick={clearFilters} className="px-3 py-1 rounded-lg border w-full sm:w-auto">
            Clear
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {(!data || data.items.length === 0) ? (
          <div className="p-4 text-sm text-slate-500">No transactions</div>
        ) : (
          <ul>
            {data.items.slice(0, limit).map((t: Tx) => (
              <li
                key={t._id}
                className="flex flex-col md:flex-row md:justify-between md:items-center py-3 px-4 gap-3 hover:bg-slate-50"
              >
                <div className="w-full">
                  <div className="font-medium text-slate-800 break-words">
                    {t.description || (t.type === 'income' ? 'Income' : 'Expense')}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {t.date ? (() => {
                      try {
                        return format(new Date(t.date), 'yyyy-MM-dd HH:mm');
                      } catch {
                        return String(t.date);
                      }
                    })() : '—'}
                  </div>
                </div>

                <div className="flex md:flex-none justify-between md:justify-end items-center gap-3 w-full md:w-auto">
                  <div
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      t.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {t.amount}
                  </div>
                  <button
                    onClick={() => remove(t._id)}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* PAGINATION */}
      <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-slate-600">
          Page {data.page} / {data.pages} • Total {data.total}
        </div>

        <div className="flex gap-2">
          <button
            disabled={data.page <= 1}
            onClick={() => goToPage(data.page - 1)}
            className="px-3 py-1 rounded-lg border disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={data.page >= data.pages}
            onClick={() => goToPage(data.page + 1)}
            className="px-3 py-1 rounded-lg border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
