import { describe, expect, it } from 'vitest'
import { deriveJournalIndex } from '../derive-journal-index.ts'
import { makePost } from '../test-support/make-post.ts'

describe('deriveJournalIndex', () => {
  it('orders published posts chronologically, most recent first', () => {
    const oldest = makePost({ slug: 'oldest', date: new Date('2026-01-01') })
    const middle = makePost({ slug: 'middle', date: new Date('2026-02-01') })
    const newest = makePost({ slug: 'newest', date: new Date('2026-03-01') })

    const index = deriveJournalIndex([oldest, newest, middle])

    expect(index.map((entry) => entry.slug)).toEqual([
      'newest',
      'middle',
      'oldest',
    ])
  })

  it('excludes unpublished posts', () => {
    const published = makePost({ slug: 'published', published: true })
    const draft = makePost({ slug: 'draft', published: false })

    const index = deriveJournalIndex([published, draft])

    expect(index.map((entry) => entry.slug)).toEqual(['published'])
  })

  it('returns an empty index for an empty post list', () => {
    expect(deriveJournalIndex([])).toEqual([])
  })

  it('includes slug, title, date, and tags on each entry', () => {
    const post = makePost({
      slug: 'a-post',
      title: 'A Post',
      date: new Date('2026-05-01'),
      tags: ['career'],
    })

    const [entry] = deriveJournalIndex([post])

    expect(entry).toEqual({
      slug: 'a-post',
      title: 'A Post',
      date: new Date('2026-05-01'),
      tags: ['career'],
    })
  })
})
