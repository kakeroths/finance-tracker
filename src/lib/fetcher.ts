// src/lib/fetcher.ts

export class FetchError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
  }
}

type Json = Record<string, unknown> | null;

export async function authJsonFetch<T = unknown>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[authJsonFetch] url', url);
    console.debug('[authJsonFetch] headers', Array.from(headers.entries()));
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: init.credentials ?? 'same-origin',
  });

  const text = await res.text();
  const ct = res.headers.get('content-type') || '';

  if (!ct.includes('application/json')) {
    console.error('[authJsonFetch] non-json response', {
      url,
      status: res.status,
      body: text,
    });
    throw new FetchError(`Server returned ${res.status}`, res.status);
  }

  const json: Json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && typeof json['message'] === 'string'
        ? json['message']
        : undefined) ||
      (json && typeof json === 'object' && typeof json['error'] === 'string'
        ? json['error']
        : undefined) ||
      `HTTP ${res.status}`;

    throw new FetchError(message, res.status);
  }

  return json as T;
}
