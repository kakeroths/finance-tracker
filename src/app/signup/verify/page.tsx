'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { useState, useContext, useEffect } from 'react';
import API from '@/lib/api';
import { AuthContext } from '@/context/AuthContext';
import axios, { AxiosError } from 'axios';
import { getErrorMessage } from '@/lib/error';
export default function VerifySignupPage() {
  const params = useSearchParams();
  const email = params.get('email');
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // show success modal after verification
  const [showSuccess, setShowSuccess] = useState(false);

  // If already logged in, redirect to app root and replace history (don't keep verify page)
  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  // If no email in query, send user back to signup (push is fine — user-initiated)
  useEffect(() => {
    if (!email) {
      router.push('/signup');
    }
  }, [email, router]);

  // close modal on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowSuccess(false);
    }
    if (showSuccess) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSuccess]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || !email) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    try {
      // Expect success status (we do not auto-login here; show confirmation modal instead)
      await API.post('/auth/signup/verify', { email, code });

      // Show confirmation modal
      setShowSuccess(true);
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    // user clicked the modal button: navigate to login page
    setShowSuccess(false);
    router.push('/login');
  };

  return (
    <div className="p-10 max-w-md mx-auto">
      <h2 className="text-2xl mb-3">Verify Email</h2>
      <p className="mb-3 text-gray-600">OTP sent to <strong>{email ?? '—'}</strong></p>

      {error && <div className="mb-3 text-sm text-rose-700 bg-rose-50 p-2 rounded">{error}</div>}

      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full p-2 border rounded"
          placeholder="Enter OTP"
          value={code}
          onChange={e => setCode(e.target.value)}
          disabled={loading}
          inputMode="numeric"
          autoComplete="one-time-code"
        />

        <button
          className="w-full p-2 bg-indigo-600 text-white rounded disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      {/* Success modal */}
      {showSuccess && (
        // overlay
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowSuccess(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reg-success-title"
            className="relative bg-white rounded-lg shadow-lg w-full max-w-sm p-6 z-10"
          >
            <h3 id="reg-success-title" className="text-lg font-semibold mb-2">Registration successful</h3>
            <p className="text-sm text-gray-600 mb-4">Your account is verified. Click the button below to sign in.</p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSuccess(false)}
                className="px-3 py-1 rounded border"
              >
                Close
              </button>

              <button
                onClick={goToLogin}
                className="px-3 py-1 rounded bg-indigo-600 text-white"
              >
                Go to login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
