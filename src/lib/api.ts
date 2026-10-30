import type { AppState } from '../domain/types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? 'http://127.0.0.1:8787' : '')).replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export type RemoteState = { initialized: boolean; state: AppState };

async function request<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', 'Bearer ' + token);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(API_BASE + path, { ...init, headers, credentials: 'omit' });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
      ? (body as { error: string }).error
      : 'request_failed';
    throw new ApiError(response.status, code);
  }
  return body as T;
}

export async function login(password: string): Promise<string> {
  const result = await request<{ token: string }>('/api/login', undefined, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  return result.token;
}

export function loadRemoteState(token: string): Promise<RemoteState> {
  return request<RemoteState>('/api/state', token);
}

export function saveRemoteState(token: string, state: AppState): Promise<{ ok: true }> {
  return request<{ ok: true }>('/api/state', token, {
    method: 'PUT',
    body: JSON.stringify(state),
  });
}

export function logout(token: string): Promise<{ ok: true }> {
  return request<{ ok: true }>('/api/logout', token, { method: 'POST' });
}

export function apiUrl(path: string): string {
  return API_BASE + path;
}

