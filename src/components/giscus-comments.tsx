import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../theme/use-theme.ts'
import { GISCUS_CONFIG } from '../lib/giscus/giscus-config.ts'
import type { Theme } from '../theme/theme.ts'

const GISCUS_ORIGIN = 'https://giscus.app'

/** How long to wait for giscus's first resizeHeight message before giving
 * up on the skeleton and showing a fallback link instead (issue #52). */
const READY_TIMEOUT_MS = 8000

/** True for giscus's own "iframe has real content and a height" signal —
 * see lib/types/giscus.ts upstream. Fired on every content resize, but the
 * first one is a reliable "the widget actually loaded" event, which is all
 * this component uses it for. */
function isResizeHeightMessage(
  data: unknown,
): data is { giscus: { resizeHeight: number } } {
  if (typeof data !== 'object' || data === null || !('giscus' in data)) {
    return false
  }
  const giscus: unknown = data.giscus
  return typeof giscus === 'object' && giscus !== null && 'resizeHeight' in giscus
}

function CommentsSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      {[0, 1].map((row) => (
        <div key={row} className="flex gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-border" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-1/4 rounded bg-border" />
            <div className="h-3 w-full rounded bg-border" />
            <div className="h-3 w-2/3 rounded bg-border" />
          </div>
        </div>
      ))}
    </div>
  )
}

function CommentsFallback({ repo }: { repo: string }) {
  return (
    <p className="text-sm text-ink-muted">
      Comments didn&rsquo;t load —{' '}
      <a
        href={`https://github.com/${repo}/discussions`}
        target="_blank"
        rel="noreferrer"
      >
        view discussion on GitHub
      </a>{' '}
      instead.
    </p>
  )
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
 *
 * While the iframe hasn't mounted yet, a skeleton placeholder fills the gap
 * (issue #52) instead of blank space — replaced by the real widget on
 * giscus's first resizeHeight postMessage, or by a fallback link to the
 * discussion on GitHub if that never arrives within READY_TIMEOUT_MS.
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
  const [loaded, setLoaded] = useState(false)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !repoId || !categoryId) return

    setLoaded(false)
    setTimedOut(false)

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
    script.setAttribute('data-theme', initialTheme)
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
    if (!repoId || !categoryId) return

    function onMessage(event: MessageEvent) {
      if (event.origin !== GISCUS_ORIGIN) return
      if (isResizeHeightMessage(event.data)) setLoaded(true)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [repoId, categoryId])

  useEffect(() => {
    if (!repoId || !categoryId || loaded) return

    const timer = window.setTimeout(() => setTimedOut(true), READY_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [repoId, categoryId, loaded])

  useEffect(() => {
    const iframe = containerRef.current?.querySelector<HTMLIFrameElement>(
      'iframe.giscus-frame',
    )
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme } } },
      GISCUS_ORIGIN,
    )
  }, [theme])

  if (!repoId || !categoryId) return null

  return (
    <div className="mt-16 border-t border-border pt-10">
      {!loaded && (timedOut ? <CommentsFallback repo={repo} /> : <CommentsSkeleton />)}
      <div ref={containerRef} />
    </div>
  )
}
