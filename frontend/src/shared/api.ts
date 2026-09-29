import { localApiDefaults } from './applicationConstants';

function getApiBase() {
  const envBase = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_TASKLIST_API_BASE_URL : undefined;
  if (typeof envBase === 'string' && envBase.trim().length > 0) {
    return envBase.replace(/\/$/, '');
  }

  if (typeof window === 'undefined') {
    return localApiDefaults.developmentBaseUrl;
  }

  if (window.location.protocol === 'file:') {
    const apiPort = new URLSearchParams(window.location.search).get(localApiDefaults.packagedPortQueryKey) ?? localApiDefaults.packagedFallbackPort;
    return `http://${localApiDefaults.packagedHost}:${apiPort}/api`;
  }

  const hostname = window.location.hostname;
  const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
  if (isLoopback) {
    return localApiDefaults.developmentBaseUrl;
  }

  return new URL('/api', window.location.origin).toString().replace(/\/$/, '');
}

export function getConfiguredApiBase() {
  return getApiBase();
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiBase = getApiBase();
  const hasBody = options.body !== undefined && options.body !== null;
  const method = (options.method ?? 'GET').toUpperCase();
  const needsJsonContentType = hasBody || method === 'POST' || method === 'PATCH' || method === 'PUT';

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      ...(needsJsonContentType ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, apiBase));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseContentType = response.headers.get('content-type') ?? '';
  if (!responseContentType.includes('application/json')) {
    throw new Error(buildUnexpectedResponseError(await response.text(), apiBase));
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response, apiBase: string) {
  const responseContentType = response.headers.get('content-type') ?? '';
  if (!responseContentType.includes('application/json')) {
    return buildUnexpectedResponseError(await response.text(), apiBase);
  }

  const payload = (await response.json().catch(() => null)) as { message?: string; details?: string[] | string } | null;
  const detailsText = Array.isArray(payload?.details) ? payload.details.join('\n') : typeof payload?.details === 'string' ? payload.details : '';
  return detailsText || payload?.message || `Request failed with status ${response.status}.`;
}

function buildUnexpectedResponseError(responseText: string, apiBase: string) {
  const trimmedResponse = responseText.trimStart().toLowerCase();
  if (trimmedResponse.startsWith('<!doctype') || trimmedResponse.startsWith('<html')) {
    return `TaskList reached HTML instead of JSON at ${apiBase}. Check that the backend is running and the API base is correct.`;
  }

  return `Unexpected response from ${apiBase}. Check that the backend is running and the API base is correct.`;
}
