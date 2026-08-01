export const ImageVariants = ['default', 'fluid', 'centered'] as const
export type ImageVariant = typeof ImageVariants[number]

export interface Post {
  slug: string
  title: string
  date: Date
  tags: string[]
  published: boolean
  excerpt: string
  /** Manual, on-site-displayable thumbnail (banner + og:image/JSON-LD). */
  thumbnail?: string
  /** Auto-generated og:image/JSON-LD fallback when there's no thumbnail — never shown as an on-site banner (it duplicates the page's own title/tags/author/date). */
  ogImage?: string
  /** AI-generated (scripts/sync-takeaways.ts), frozen once set — see that script for the regenerate-by-deleting-the-field model shared with thumbnail/ogImage. Absent whenever generation was skipped (no API key, request failure). */
  keyTakeaways?: string[]
}

export interface JournalIndexEntry {
  slug: string
  title: string
  date: Date
  tags: string[]
  thumbnail?: string
}

export type TagIndex = Record<string, JournalIndexEntry[]>

export interface RssEntry {
  slug: string
  title: string
  date: Date
  tags: string[]
  link: string
  excerpt: string
}
