// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GiscusComments } from '../giscus-comments.tsx'
import { useTheme } from '../../theme/use-theme.ts'

function dispatchGiscusMessage(data: unknown, origin = 'https://giscus.app') {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, origin }))
  })
}

vi.mock('../../theme/use-theme.ts', () => ({
  useTheme: vi.fn(),
}))

describe('GiscusComments', () => {
  beforeEach(() => {
    vi.mocked(useTheme).mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
    document.documentElement.classList.remove('dark')
    vi.clearAllMocks()
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

  // Regression test for a real bug: data-theme (and the later postMessage
  // theme update) must point at whatever origin is actually serving the
  // page, not the hardcoded canonical production domain (what `absoluteUrl`
  // from lib/seo/site-url.ts gives you). Pointing at production while
  // running on canary — or anywhere production hasn't caught up to — 404s,
  // and giscus silently falls back to its own default theme instead of
  // ours, which is why toggling light/dark previously looked broken: the
  // widget never actually loaded either custom theme file.
  it('points data-theme at the current origin, not a hardcoded production domain', () => {
    const { container } = render(
      <GiscusComments repoId="R_test123" categoryId="DIC_test456" />,
    )

    const themeUrl = container.querySelector('script')?.getAttribute('data-theme')
    expect(themeUrl).toBe(`${window.location.origin}/giscus/light.css`)
    expect(themeUrl).not.toContain('barox.dev')
  })

  it('points data-theme at the dark theme CSS when the document is already in dark mode', () => {
    document.documentElement.classList.add('dark')

    const { container } = render(
      <GiscusComments repoId="R_test123" categoryId="DIC_test456" />,
    )

    expect(container.querySelector('script')?.getAttribute('data-theme')).toBe(
      `${window.location.origin}/giscus/dark.css`,
    )
  })

  it('pushes the current-origin theme URL into the already-loaded iframe via postMessage when the theme changes', () => {
    const { container, rerender } = render(
      <GiscusComments repoId="R_test123" categoryId="DIC_test456" />,
    )

    // Simulate giscus's own client.js having already created its iframe —
    // we can't run the real third-party script in a unit test. Append next
    // to the injected script (its actual parent), not any particular
    // wrapper element, since that's an implementation detail of the
    // skeleton/fallback markup around it.
    const iframe = document.createElement('iframe')
    iframe.className = 'giscus-frame'
    container.querySelector('script')?.parentElement?.appendChild(iframe)
    const postMessage = vi.fn()
    Object.defineProperty(iframe, 'contentWindow', {
      value: { postMessage },
      configurable: true,
    })

    vi.mocked(useTheme).mockReturnValue({
      theme: 'dark',
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    })
    rerender(<GiscusComments repoId="R_test123" categoryId="DIC_test456" />)

    expect(postMessage).toHaveBeenCalledWith(
      { giscus: { setConfig: { theme: `${window.location.origin}/giscus/dark.css` } } },
      'https://giscus.app',
    )
  })

  it('shows a skeleton placeholder before giscus has signaled it loaded', () => {
    const { container } = render(
      <GiscusComments repoId="R_test123" categoryId="DIC_test456" />,
    )

    expect(container.querySelector('.animate-pulse')).not.toBeNull()
    expect(container.textContent).not.toContain("didn’t load")
  })

  it('hides the skeleton once giscus posts its first resizeHeight message', () => {
    const { container } = render(
      <GiscusComments repoId="R_test123" categoryId="DIC_test456" />,
    )
    expect(container.querySelector('.animate-pulse')).not.toBeNull()

    dispatchGiscusMessage({ giscus: { resizeHeight: 480 } })

    expect(container.querySelector('.animate-pulse')).toBeNull()
  })

  it('ignores a resizeHeight-shaped message from a different origin', () => {
    const { container } = render(
      <GiscusComments repoId="R_test123" categoryId="DIC_test456" />,
    )

    dispatchGiscusMessage(
      { giscus: { resizeHeight: 480 } },
      'https://not-giscus.example',
    )

    expect(container.querySelector('.animate-pulse')).not.toBeNull()
  })

  it('ignores an unrelated giscus message (e.g. signOut) — only resizeHeight counts as loaded', () => {
    const { container } = render(
      <GiscusComments repoId="R_test123" categoryId="DIC_test456" />,
    )

    dispatchGiscusMessage({ giscus: { signOut: true } })

    expect(container.querySelector('.animate-pulse')).not.toBeNull()
  })

  describe('load timeout', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('replaces the skeleton with a fallback link to the GitHub discussion if nothing loads within the timeout', () => {
      const { container } = render(
        <GiscusComments repo="baroxdev/barox.dev" repoId="R_test123" categoryId="DIC_test456" />,
      )
      expect(container.querySelector('.animate-pulse')).not.toBeNull()

      act(() => {
        vi.advanceTimersByTime(8000)
      })

      expect(container.querySelector('.animate-pulse')).toBeNull()
      expect(container.textContent).toContain("didn’t load")
      const link = container.querySelector('a')
      expect(link?.getAttribute('href')).toBe(
        'https://github.com/baroxdev/barox.dev/discussions',
      )
    })

    it('does not show the timeout fallback if giscus loads before the timeout elapses', () => {
      const { container } = render(
        <GiscusComments repoId="R_test123" categoryId="DIC_test456" />,
      )

      dispatchGiscusMessage({ giscus: { resizeHeight: 480 } })
      act(() => {
        vi.advanceTimersByTime(8000)
      })

      expect(container.textContent).not.toContain("didn’t load")
    })
  })
})
