import { describe, expect, it } from 'vitest'
import { toIsoDateString } from '../to-iso-date-string.ts'

describe('toIsoDateString', () => {
  it('formats a Date as a plain YYYY-MM-DD string', () => {
    expect(toIsoDateString(new Date('2026-07-14'))).toBe('2026-07-14')
  })

  it('drops the time-of-day component', () => {
    expect(toIsoDateString(new Date('2026-01-05T18:30:00Z'))).toBe('2026-01-05')
  })
})
