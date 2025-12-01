'use client';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import HomeClient from '@/components/HomeClient';

export default function Page() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  // track whether we've mounted on the client
  // initialize false (server and initial client render will show same placeholder)
  const [mounted, setMounted] = useState(false);

  // defer the mounted state update to avoid "setState synchronously within an effect"
  useEffect(() => {
    const id = window.requestAnimationFrame
      ? window.requestAnimationFrame(() => setMounted(true))
      : window.setTimeout(() => setMounted(true), 0);

    return () => {
      if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
        window.cancelAnimationFrame(id as number);
      } else {
        clearTimeout(id as number);
      }
    };
  }, []);

  // While on the server (or before client mount) render a stable placeholder
  // that matches between server & first client render to avoid hydration mismatch.
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-md" />
            <div>
              <div className="h-4 w-40 bg-slate-200 rounded mb-1" />
              <div className="h-3 w-24 bg-slate-200 rounded" />
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm" aria-hidden>
              Login
            </button>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm" aria-hidden>
              Create account
            </button>
          </nav>
        </header>

        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-12">
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-full max-w-xl bg-slate-100 rounded" />
            <div className="h-40 bg-slate-100 rounded" />
          </div>

          <div className="order-first lg:order-last">
            <div className="bg-white rounded-2xl shadow-lg border p-5">
              <div className="h-48 bg-slate-50 rounded-lg border border-dashed border-slate-100" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  // after mount, mounted === true — now it's safe to branch on user
  if (!user) {
    // user is not logged in: show public landing (same visual as your original landing)
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 14l3-6 4 8 3-4" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900">Finance Tracker</div>
              <div className="text-xs text-slate-500">Personal finance made simple</div>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <button onClick={() => router.push('/login')} className="px-4 py-2 rounded-lg bg-white border border-slate-200 hover:shadow-sm text-sm">
              Login
            </button>
            <button onClick={() => router.push('/signup')} className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm shadow">
              Create account
            </button>
          </nav>
        </header>

        {/* keep the rest of your original landing markup here — shortened for brevity */}
        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-slate-900">
              Track & grow your money with a simple, beautiful dashboard
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-xl">
              Finance Tracker helps you log expenses, monitor income, and get monthly insights — so you can make better choices and reach your goals. Secure, fast, and free to try.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => router.push('/signup')} className="px-5 py-3 rounded-lg bg-indigo-600 text-white font-medium shadow hover:opacity-95">
                Create free account
              </button>

              <button onClick={() => router.push('/login')} className="px-5 py-3 rounded-lg border text-slate-700 bg-white">
                Sign in
              </button>
            </div>

            {/* example stats */}
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              <div className="bg-white rounded-lg p-3 border shadow-sm">
                <div className="text-sm text-slate-500">Avg. Monthly Spend</div>
                <div className="mt-1 font-semibold text-slate-800">₹ 14,320</div>
              </div>
              <div className="bg-white rounded-lg p-3 border shadow-sm">
                <div className="text-sm text-slate-500">Total Income (YTD)</div>
                <div className="mt-1 font-semibold text-slate-800">₹ 2,45,000</div>
              </div>
              <div className="bg-white rounded-lg p-3 border shadow-sm">
                <div className="text-sm text-slate-500">Accounts Connected</div>
                <div className="mt-1 font-semibold text-slate-800">3</div>
              </div>
            </div>
          </div>

          <div className="order-first lg:order-last">
            <div className="bg-white rounded-2xl shadow-lg border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-slate-500">Total balance</div>
                  <div className="text-2xl font-semibold text-slate-900">₹ 78,450</div>
                </div>
                <div className="text-sm text-slate-500">Updated just now</div>
              </div>

              <div className="h-56 bg-gradient-to-t from-white to-slate-50 rounded-lg border border-dashed border-slate-100 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <div className="text-sm">Sample dashboard preview</div>
                  <div className="mt-3 text-xs">Charts, quick-add, and insights will appear here</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg text-sm">
                  <div className="text-xs text-slate-500">This month</div>
                  <div className="font-medium text-slate-800">Spent ₹ 22,430</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-sm">
                  <div className="text-xs text-slate-500">Remaining</div>
                  <div className="font-medium text-slate-800">₹ 56,020</div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={() => router.push('/signup')} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white">Get started</button>
                <button onClick={() => router.push('/login')} className="py-2 px-3 rounded-lg border">Demo</button>
              </div>
            </div>
          </div>
        </section>

        {/* rest of landing content and footer (keep same as earlier) */}
      </main>
    );
  }

  // logged in: render the app/client dashboard
  return <HomeClient />;
}
