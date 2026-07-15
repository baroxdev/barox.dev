import type { Post } from './types.ts'

/** Published posts only, ordered most recent first. */
export function publishedSortedDesc(posts: Post[]): Post[] {
  return posts
    .filter((post) => post.published)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}
