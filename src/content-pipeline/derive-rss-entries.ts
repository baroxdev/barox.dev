import { publishedSortedDesc } from './published-sorted-posts.ts'
import { toIndexEntry } from './to-index-entry.ts'
import type { Post, RssEntry } from './types.ts'

/** RSS-feed-ready entries for published posts, most recent first. */
export function deriveRssEntries(posts: Post[]): RssEntry[] {
  return publishedSortedDesc(posts).map((post) => ({
    ...toIndexEntry(post),
    link: `/journal/${post.slug}`,
  }))
}
