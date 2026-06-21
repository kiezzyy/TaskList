import { localApiDefaults } from './applicationConstants';

function getApiBase() {
  if (window.location.protocol === 'file:') {
    const apiPort = new URLSearchParams(window.location.search).get(localApiDefaults.packagedPortQueryKey) ?? localApiDefaults.packagedFallbackPort;
    return `http://${localApiDefaults.packagedHost}:${apiPort}/api`;
  }

  return localApiDefaults.developmentBaseUrl;
}

export const apiBase = getApiBase();

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
