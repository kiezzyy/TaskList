import { localApiDefaults } from './applicationConstants';

function getApiBase() {
  if (typeof window === 'undefined') {
    return localApiDefaults.developmentBaseUrl;
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

export function getConfiguredApiBase() {
  return getApiBase();
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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

  const payload = (await response.json().catch(() => null)) as { message?: string; details?: string[] } | null;
  return payload?.details?.join('\n') || payload?.message || `Request failed with status ${response.status}.`;
}

function buildUnexpectedResponseError(responseText: string, apiBase: string) {
  const trimmedResponse = responseText.trimStart();
  if (trimmedResponse.startsWith('<!doctype') || trimmedResponse.startsWith('<html')) {
    return `TaskList reached HTML instead of JSON at ${apiBase}. Check that the backend is running and the API base is correct.`;
  }

  return `Unexpected response from ${apiBase}. Check that the backend is running and the API base is correct.`;
}
