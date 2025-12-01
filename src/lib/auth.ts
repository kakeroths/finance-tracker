// src/lib/auth.ts
export async function signIn(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || 'Login failed');

  // store token in localStorage for authJsonFetch to pick up
  if (typeof window !== 'undefined' && json.token) {
    localStorage.setItem('token', json.token);
  }

  return json;
}
