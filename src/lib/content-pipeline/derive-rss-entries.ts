import { publishedSortedDesc } from './published-sorted-posts.ts'
import type { Post, RssEntry } from './types.ts'

/** RSS-feed-ready entries for published posts, most recent first. */
export function deriveRssEntries(posts: Post[]): RssEntry[] {
  return publishedSortedDesc(posts).map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
    link: `/journal/${post.slug}`,
    excerpt: post.excerpt,
  }))
}
