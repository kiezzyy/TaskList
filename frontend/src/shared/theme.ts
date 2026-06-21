export type ThemeMode = 'light' | 'dark';

const themeStorageKey = 'tasklist-theme';

export function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyThemeMode(themeMode: ThemeMode) {
  document.documentElement.dataset.theme = themeMode;
  document.documentElement.style.colorScheme = themeMode;
  window.localStorage.setItem(themeStorageKey, themeMode);
}
