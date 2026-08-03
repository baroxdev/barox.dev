import { renderToStaticMarkup } from 'react-dom/server'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { getRouter } from '../router.tsx'
import { journalIndexQueryOptions } from '../services/posts.ts'

interface JournalIndexEntry {
  slug: string
  title: string
  date: string
  tags: string[]
}

async function renderJournal(entries: JournalIndexEntry[]) {
  const router = getRouter()
  router.update({
    context: router.options.context,
    history: createMemoryHistory({ initialEntries: ['/journal'] }),
  })
  router.options.context.queryClient.setQueryData(
    journalIndexQueryOptions().queryKey,
    entries,
  )

  await router.load()

  return renderToStaticMarkup(<RouterProvider router={router} />)
}

describe('Journal', () => {
  it('shows an empty-state message when there are no published posts', async () => {
    const html = await renderJournal([])

    expect(html).toMatch(/no posts published yet/i)
  })

  it('lists each entry with title, formatted date, and tags, in the given order', async () => {
    const html = await renderJournal([
      {
        slug: 'newer-post',
        title: 'Newer Post',
        date: '2026-07-14',
        tags: ['career', 'system-design'],
      },
      {
        slug: 'older-post',
        title: 'Older Post',
        date: '2026-01-01',
        tags: ['learning'],
      },
    ])

    expect(html).toContain('Newer Post')
    expect(html).toContain('July 14, 2026')
    expect(html).toContain('career')
    expect(html).toContain('system-design')
    expect(html).toContain('Older Post')
    expect(html).toContain('January 1, 2026')
    expect(html).toContain('learning')
    expect(html.indexOf('Newer Post')).toBeLessThan(html.indexOf('Older Post'))
  })

  it('links each post title to its post-detail route', async () => {
    const html = await renderJournal([
      {
        slug: 'a-post',
        title: 'A Post',
        date: '2026-01-01',
        tags: ['career'],
      },
    ])

    expect(html).toContain('href="/journal/a-post"')
  })

  it('links each tag to its tag-index route', async () => {
    const html = await renderJournal([
      {
        slug: 'a-post',
        title: 'A Post',
        date: '2026-01-01',
        tags: ['career', 'system-design'],
      },
    ])

    expect(html).toContain('href="/journal/tags/career"')
    expect(html).toContain('href="/journal/tags/system-design"')
  })
})
