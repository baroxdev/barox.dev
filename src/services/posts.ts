import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import {
  deriveJournalIndex,
  loadPosts,
  publishedSortedDesc,
} from '../lib/content-pipeline/index.ts'
import { queryKeysFactory } from './query-keys-factory.ts'

/** How many recent posts the homepage shows. */
const HOME_POST_COUNT = 5

type PostsListVariant = { variant: 'latest' } | { variant: 'journal-index' }

const postsKeys = queryKeysFactory<'posts', PostsListVariant, string>('posts')

function toIsoDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

const latestPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.iso.date(),
  excerpt: z.string().min(1),
})

const latestPostsSchema = z.array(latestPostSchema)

const getLatestPosts = createServerFn({ method: 'GET' }).handler(async () => {
  const posts = publishedSortedDesc(await loadPosts()).slice(0, HOME_POST_COUNT)

  return latestPostsSchema.parse(
    posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      date: toIsoDateString(post.date),
      excerpt: post.excerpt,
    })),
  )
})

export const latestPostsQueryOptions = () =>
  queryOptions({
    queryKey: postsKeys.list({ variant: 'latest' }),
    queryFn: () => getLatestPosts(),
  })

const journalIndexEntrySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.iso.date(),
  tags: z.array(z.string().min(1)),
})

const journalIndexSchema = z.array(journalIndexEntrySchema)

const getJournalIndex = createServerFn({ method: 'GET' }).handler(async () => {
  const entries = deriveJournalIndex(await loadPosts())

  return journalIndexSchema.parse(
    entries.map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      date: toIsoDateString(entry.date),
      tags: entry.tags,
    })),
  )
})

export const journalIndexQueryOptions = () =>
  queryOptions({
    queryKey: postsKeys.list({ variant: 'journal-index' }),
    queryFn: () => getJournalIndex(),
  })

const postSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  date: z.iso.date(),
  tags: z.array(z.string().min(1)),
})

const postOrNullSchema = postSchema.nullable()

export type PostDetail = z.infer<typeof postSchema>

const getPost = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data }) => {
    const post = publishedSortedDesc(await loadPosts()).find(
      (candidate) => candidate.slug === data.slug,
    )

    if (!post) return postOrNullSchema.parse(null)

    return postOrNullSchema.parse({
      slug: post.slug,
      title: post.title,
      date: toIsoDateString(post.date),
      tags: post.tags,
    })
  })

export const postQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: postsKeys.detail(slug),
    queryFn: () => getPost({ data: { slug } }),
  })
