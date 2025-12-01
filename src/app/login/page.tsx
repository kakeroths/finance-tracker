'use client';
import React, { useEffect, useState, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import { AuthContext } from '@/context/AuthContext';
import axios, { AxiosError, AxiosResponse } from 'axios';

type LoginForm = { email: string; password: string; };
type LoginUser = { id?: string; _id?: string; name?: string; username?: string; email: string; };
type LoginResponse = { token: string; user: LoginUser; };

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const aErr = err as AxiosError<{ message?: string }>;
    return aErr.response?.data?.message ?? aErr.message ?? 'Login failed';
  }
  if (err instanceof Error) return err.message;
  return 'Login failed';
}

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useContext(AuthContext);

  // If user already logged in, redirect away from login page immediately
  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email || !form.password) { setError('Please enter email and password'); return; }

    setLoading(true);
    try {
      const res: AxiosResponse<LoginResponse> = await API.post<LoginResponse>('/auth/login', form);
      const { token, user: serverUser } = res.data;
      if (!token || !serverUser) throw new Error('Invalid server response');

      const mappedUser = {
        _id: serverUser._id ?? serverUser.id ?? '',
        username: serverUser.username ?? serverUser.name ?? (serverUser.email?.split('@')?.[0] ?? 'User'),
        email: serverUser.email ?? ''
      };

      // login will persist to local/session storage depending on "remember"
      login(token, mappedUser, remember);

      // Use replace so the login route is NOT kept in browser history
      router.replace('/');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
            <p className="text-xs text-slate-500">Sign in to your account</p>
          </div>
        </div>

        {error && <div className="mb-4 text-sm text-rose-600 bg-rose-50 p-3 rounded">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full border rounded-lg px-3 py-2 pr-12 focus:ring-2 focus:ring-indigo-100"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span className="text-slate-600">Remember me</span>
            </label>

            <Link href="/reset-password" className="text-indigo-600 hover:underline">Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg shadow disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don’t have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  );
}
