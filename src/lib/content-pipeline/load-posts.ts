import { parsePost } from './parse-post.ts'
import type { Post } from './types.ts'

/**
 * Bundled at build time via Vite's import.meta.glob (raw string content) so
 * this works in the Cloudflare Workers runtime, which has no filesystem —
 * node:fs isn't available there.
 */
const journalSources = import.meta.glob<string>(
  '../../../content/journal/*.mdx',
  { eager: true, query: '?raw', import: 'default' },
)

function parseAll(sources: Record<string, string>): Promise<Post[]> {
  return Promise.all(Object.values(sources).map((raw) => parsePost(raw)))
}

/**
 * Memoized for the default (bundled content) call path only — content never
 * changes at runtime, so there's no reason to re-parse/re-validate/re-compile
 * (for remarkResolveContentMarkers's fail-fast checks) on every request.
 * Test callers that pass an explicit `sources` map bypass the cache
 * entirely.
 */
let cachedDefaultPosts: Promise<Post[]> | undefined

/** Parses every MDX source in a slug-to-raw-content map into Posts. */
export function loadPosts(sources?: Record<string, string>): Promise<Post[]> {
  if (sources !== undefined) return parseAll(sources)

  cachedDefaultPosts ??= parseAll(journalSources)
  return cachedDefaultPosts
}
