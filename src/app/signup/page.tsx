'use client';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useContext } from 'react';
import API from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { AuthContext } from '@/context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.username || !form.email || !form.password) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      // same API call as before — no change here
      await API.post('/auth/signup', form);

      router.push(`/signup/verify?email=${encodeURIComponent(form.email)}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white border shadow-md rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 14l3-6 4 8 3-4" />
            </svg>
          </div>

          <div>
            <h1 className="text-lg font-semibold">Finance Tracker</h1>
            <p className="text-xs text-slate-500">Create a new account</p>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-rose-600 bg-rose-50 p-3 rounded">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Username</label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100"
              placeholder="Your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Email</label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100"
              placeholder="you@example.com"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Password</label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100"
              placeholder="••••••••"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg shadow disabled:opacity-50"
            type="submit"
          >
            {loading ? 'Signing up...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-indigo-600 hover:underline"
            type="button"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
