import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { deriveJournalIndex } from '../derive-journal-index.ts'
import { deriveRssEntries } from '../derive-rss-entries.ts'
import { deriveTagIndex } from '../derive-tag-index.ts'
import { parsePost } from '../parse-post.ts'

const firstPostPath = fileURLToPath(
  new URL(
    '../../../../content/journal/building-barox-dev.mdx',
    import.meta.url,
  ),
)

describe('parsePost against a real post file', () => {
  it('parses the first journal post end to end', async () => {
    const raw = readFileSync(firstPostPath, 'utf-8')

    const post = await parsePost(raw)

    expect(post.slug).toBe('building-barox-dev')
    expect(post.title).toBe('Building barox.dev, Kicking Off the Journal')
    expect(post.date).toEqual(new Date('2026-07-14'))
    expect(post.tags).toEqual(['meta', 'tanstack-start'])
    expect(post.published).toBe(true)
    expect(
      post.excerpt.startsWith('This is the first entry in the journal'),
    ).toBe(true)
    expect(post.excerpt).not.toMatch(/[#<`]/)
    expect(post.excerpt.length).toBeLessThanOrEqual(201)
  })

  it('flows through the derived collections', async () => {
    const raw = readFileSync(firstPostPath, 'utf-8')
    const post = await parsePost(raw)

    expect(deriveJournalIndex([post])).toEqual([
      {
        slug: 'building-barox-dev',
        title: 'Building barox.dev, Kicking Off the Journal',
        date: new Date('2026-07-14'),
        tags: ['meta', 'tanstack-start'],
      },
    ])

    const tagIndex = deriveTagIndex([post])
    expect(tagIndex.meta?.map((entry) => entry.slug)).toEqual([
      'building-barox-dev',
    ])
    expect(tagIndex['tanstack-start']?.map((entry) => entry.slug)).toEqual([
      'building-barox-dev',
    ])

    const rssEntries = deriveRssEntries([post])
    expect(rssEntries).toEqual([
      {
        slug: 'building-barox-dev',
        title: 'Building barox.dev, Kicking Off the Journal',
        date: new Date('2026-07-14'),
        tags: ['meta', 'tanstack-start'],
        link: '/journal/building-barox-dev',
      },
    ])
  })
})
