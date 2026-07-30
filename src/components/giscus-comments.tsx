import { useEffect, useRef } from 'react'
import { useTheme } from '../theme/use-theme.ts'
import { GISCUS_CONFIG } from '../lib/giscus/giscus-config.ts'
import type { Theme } from '../theme/theme.ts'

const GISCUS_ORIGIN = 'https://giscus.app'

/**
 * giscus's iframe is a separate origin from ours, so it can't read our
 * page's CSS custom properties — its "custom theme" mechanism is instead a
 * URL to a real, publicly-hosted CSS file (see public/giscus/{light,dark}.css,
 * literal hex values duplicated from src/tokens/colors.css).
 *
 * Deliberately NOT `absoluteUrl()` (which always points at the canonical
 * production domain, correct for SEO tags but wrong here): this URL must
 * actually be fetchable by giscus's iframe *right now*, from whatever
 * deploy this page is actually running on. Pointing it at production when
 * running on canary — or any environment production hasn't caught up to
 * yet — 404s, and giscus silently falls back to its own default theme
 * instead of ours, which is exactly why toggling light/dark previously
 * looked broken: the widget never successfully loaded either custom theme
 * file, so it wasn't tracking our toggle at all. `window.location.origin`
 * always matches the host actually serving this request. Only called from
 * client-side effects below (never during SSR), so `window` is safe here.
 */
function giscusThemeUrl(theme: Theme): string {
  return `${window.location.origin}/giscus/${theme}.css`
}

export interface GiscusCommentsProps {
  repo?: string
  repoId?: string
  category?: string
  categoryId?: string
  mapping?: string
}

/**
 * GitHub-Discussions-backed comments (issue #15). Renders nothing until
 * repoId/categoryId are configured (see giscus-config.ts) — no broken
 * widget pointed at placeholder IDs.
 *
 * The script tag is injected in an effect (client-only, after the post's
 * own content has already rendered) with `data-loading="lazy"`, so giscus's
 * iframe uses native browser lazy-loading and never blocks/slows the
 * initial post page render. Mounted once; later theme changes are pushed
 * into the already-loaded iframe via postMessage rather than by re-creating
 * the widget, since giscus's own script only reads the theme at load time.
 */
export function GiscusComments({
  repo = GISCUS_CONFIG.repo,
  repoId = GISCUS_CONFIG.repoId,
  category = GISCUS_CONFIG.category,
  categoryId = GISCUS_CONFIG.categoryId,
  mapping = GISCUS_CONFIG.mapping,
}: GiscusCommentsProps = {}) {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !repoId || !categoryId) return

    // Read the DOM class directly rather than the `theme` state value: the
    // FOUC-prevention script (see __root.tsx) has already applied the
    // correct class by the time any effect runs, so this sidesteps any
    // dependency on exactly when useTheme's own state-correcting layout
    // effect has settled relative to this one.
    const initialTheme: Theme = document.documentElement.classList.contains(
      'dark',
    )
      ? 'dark'
      : 'light'

    const script = document.createElement('script')
    script.src = `${GISCUS_ORIGIN}/client.js`
    script.async = true
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-repo', repo)
    script.setAttribute('data-repo-id', repoId)
    script.setAttribute('data-category', category)
    script.setAttribute('data-category-id', categoryId)
    script.setAttribute('data-mapping', mapping)
    script.setAttribute('data-strict', '1')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-input-position', 'top')
    script.setAttribute('data-theme', giscusThemeUrl(initialTheme))
    script.setAttribute('data-lang', 'en')
    script.setAttribute('data-loading', 'lazy')
    container.appendChild(script)

    return () => {
      container.replaceChildren()
    }
    // Deliberately excludes `theme`: mount once, then push theme changes
    // into the already-loaded iframe via the effect below instead of
    // re-creating the widget.
  }, [repo, repoId, category, categoryId, mapping])

  useEffect(() => {
    const iframe = containerRef.current?.querySelector<HTMLIFrameElement>(
      'iframe.giscus-frame',
    )
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: giscusThemeUrl(theme) } } },
      GISCUS_ORIGIN,
    )
  }, [theme])

  if (!repoId || !categoryId) return null

  return <div ref={containerRef} className="mt-16 border-t border-border pt-10" />
}
