import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import {
  deriveJournalIndex,
  loadPosts,
  publishedSortedDesc,
} from '../lib/content-pipeline/index.ts'

/** How many recent posts the homepage shows. */
const HOME_POST_COUNT = 5

const latestPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.iso.date(),
  excerpt: z.string().min(1),
})

const latestPostsSchema = z.array(latestPostSchema)

const getLatestPosts = createServerFn({ method: 'GET' }).handler(() => {
  const posts = publishedSortedDesc(loadPosts()).slice(0, HOME_POST_COUNT)

  return latestPostsSchema.parse(
    posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date.toISOString().slice(0, 10),
      excerpt: post.excerpt,
    })),
  )
})

export const latestPostsQueryOptions = () =>
  queryOptions({
    queryKey: ['latest-posts'],
    queryFn: () => getLatestPosts(),
  })

const journalIndexEntrySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.iso.date(),
  tags: z.array(z.string().min(1)),
})

const journalIndexSchema = z.array(journalIndexEntrySchema)

const getJournalIndex = createServerFn({ method: 'GET' }).handler(() => {
  const entries = deriveJournalIndex(loadPosts())

  return journalIndexSchema.parse(
    entries.map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      date: entry.date.toISOString().slice(0, 10),
      tags: entry.tags,
    })),
  )
})

export const journalIndexQueryOptions = () =>
  queryOptions({
    queryKey: ['journal-index'],
    queryFn: () => getJournalIndex(),
  })
