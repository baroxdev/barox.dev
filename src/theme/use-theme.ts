import { useCallback, useLayoutEffect, useState } from 'react'
import { persistTheme } from './theme.ts'
import type { Theme } from './theme.ts'

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function useTheme() {
  // SSR-safe default; corrected on mount from whatever class the inline
  // FOUC-prevention script (see __root.tsx) already applied pre-hydration.
  const [theme, setThemeState] = useState<Theme>('light')

  // useLayoutEffect (not useEffect) so this runs before the browser paints —
  // otherwise ThemeToggle's icon would flash the wrong one for a frame in
  // dark mode, since useEffect fires after paint.
  useLayoutEffect(() => {
    setThemeState(
      document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    )
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyThemeClass(next)
    persistTheme(window.localStorage, next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme }
}
