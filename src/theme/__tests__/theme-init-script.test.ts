import { describe, expect, it } from 'vitest'
import { THEME_STORAGE_KEY } from '../theme.ts'
import { themeInitScript } from '../theme-init-script.ts'

describe('themeInitScript', () => {
  it('references the shared theme storage key, not a duplicated literal', () => {
    expect(themeInitScript()).toContain(JSON.stringify(THEME_STORAGE_KEY))
  })

  it('checks prefers-color-scheme and applies the dark class', () => {
    const script = themeInitScript()
    expect(script).toContain('prefers-color-scheme: dark')
    expect(script).toContain("classList.add('dark')")
  })
})
