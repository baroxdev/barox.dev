import { publishedSortedDesc } from './published-sorted-posts.ts'
import { toIndexEntry } from './to-index-entry.ts'
import type { Post, TagIndex } from './types.ts'

/** Maps each tag to its published posts, most recent first. */
export function deriveTagIndex(posts: Post[]): TagIndex {
  return publishedSortedDesc(posts).reduce<TagIndex>(
    (index, post) => addPostToIndex(index, post),
    {},
  )
}

function addPostToIndex(index: TagIndex, post: Post): TagIndex {
  const entry = toIndexEntry(post)
  return post.tags.reduce<TagIndex>(
    (nextIndex, tag) => ({
      ...nextIndex,
      [tag]: [...(nextIndex[tag] ?? []), entry],
    }),
    index,
  )
}
