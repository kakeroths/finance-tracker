// app/reset-password/confirm/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import API from '@/lib/api';
import axios, { AxiosError } from 'axios';

function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const aErr = err as AxiosError<{ message?: string }>;
    return aErr.response?.data?.message ?? aErr.message ?? 'Something went wrong';
  }
  if (err instanceof Error) return err.message;
  return 'Failed to reset password.';
}

export default function ResetConfirmPage() {
  const search = useSearchParams();
  const token = search.get('token') ?? '';
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError('Reset token missing. Use the link from your email.');
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) return setError('Missing token.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, password });
      setMsg('Password updated. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: unknown) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border p-8">
        <h2 className="text-lg font-semibold mb-2">Create a new password</h2>
        <p className="text-sm text-slate-500 mb-4">Choose a secure password for your account.</p>

        {error && <div className="mb-3 text-sm text-rose-600">{error}</div>}
        {msg && <div className="mb-3 text-sm text-green-700">{msg}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">New password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100" required minLength={6} />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100" required />
          </div>

          <div className="flex gap-2">
            <button disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white">
              {loading ? 'Saving...' : 'Save new password'}
            </button>
            <button type="button" onClick={() => router.push('/login')} className="py-2 px-3 border rounded-lg">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
