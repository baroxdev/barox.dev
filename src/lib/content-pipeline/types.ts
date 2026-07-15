export type ImageVariant = 'left' | 'right' | 'full'

export interface Post {
  slug: string
  title: string
  date: Date
  tags: string[]
  published: boolean
  compiledSource: string
  excerpt: string
}

export interface JournalIndexEntry {
  slug: string
  title: string
  date: Date
  tags: string[]
}

export type TagIndex = Record<string, JournalIndexEntry[]>

export interface RssEntry {
  slug: string
  title: string
  date: Date
  tags: string[]
  link: string
}
