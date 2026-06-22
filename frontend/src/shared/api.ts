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

  const isNativeShell = isCapacitorNativeShell();
  if (isNativeShell && window.location.hostname === 'localhost') {
    return null;
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

export function isMobileBackendSetupRequired() {
  return typeof window !== 'undefined' && isCapacitorNativeShell() && window.location.hostname === 'localhost' && !readOverride(window.localStorage.getItem('tasklist-api-base-url'));
}

export function setApiBaseOverride(apiBaseUrl: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (apiBaseUrl === null) {
      window.localStorage.removeItem('tasklist-api-base-url');
      return;
    }

    const normalizedApiBase = sanitizeApiBase(apiBaseUrl);
    if (!normalizedApiBase) {
      window.localStorage.removeItem('tasklist-api-base-url');
      return;
    }

    window.localStorage.setItem('tasklist-api-base-url', normalizedApiBase);
  } catch {
    // Ignore storage failures so the app keeps working.
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiBase = getApiBase();
  if (!apiBase) {
    throw new Error('Set a backend URL on mobile before using TaskList actions.');
  }

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
    return `TaskList reached HTML instead of JSON at ${apiBase}. On mobile, set the backend URL in the app before using workspace actions.`;
  }

  return `Unexpected response from ${apiBase}. Set the correct backend URL before using workspace actions.`;
}

function sanitizeApiBase(apiBaseUrl: string) {
  const trimmedValue = apiBaseUrl.trim().replace(/\/+$/, '');
  if (!trimmedValue) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null;
    }

    return parsedUrl.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function isCapacitorNativeShell() {
  const capacitorGlobal = window as Window & {
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  };
  return Boolean(capacitorGlobal.Capacitor?.isNativePlatform?.());
}
