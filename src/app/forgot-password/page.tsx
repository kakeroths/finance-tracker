'use client';
import React, { useState } from 'react';
import { getErrorMessage } from "@/lib/error";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error(await res.text());
      setSent(true);
    } catch (err: unknown) {
              alert(getErrorMessage(err));
            } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Forgot password</h2>
      {sent ? (
        <div className="bg-green-50 p-4 rounded">If the email exists, we sent instructions. Check your inbox.</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm">Email</label>
            <input className="w-full border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} required type="email" />
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </div>
  );
}
