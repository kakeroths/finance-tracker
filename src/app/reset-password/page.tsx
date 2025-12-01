// app/reset-password/page.tsx
'use client';
import React, { useState } from 'react';
import API from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) return setError('Please enter your email.');

    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email });
      // If API returns dev token in non-production, capture it for quick testing
      if (res?.data?.token) setDevToken(res.data.token);
      setSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border p-8">
        <h2 className="text-lg font-semibold mb-2">Reset your password</h2>
        <p className="text-sm text-slate-500 mb-4">Enter your email and we’ll send instructions to reset your password.</p>

        {error && <div className="mb-4 text-sm text-rose-600">{error}</div>}

        {sent ? (
          <div className="bg-green-50 border border-green-100 p-4 rounded text-sm text-green-800">
            If an account exists for <strong>{email}</strong>, we’ve sent password reset instructions. Check your inbox and spam folder.
            <div className="mt-3 text-xs text-slate-600">Didnt receive it? Try again or contact support.</div>
            <div className="mt-4 flex gap-2">
              <Link href="/login" className="px-3 py-2 rounded-lg border text-sm">Back to sign in</Link>
              <button onClick={() => { setSent(false); setEmail(''); setDevToken(null); }} className="px-3 py-2 rounded-lg bg-white border text-sm">Send again</button>
            </div>
            {devToken && (
              <div className="mt-3 text-xs text-slate-600">
                Dev token (non-prod only): <code className="bg-slate-100 px-2 py-1 rounded">{devToken}</code>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100" placeholder="you@example.com" required />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <Link href="/login" className="py-2 px-3 border rounded-lg text-sm">Back</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
