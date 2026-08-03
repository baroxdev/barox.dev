import { THEME_STORAGE_KEY } from './theme.ts'

/**
 * Inline script rendered as early as possible in <head> (see __root.tsx) so
 * the correct .dark class is applied before first paint/hydration — without
 * it, the page would flash the wrong theme on every load.
 */
export function themeInitScript(): string {
  const key = JSON.stringify(THEME_STORAGE_KEY)
  return `(function(){try{var s=localStorage.getItem(${key});var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`
}
