import { Suspense } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { Home } from '../routes/index.tsx'
import { latestPostsQueryOptions } from '../services/posts.ts'

interface LatestPost {
  slug: string
  title: string
  date: string
  excerpt: string
}

function renderHome(posts: LatestPost[]) {
  const queryClient = new QueryClient()
  queryClient.setQueryData(latestPostsQueryOptions().queryKey, posts)

  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<p>Loading…</p>}>
        <Home />
      </Suspense>
    </QueryClientProvider>,
  )
}

describe('Home', () => {
  it('shows a brief personal intro', () => {
    const html = renderHome([])

    expect(html).toMatch(/Barox/)
    expect(html).toMatch(/building things/)
  })

  it('lists the latest posts with title, formatted date, and excerpt', () => {
    const html = renderHome([
      {
        slug: 'building-barox-dev',
        title: 'Building barox.dev',
        date: '2026-07-14',
        excerpt: 'This is the first entry in the journal.',
      },
    ])

    expect(html).toContain('Building barox.dev')
    expect(html).toContain('July 14, 2026')
    expect(html).toContain('This is the first entry in the journal.')
  })

  it('shows an empty-state message when there are no published posts', () => {
    const html = renderHome([])

    expect(html).toMatch(/no posts published yet/i)
  })

  it('is not CV/hero-dominated: the journal list outweighs the intro', () => {
    const html = renderHome([
      {
        slug: 'a',
        title: 'Post A',
        date: '2026-01-01',
        excerpt: 'Excerpt A.',
      },
    ])

    expect(html).not.toMatch(/curriculum vitae|résumé|resume/i)
  })
})
