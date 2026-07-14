import { describe, expect, it, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  getStoredTheme,
  getSystemTheme,
  persistTheme,
  resolveInitialTheme,
} from '../theme.ts'

function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    __store: store,
  }
}

function fakeMatchMedia(prefersDark: boolean) {
  return vi.fn().mockReturnValue({ matches: prefersDark })
}

describe('getStoredTheme', () => {
  it('returns the stored theme when it is a valid value', () => {
    const storage = fakeStorage({ [THEME_STORAGE_KEY]: 'dark' })
    expect(getStoredTheme(storage)).toBe('dark')
  })

  it('returns null when nothing is stored', () => {
    const storage = fakeStorage()
    expect(getStoredTheme(storage)).toBeNull()
  })

  it('returns null for a corrupted/invalid stored value', () => {
    const storage = fakeStorage({ [THEME_STORAGE_KEY]: 'sepia' })
    expect(getStoredTheme(storage)).toBeNull()
  })
})

describe('getSystemTheme', () => {
  it('returns dark when the system prefers dark', () => {
    expect(getSystemTheme(fakeMatchMedia(true))).toBe('dark')
  })

  it('returns light when the system prefers light', () => {
    expect(getSystemTheme(fakeMatchMedia(false))).toBe('light')
  })
})

describe('resolveInitialTheme', () => {
  it('prefers the stored theme over the system preference', () => {
    const storage = fakeStorage({ [THEME_STORAGE_KEY]: 'light' })
    expect(resolveInitialTheme(storage, fakeMatchMedia(true))).toBe('light')
  })

  it('falls back to the system preference when nothing is stored', () => {
    const storage = fakeStorage()
    expect(resolveInitialTheme(storage, fakeMatchMedia(true))).toBe('dark')
    expect(resolveInitialTheme(storage, fakeMatchMedia(false))).toBe('light')
  })
})

describe('persistTheme', () => {
  it('writes the theme under the shared storage key', () => {
    const storage = fakeStorage()
    persistTheme(storage, 'dark')
    expect(storage.__store.get(THEME_STORAGE_KEY)).toBe('dark')
  })
})
