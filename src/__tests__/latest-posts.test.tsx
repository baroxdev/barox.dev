import { Suspense } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider, useSuspenseQuery } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { latestPostsQueryOptions } from '../latest-posts.ts'

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
    expect(latestPostsQueryOptions().queryKey).toEqual(['latest-posts'])
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
