// src/components/HomeClient.tsx
'use client';
import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import API from '@/lib/api';
import { AuthContext } from '@/context/AuthContext';
import TransactionForm from './TransactionForm';
import TransactionsList from './TransactionsList';
import { useRouter } from 'next/navigation';
import type { TxListResponse } from '@/types';
import axios from 'axios';
import Link from 'next/link';

export default function HomeClient() {
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TxListResponse>({ items: [], total: 0, page: 1, pages: 1 });
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    type: '' as '' | 'income' | 'expense',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date' as 'date' | 'amount' | 'type',
    sortDir: 'desc' as 'asc' | 'desc'
  });

  useEffect(() => setMounted(true), []);

  const fetchData = useCallback(async (override?: Partial<typeof query>) => {
    const q = { ...query, ...override };
    try {
      const res = await API.get<TxListResponse>('/transactions', {
        params: {
          page: q.page,
          limit: q.limit,
          type: q.type || undefined,
          startDate: q.startDate || undefined,
          endDate: q.endDate || undefined,
          minAmount: q.minAmount || undefined,
          maxAmount: q.maxAmount || undefined,
          sortBy: q.sortBy,
          sortDir: q.sortDir
        }
      });
      setData(res.data);
      if (override && typeof override.page === 'number') {
        setQuery(prev => ({ ...prev, page: override.page! }));
      }
      return true;
    } catch (err: unknown) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
        router.replace('/'); // use replace to avoid adding history entry
      }
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, logout, router]);

  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace('/login'); // replace instead of push
      return;
    }
    let isActive = true;
    (async () => {
      const ok = await fetchData();
      if (!isActive) return;
    })();
    return () => { isActive = false; };
  }, [mounted, user, fetchData, query, router]);

  const [open, setOpen] = useState(false);
  const ddRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!mounted) return;
    function onDoc(e: MouseEvent) {
      if (!ddRef.current) return;
      if (!ddRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [mounted]);

  const mergeQuery = (patch: Partial<typeof query>) => setQuery(prev => ({ ...prev, ...patch }));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 14l3-6 4 8 3-4" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Finance Tracker</div>
              <div className="text-xs text-slate-500">Personal finance made simple</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-4 text-sm">
              <Link href="/reports" className="text-slate-600 hover:text-slate-800">Reports</Link>
              <Link href="/analytics" className="text-slate-600 hover:text-slate-800">Analytics</Link>
            </nav>

            <div className="relative" ref={ddRef}>
              <button
                onClick={() => { if (mounted) setOpen(v => !v); }}
                className="flex items-center gap-3 rounded-full px-3 py-1.5 bg-white shadow-sm border border-slate-100 hover:shadow-md"
                aria-expanded={open}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-700">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-sm font-medium text-slate-800">{user?.username ?? 'User'}</span>
                  <span className="text-xs text-slate-500">{user?.email ?? ''}</span>
                </div>
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>

              {mounted && open && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border z-30 overflow-hidden">
                  <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-slate-50">Profile</Link>
                  <button
                    onClick={() => { logout(); router.replace('/'); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-6 border border-slate-100">
            <h3 className="text-lg font-semibold mb-3">Add Transaction</h3>
            <TransactionForm onAdded={() => { mergeQuery({ page: 1 }); fetchData({ page: 1 }); }} />
          </div>
        </section>

        <section className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <div className="text-sm text-slate-500">Showing page {query.page} • {data.total ?? 0} items</div>
            </div>

            <TransactionsList
              data={data}
              query={query}
              setQuery={(q) => { mergeQuery(q); fetchData(q); }}
              onRefresh={(o) => { mergeQuery(o || {}); fetchData(o || {}); }}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
