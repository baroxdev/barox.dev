import { describe, expect, it } from 'vitest'
import { deriveTagIndex } from '../derive-tag-index.ts'
import { makePost } from '../test-support/make-post.ts'

describe('deriveTagIndex', () => {
  it('groups posts under each of their tags', () => {
    const post = makePost({
      slug: 'a-post',
      tags: ['career', 'system-design'],
    })

    const index = deriveTagIndex([post])

    expect(index.career?.map((entry) => entry.slug)).toEqual(['a-post'])
    expect(index['system-design']?.map((entry) => entry.slug)).toEqual([
      'a-post',
    ])
  })

  it('orders posts within a tag chronologically, most recent first', () => {
    const oldest = makePost({
      slug: 'oldest',
      tags: ['career'],
      date: new Date('2026-01-01'),
    })
    const newest = makePost({
      slug: 'newest',
      tags: ['career'],
      date: new Date('2026-03-01'),
    })

    const index = deriveTagIndex([oldest, newest])

    expect(index.career?.map((entry) => entry.slug)).toEqual([
      'newest',
      'oldest',
    ])
  })

  it('excludes unpublished posts', () => {
    const draft = makePost({ tags: ['career'], published: false })

    const index = deriveTagIndex([draft])

    expect(index.career).toBeUndefined()
  })

  it('returns an empty index for an empty post list', () => {
    expect(deriveTagIndex([])).toEqual({})
  })

  it('does not add a tag key for a post with no tags', () => {
    const post = makePost({ tags: [] })

    const index = deriveTagIndex([post])

    expect(Object.keys(index)).toEqual([])
  })
})
