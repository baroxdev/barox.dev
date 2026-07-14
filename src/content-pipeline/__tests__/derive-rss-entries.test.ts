import { describe, expect, it } from 'vitest'
import { deriveRssEntries } from '../derive-rss-entries.ts'
import { makePost } from '../test-support/make-post.ts'

describe('deriveRssEntries', () => {
  it('produces a feed-ready entry per published post, with a link derived from the slug', () => {
    const post = makePost({
      slug: 'a-post',
      title: 'A Post',
      date: new Date('2026-05-01'),
      tags: ['career'],
    })

    const [entry] = deriveRssEntries([post])

    expect(entry).toEqual({
      slug: 'a-post',
      title: 'A Post',
      date: new Date('2026-05-01'),
      tags: ['career'],
      link: '/journal/a-post',
    })
  })

  it('orders entries chronologically, most recent first', () => {
    const oldest = makePost({ slug: 'oldest', date: new Date('2026-01-01') })
    const newest = makePost({ slug: 'newest', date: new Date('2026-03-01') })

    const entries = deriveRssEntries([oldest, newest])

    expect(entries.map((entry) => entry.slug)).toEqual(['newest', 'oldest'])
  })

  it('excludes unpublished posts', () => {
    const draft = makePost({ slug: 'draft', published: false })

    expect(deriveRssEntries([draft])).toEqual([])
  })

  it('returns an empty list for an empty post list', () => {
    expect(deriveRssEntries([])).toEqual([])
  })
})
