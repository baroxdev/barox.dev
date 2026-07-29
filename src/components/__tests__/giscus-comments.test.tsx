// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { GiscusComments } from '../giscus-comments.tsx'

describe('GiscusComments', () => {
  afterEach(() => {
    cleanup()
    document.documentElement.classList.remove('dark')
  })

  it('renders nothing when repoId/categoryId are not configured', () => {
    const { container } = render(<GiscusComments repoId="" categoryId="" />)

    expect(container.childElementCount).toBe(0)
    expect(container.querySelector('script')).toBeNull()
  })

  it('injects a giscus script with the configured data attributes once repoId/categoryId are set', () => {
    const { container } = render(
      <GiscusComments
        repo="baroxdev/barox.dev"
        repoId="R_test123"
        category="Comments"
        categoryId="DIC_test456"
        mapping="pathname"
      />,
    )

    const script = container.querySelector('script')
    expect(script).not.toBeNull()
    expect(script?.src).toBe('https://giscus.app/client.js')
    expect(script?.getAttribute('data-repo')).toBe('baroxdev/barox.dev')
    expect(script?.getAttribute('data-repo-id')).toBe('R_test123')
    expect(script?.getAttribute('data-category')).toBe('Comments')
    expect(script?.getAttribute('data-category-id')).toBe('DIC_test456')
    expect(script?.getAttribute('data-mapping')).toBe('pathname')
    expect(script?.getAttribute('data-loading')).toBe('lazy')
  })

  it('sets data-theme to light by default', () => {
    const { container } = render(
      <GiscusComments repoId="R_test123" categoryId="DIC_test456" />,
    )

    expect(container.querySelector('script')?.getAttribute('data-theme')).toBe(
      'light',
    )
  })

  it('sets data-theme to dark when the document is already in dark mode', () => {
    document.documentElement.classList.add('dark')

    const { container } = render(
      <GiscusComments repoId="R_test123" categoryId="DIC_test456" />,
    )

    expect(container.querySelector('script')?.getAttribute('data-theme')).toBe(
      'dark',
    )
  })
})
