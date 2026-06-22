import { localApiDefaults } from './applicationConstants';

function getApiBase() {
  if (typeof window === 'undefined') {
    return localApiDefaults.developmentBaseUrl;
  }

  const overrideFromStorage = readOverride(window.localStorage.getItem('tasklist-api-base-url'));
  if (overrideFromStorage) {
    return overrideFromStorage;
  }

  const overrideFromQuery = readOverride(new URLSearchParams(window.location.search).get('apiBase'));
  if (overrideFromQuery) {
    return overrideFromQuery;
  }

  if (window.location.protocol === 'file:') {
    const apiPort = new URLSearchParams(window.location.search).get(localApiDefaults.packagedPortQueryKey) ?? localApiDefaults.packagedFallbackPort;
    return `http://${localApiDefaults.packagedHost}:${apiPort}/api`;
  }

  const isLocalDevHost = window.location.hostname === 'localhost' && window.location.port === '5173';
  if (isLocalDevHost) {
    return localApiDefaults.developmentBaseUrl;
  }

  return new URL('/api', window.location.origin).toString().replace(/\/$/, '');
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

function readOverride(rawValue: string | null) {
  if (!rawValue) {
    return null;
  }

  const trimmedValue = rawValue.trim();
  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.replace(/\/+$/, '');
}
