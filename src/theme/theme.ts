export type Theme = 'light' | 'dark'

/** Shared across theme.ts and the FOUC-prevention inline script in __root.tsx. */
export const THEME_STORAGE_KEY = 'barox-dev-theme'

interface ThemeStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

interface MediaQueryMatcher {
  (query: string): { matches: boolean }
}

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark'
}

export function getStoredTheme(
  storage: Pick<ThemeStorage, 'getItem'>,
): Theme | null {
  try {
    const value = storage.getItem(THEME_STORAGE_KEY)
    return isTheme(value) ? value : null
  } catch {
    // Storage access can throw (Safari private browsing, quota exceeded,
    // disabled by browser settings/extensions) — theme persistence is a
    // non-essential feature, so fall back to no stored preference rather
    // than breaking the page. Matches theme-init-script.ts's same choice.
    return null
  }
}

export function getSystemTheme(matchMedia: MediaQueryMatcher): Theme {
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveInitialTheme(
  storage: Pick<ThemeStorage, 'getItem'>,
  matchMedia: MediaQueryMatcher,
): Theme {
  return getStoredTheme(storage) ?? getSystemTheme(matchMedia)
}

export function persistTheme(
  storage: Pick<ThemeStorage, 'setItem'>,
  theme: Theme,
): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Same rationale as getStoredTheme: persistence is best-effort, not
    // essential — the toggle still works for the rest of the session even
    // if it can't be remembered across reloads.
  }
}
