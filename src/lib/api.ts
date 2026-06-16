const DEFAULT_API_URL = 'http://localhost:3001';

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nr_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nr_token', token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('nr_token');
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function apiRequest(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
): Promise<any> {
  const baseUrl = getApiUrl().replace(/\/$/, '');
  const url = `${baseUrl}/${path.replace(/^\//, '')}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const resp = await fetch(url, options);

  if (resp.status === 401 && path !== 'auth/login' && path !== 'auth/admin/login') {
    // Session expired, clean up and redirect
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new Error('Sesi Anda telah berakhir. Silakan masuk kembali.');
  }

  const text = await resp.text();
  const data = text ? JSON.parse(text) : null;

  if (!resp.ok) {
    throw new ApiError(
      data?.message || 'Terjadi kesalahan pada server.',
      resp.status,
    );
  }

  return data;
}

export const api = {
  get: (path: string) => apiRequest(path, 'GET'),
  post: (path: string, body?: any) => apiRequest(path, 'POST', body),
  put: (path: string, body?: any) => apiRequest(path, 'PUT', body),
  delete: (path: string) => apiRequest(path, 'DELETE'),
};
