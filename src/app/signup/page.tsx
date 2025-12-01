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

  // If already logged in, redirect to app root and replace history
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
      await API.post('/auth/signup', form);

      // user should be allowed to go back to signup → so use push()
      router.push(`/signup/verify?email=${encodeURIComponent(form.email)}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // While redirecting away show nothing (avoids flash)
  if (user) return null;

  return (
    <div className="p-10 max-w-md mx-auto">
      <h2 className="text-2xl mb-3">Signup</h2>

      {error && (
        <div className="mb-2 p-3 bg-rose-100 text-rose-700 rounded text-sm">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full p-2 border rounded"
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />

        <input
          className="w-full p-2 border rounded"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <button
          disabled={loading}
          className="w-full p-2 bg-green-600 text-white rounded disabled:opacity-60"
        >
          {loading ? 'Signing up...' : 'Signup'}
        </button>
      </form>
    </div>
  );
}
