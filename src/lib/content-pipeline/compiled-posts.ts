import type { MDXContent } from 'mdx/types'

/**
 * Compiled at build time by the custom Vite plugin in vite-mdx-plugin.ts
 * (same remark/Shiki config parsePost's validation-only compile uses) — not
 * at request time. Cloudflare Workers' isolate sandbox disallows the
 * `new Function()` call @mdx-js/mdx's runSync/run use internally (a
 * platform security boundary, not a config option), so MDX can't be
 * compiled from a stored string at request time on this deploy target —
 * only genuinely build-time-compiled components work.
 *
 * Keyed by filename (slug.mdx), matching the filename === frontmatter slug
 * convention this content directory already relies on (see
 * load-posts.test.ts's fixtures and every real post in content/journal/).
 *
 * Known limitation: unlike loadPosts()/getPost, this glob has no concept of
 * a post's `published` frontmatter field — every file under content/journal/
 * gets compiled into the client bundle regardless. The route only ever
 * looks a component up here after getPost's published-only check has
 * already passed, so an unpublished draft is never *served* — but its
 * compiled markup is still technically present in the shipped JS. Not worth
 * solving until this repo actually has unpublished drafts to protect.
 */
const compiledPostModules = import.meta.glob<{ default: MDXContent }>(
  '../../../content/journal/*.mdx',
  { eager: true },
)

function slugFromPath(path: string): string {
  return path.replace(/^.*\//, '').replace(/\.mdx$/, '')
}

const postComponentsBySlug: Record<string, MDXContent> = Object.fromEntries(
  Object.entries(compiledPostModules).map(([path, mod]) => [
    slugFromPath(path),
    mod.default,
  ]),
)

/**
 * The compiled MDX body component for a post, by slug — or undefined if no
 * matching file exists under content/journal/.
 */
export function getPostComponent(slug: string): MDXContent | undefined {
  return postComponentsBySlug[slug]
}
