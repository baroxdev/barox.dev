import type { JournalIndexEntry, Post } from './types.ts'

export function toIndexEntry(post: Post): JournalIndexEntry {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
  }
}
