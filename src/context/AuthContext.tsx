// src/context/AuthContext.tsx
'use client';
import React, { createContext, useEffect, useState } from 'react';

export type User = {
  _id: string;
  username: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  login: (token: string, user: User, remember?: boolean) => void;
  logout: () => void;
  token: string | null;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  token: null
});

function readStored() {
  try {
    const lsToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const lsUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (lsToken && lsUser) {
      return { token: lsToken, user: JSON.parse(lsUser) as User, remembered: true };
    }
    const ssToken = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    const ssUser = typeof window !== 'undefined' ? sessionStorage.getItem('user') : null;
    if (ssToken && ssUser) {
      return { token: ssToken, user: JSON.parse(ssUser) as User, remembered: false };
    }
  } catch {
    // ignore
  }
  return { token: null, user: null, remembered: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initial = typeof window !== 'undefined' ? readStored() : { token: null, user: null, remembered: false };
  const [user, setUser] = useState<User | null>(initial.user);
  const [token, setToken] = useState<string | null>(initial.token);

  // Keep storage in sync if something else modifies it (rare, but safe)
  useEffect(() => {
    function onStorage() {
      const s = readStored();
      setUser(s.user);
      setToken(s.token);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }
  }, []);

  const login = (tok: string, usr: User, remember = false) => {
    try {
      if (remember) {
        localStorage.setItem('token', tok);
        localStorage.setItem('user', JSON.stringify(usr));
        // clear session storage to avoid duplicates
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } else {
        sessionStorage.setItem('token', tok);
        sessionStorage.setItem('user', JSON.stringify(usr));
        // clear local storage to avoid duplicates
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch {
      // storage failure — fallback to memory only
      // nothing to do; still set state below
    }
    setToken(tok);
    setUser(usr);
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}
