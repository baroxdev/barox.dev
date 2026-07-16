import { Suspense } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import {
  journalIndexQueryOptions,
  latestPostsQueryOptions,
  postQueryOptions,
} from '../posts.ts'
import type { PostDetail } from '../posts.ts'

function LatestPosts() {
  const { data } = useSuspenseQuery(latestPostsQueryOptions())
  return (
    <ul>
      {data.map((post) => (
        <li key={post.slug}>{post.title}</li>
      ))}
    </ul>
  )
}

describe('latestPostsQueryOptions', () => {
  it('has a stable, dedicated query key', () => {
    expect(latestPostsQueryOptions().queryKey).toEqual([
      'posts',
      'list',
      { query: { variant: 'latest' } },
    ])
  })

  it('renders fully-resolved data with no suspense fallback once the cache is pre-populated', () => {
    const queryClient = new QueryClient()

    queryClient.setQueryData(latestPostsQueryOptions().queryKey, [
      {
        slug: 'a-post',
        title: 'A Post',
        date: '2026-01-01',
        excerpt: 'An excerpt.',
      },
    ])

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<p>Loading…</p>}>
          <LatestPosts />
        </Suspense>
      </QueryClientProvider>,
    )

    expect(html).toContain('A Post')
    expect(html).not.toContain('Loading…')
  })
})

function JournalIndex() {
  const { data } = useSuspenseQuery(journalIndexQueryOptions())
  return (
    <ul>
      {data.map((entry) => (
        <li key={entry.slug}>
          {entry.title} — {entry.tags.join(', ')}
        </li>
      ))}
    </ul>
  )
}

describe('journalIndexQueryOptions', () => {
  it('has a stable, dedicated query key', () => {
    expect(journalIndexQueryOptions().queryKey).toEqual([
      'posts',
      'list',
      { query: { variant: 'journal-index' } },
    ])
  })

  it('renders fully-resolved data with no suspense fallback once the cache is pre-populated', () => {
    const queryClient = new QueryClient()

    queryClient.setQueryData(journalIndexQueryOptions().queryKey, [
      {
        slug: 'a-post',
        title: 'A Post',
        date: '2026-01-01',
        tags: ['career', 'system-design'],
      },
    ])

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<p>Loading…</p>}>
          <JournalIndex />
        </Suspense>
      </QueryClientProvider>,
    )

    expect(html).toContain('A Post')
    expect(html).toContain('career, system-design')
    expect(html).not.toContain('Loading…')
  })
})

function PostDetail({ slug }: { slug: string }) {
  const { data } = useSuspenseQuery(postQueryOptions(slug))
  if (!data) return <p>Not found.</p>
  return (
    <article>
      <h1>{data.title}</h1>
      <p>{data.tags.join(', ')}</p>
    </article>
  )
}

describe('postQueryOptions', () => {
  it('has a stable, per-slug query key', () => {
    expect(postQueryOptions('a-post').queryKey).toEqual([
      'posts',
      'detail',
      'a-post',
    ])
  })

  it('renders fully-resolved data with no suspense fallback once the cache is pre-populated', () => {
    const queryClient = new QueryClient()

    const post: PostDetail = {
      slug: 'a-post',
      title: 'A Post',
      date: '2026-01-01',
      tags: ['career', 'system-design'],
    }
    queryClient.setQueryData(postQueryOptions('a-post').queryKey, post)

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<p>Loading…</p>}>
          <PostDetail slug="a-post" />
        </Suspense>
      </QueryClientProvider>,
    )

    expect(html).toContain('A Post')
    expect(html).toContain('career, system-design')
    expect(html).not.toContain('Loading…')
  })

  it('renders the not-found branch when the cache holds null', () => {
    const queryClient = new QueryClient()

    queryClient.setQueryData(postQueryOptions('missing').queryKey, null)

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<p>Loading…</p>}>
          <PostDetail slug="missing" />
        </Suspense>
      </QueryClientProvider>,
    )

    expect(html).toContain('Not found.')
  })
})
