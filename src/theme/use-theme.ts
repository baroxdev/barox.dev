import { useCallback, useEffect, useState } from 'react'
import { persistTheme } from './theme.ts'
import type { Theme } from './theme.ts'

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function useTheme() {
  // SSR-safe default; corrected on mount from whatever class the inline
  // FOUC-prevention script (see __root.tsx) already applied pre-hydration.
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
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
