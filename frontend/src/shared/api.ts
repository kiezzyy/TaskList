export const apiBase = window.location.protocol === 'file:'
  ? 'http://localhost:5000/api'
  : 'http://localhost:4000/api';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(payload.details?.join('\n') || payload.message || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
