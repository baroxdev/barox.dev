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

/** Parses every MDX source in a slug-to-raw-content map into Posts. */
export function loadPosts(
  sources: Record<string, string> = journalSources,
): Post[] {
  return Object.values(sources).map((raw) => parsePost(raw))
}
