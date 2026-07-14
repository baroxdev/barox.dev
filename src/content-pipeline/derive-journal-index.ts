import { publishedSortedDesc } from './published-sorted-posts.ts'
import { toIndexEntry } from './to-index-entry.ts'
import type { JournalIndexEntry, Post } from './types.ts'

/** Chronological (most recent first) index of published posts. */
export function deriveJournalIndex(posts: Post[]): JournalIndexEntry[] {
  return publishedSortedDesc(posts).map(toIndexEntry)
}
