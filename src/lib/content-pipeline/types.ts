export type ImageVariant = 'left' | 'right' | 'full'

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
