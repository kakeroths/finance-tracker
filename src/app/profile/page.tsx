// src/app/profile/page.tsx
'use client';
import React, { useContext, useEffect, useState } from 'react';
import API from '@/lib/api';
import { AuthContext, User as AuthUser } from '@/context/AuthContext';
import ChangePassword from '@/components/ChangePassword';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';

type UserPayload = {
  _id?: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
};

type Msg = { kind: 'success' | 'error'; text: string } | null;

type ProfileState = {
  user: UserPayload | null;
  form: { username: string; email: string };
  loading: boolean;
  saving: boolean;
  msg: Msg;
};

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const aErr = err as AxiosError<{ message?: string }>;
    return aErr.response?.data?.message ?? aErr.message ?? 'Request failed';
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

export default function ProfilePage() {
  const { user: ctxUser, logout, login } = useContext(AuthContext);
  const router = useRouter();

  const [state, setState] = useState<ProfileState>({
    user: null,
    form: { username: '', email: '' },
    loading: true,
    saving: false,
    msg: null,
  });

  // load profile (either from context or API)
  useEffect(() => {
    let mounted = true;

    async function loadFromApi() {
      try {
        const res = await API.get<UserPayload>('/user/me');
        if (!mounted) return;
        setState(prev => ({
          ...prev,
          user: res.data,
          form: { username: res.data.username, email: res.data.email },
          loading: false,
        }));
      } catch (err: unknown) {
        if (!mounted) return;
        console.error(err);
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout();
          router.push('/');
        } else {
          setState(prev => ({ ...prev, loading: false, msg: { kind: 'error', text: getErrorMessage(err) } }));
        }
      }
    }

    if (ctxUser) {
      const derived: UserPayload = {
        _id: ctxUser._id,
        username: ctxUser.username,
        email: ctxUser.email,
      };

      setState(prev => ({
        ...prev,
        user: derived,
        form: { username: derived.username, email: derived.email },
        loading: false,
      }));
    } else {
      loadFromApi();
    }

    return () => {
      mounted = false;
    };
  }, [ctxUser, logout, router]);

  const onSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setState(prev => ({ ...prev, saving: true, msg: null }));

    try {
      const res = await API.put<UserPayload>('/user/update', {
        username: state.form.username,
        email: state.form.email,
      });

      if (res.data._id) {
        const userForContext: AuthUser = {
          _id: res.data._id,
          username: res.data.username,
          email: res.data.email,
        };
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          await login(token, userForContext);
        }
      }

      setState(prev => ({
        ...prev,
        user: res.data,
        form: { username: res.data.username, email: res.data.email },
        saving: false,
        msg: { kind: 'success', text: 'Profile saved.' },
      }));
    } catch (err: unknown) {
      console.error(err);
      setState(prev => ({ ...prev, saving: false, msg: { kind: 'error', text: getErrorMessage(err) } }));
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const { user, form, loading, saving, msg } = state;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Header: avatar + title + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt="avatar"
                      className="w-20 h-20 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-indigo-500 text-white flex items-center justify-center text-2xl font-semibold">
                      {(user?.username?.charAt(0) ?? 'U').toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>
                  <p className="text-sm text-gray-500 mt-1">Manage your account details</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  Home
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="mt-6 border-t pt-6">
              <form onSubmit={onSave} className="grid grid-cols-1 gap-4">
                {/* Responsive grid: two columns on md+ for inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      value={form.username}
                      onChange={e => setState(prev => ({ ...prev, form: { ...prev.form, username: e.target.value } }))}
                      className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      value={form.email}
                      onChange={e => setState(prev => ({ ...prev, form: { ...prev.form, email: e.target.value } }))}
                      type="email"
                      className="mt-1 block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      required
                    />
                  </div>
                </div>

                {/* Password + ChangePassword: stack on small, side-by-side on md */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="mt-1 flex flex-col md:flex-row md:items-center gap-3">
                      <input value="••••••••" readOnly className="flex-1 px-3 py-2 border rounded" />
                      {/* On small screens ChangePassword will sit below input; on md+ it sits to the right */}
                      <div className="md:ml-0">
                        <ChangePassword />
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                {msg && (
                  <div className={msg.kind === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {msg.text}
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-3 text-sm text-gray-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="break-words">
              Account created with:{' '}
              <span className="font-medium text-gray-800">{user?.email}</span>
            </div>
            <div className="text-left md:text-right">Export or delete your data in Settings</div>
          </div>
        </div>
      </div>
    </div>
  );
}
