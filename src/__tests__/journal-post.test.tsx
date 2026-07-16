import { renderToStaticMarkup } from 'react-dom/server'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { getRouter } from '../router.tsx'
import { postQueryOptions } from '../services/posts.ts'
import type { PostDetail } from '../services/posts.ts'

async function renderPost(slug: string, post: PostDetail | null) {
  const router = getRouter()
  router.update({
    context: router.options.context,
    history: createMemoryHistory({ initialEntries: [`/journal/${slug}`] }),
  })
  router.options.context.queryClient.setQueryData(
    postQueryOptions(slug).queryKey,
    post,
  )

  await router.load()

  return renderToStaticMarkup(<RouterProvider router={router} />)
}

const REAL_POST_METADATA: PostDetail = {
  slug: 'building-barox-dev',
  title: 'Building barox.dev, Kicking Off the Journal',
  date: '2026-07-14',
  tags: ['meta', 'tanstack-start'],
  excerpt: 'This is the first entry in the journal.',
}

describe('Post', () => {
  it('renders the title, formatted date, and tag links', async () => {
    const html = await renderPost('building-barox-dev', REAL_POST_METADATA)

    expect(html).toContain('Building barox.dev, Kicking Off the Journal')
    expect(html).toContain('July 14, 2026')
    expect(html).toContain('href="/journal/tags/meta"')
    expect(html).toContain('href="/journal/tags/tanstack-start"')
  })

  it("renders the compiled MDX body, including the Sidenote and Image stub components' output", async () => {
    const html = await renderPost('building-barox-dev', REAL_POST_METADATA)

    expect(html).toContain('Before any page renders a single post')
    expect(html).toContain(
      'That&#x27;s the whole point of the content pipeline',
    )
    expect(html).toContain('src="/images/placeholder-diagram.svg"')
    expect(html).toContain('src="/images/placeholder-wide.svg"')
  })

  it('renders the highlighted, titled code block', async () => {
    const html = await renderPost('building-barox-dev', REAL_POST_METADATA)

    expect(html).toContain('data-code-figure')
    expect(html).toContain('data-code-title')
    expect(html).toContain('types.ts')
  })

  it('renders the not-found page when the loader finds no post', async () => {
    const html = await renderPost('missing', null)

    expect(html).toMatch(/post not found/i)
  })
})
