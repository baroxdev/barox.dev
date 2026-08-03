import { renderToStaticMarkup } from 'react-dom/server'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { getRouter } from '../router.tsx'
import { latestPostsQueryOptions } from '../services/posts.ts'

interface LatestPost {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
}

async function renderHome(posts: LatestPost[]) {
  const router = getRouter()
  router.update({
    context: router.options.context,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  router.options.context.queryClient.setQueryData(
    latestPostsQueryOptions().queryKey,
    posts,
  )

  await router.load()

  return renderToStaticMarkup(<RouterProvider router={router} />)
}

describe('Home', () => {
  it('shows a brief personal intro', async () => {
    const html = await renderHome([])

    expect(html).toMatch(/Barox/)
    expect(html).toMatch(/building things/)
  })

  it('lists the latest posts with title and formatted date', async () => {
    const html = await renderHome([
      {
        slug: 'building-barox-dev',
        title: 'Building barox.dev',
        date: '2026-07-14',
        excerpt: 'This is the first entry in the journal.',
        tags: [],
      },
    ])

    expect(html).toContain('Building barox.dev')
    expect(html).toContain('July 14, 2026')
  })

  it('links "View more" to the full journal page', async () => {
    const html = await renderHome([])

    expect(html).toMatch(/href="\/journal"[^>]*>View more/)
  })

  it('shows an empty-state message when there are no published posts', async () => {
    const html = await renderHome([])

    expect(html).toMatch(/no posts published yet/i)
  })

  it('is not CV/hero-dominated: the journal list outweighs the intro', async () => {
    const html = await renderHome([
      {
        slug: 'a',
        title: 'Post A',
        date: '2026-01-01',
        excerpt: 'Excerpt A.',
        tags: [],
      },
    ])

    expect(html).not.toMatch(/curriculum vitae|résumé|resume/i)
  })
})
