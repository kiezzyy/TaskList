const releaseInfoUrl = 'https://api.github.com/repos/kiezzyy/TaskList/releases/latest';
const releaseCacheKey = 'tasklist-release-check';
const releaseDismissKey = 'tasklist-release-dismissed-version';
const releaseCacheTtlMs = 10 * 60 * 1000;

export type ReleaseUpdateState = {
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  publishedAt: string | null;
};

export async function checkForReleaseUpdate() {
  if (!import.meta.env.PROD) {
    return null;
  }

  const currentVersion = getCurrentAppVersion();
  const cachedState = readCachedReleaseState();
  if (cachedState && Date.now() - cachedState.checkedAt < releaseCacheTtlMs) {
    return createReleaseState(currentVersion, cachedState.latestVersion, cachedState.releaseUrl, cachedState.publishedAt);
  }

  try {
    const response = await fetch(releaseInfoUrl, {
      headers: {
        Accept: 'application/vnd.github+json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      tag_name?: string;
      html_url?: string;
      published_at?: string;
    };
    const latestVersion = normalizeVersion(payload.tag_name ?? '');
    const releaseUrl = payload.html_url ?? `https://github.com/kiezzyy/TaskList/releases/latest`;
    if (!latestVersion) {
      return null;
    }

    writeCachedReleaseState({
      checkedAt: Date.now(),
      latestVersion,
      releaseUrl,
      publishedAt: payload.published_at ?? null
    });

    return createReleaseState(currentVersion, latestVersion, releaseUrl, payload.published_at ?? null);
  } catch {
    return null;
  }
}

export function isDismissedRelease(version: string) {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(releaseDismissKey) === version;
}

export function dismissReleaseUpdate(version: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(releaseDismissKey, version);
}

function createReleaseState(currentVersion: string, latestVersion: string, releaseUrl: string, publishedAt: string | null): ReleaseUpdateState | null {
  if (!latestVersion || compareVersions(latestVersion, currentVersion) <= 0) {
    return null;
  }

  return {
    currentVersion,
    latestVersion,
    releaseUrl,
    publishedAt
  };
}

function getCurrentAppVersion() {
  return normalizeVersion(import.meta.env.VITE_TASKLIST_APP_VERSION ?? '0.0.0');
}

function normalizeVersion(version: string) {
  return version.trim().replace(/^v/i, '');
}

function compareVersions(firstVersion: string, secondVersion: string) {
  const firstParts = parseVersionParts(firstVersion);
  const secondParts = parseVersionParts(secondVersion);

  for (let index = 0; index < 3; index += 1) {
    const difference = firstParts[index] - secondParts[index];
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

function parseVersionParts(version: string) {
  return normalizeVersion(version)
    .split('.')
    .slice(0, 3)
    .map((part) => Number(part) || 0)
    .concat([0, 0, 0])
    .slice(0, 3);
}

function readCachedReleaseState() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(releaseCacheKey);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as {
      checkedAt?: number;
      latestVersion?: string;
      releaseUrl?: string;
      publishedAt?: string | null;
    };

    if (!parsedValue.checkedAt || !parsedValue.latestVersion || !parsedValue.releaseUrl) {
      return null;
    }

    return {
      checkedAt: parsedValue.checkedAt,
      latestVersion: parsedValue.latestVersion,
      releaseUrl: parsedValue.releaseUrl,
      publishedAt: parsedValue.publishedAt ?? null
    };
  } catch {
    return null;
  }
}

function writeCachedReleaseState(state: { checkedAt: number; latestVersion: string; releaseUrl: string; publishedAt: string | null }) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(releaseCacheKey, JSON.stringify(state));
  } catch {
    // Ignore storage failures.
  }
}
