import { describe, expect, it } from 'vitest'
import { buildRssXml } from '../build-rss.ts'
import { SITE_URL } from '../site-url.ts'
import type { RssEntry } from '../../content-pipeline/types.ts'

function makeEntry(overrides: Partial<RssEntry> = {}): RssEntry {
  return {
    slug: 'a-post',
    title: 'A Post',
    date: new Date('2026-05-01T00:00:00.000Z'),
    tags: ['career'],
    link: '/journal/a-post',
    excerpt: 'A short summary.',
    ...overrides,
  }
}

describe('buildRssXml', () => {
  it('produces a valid RSS 2.0 channel with no items for an empty entry list', () => {
    const xml = buildRssXml({
      title: 'barox.dev',
      description: 'A journal.',
      feedPath: '/rss.xml',
      entries: [],
    })

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain(
      '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    )
    expect(xml).toContain(`<link>${SITE_URL}</link>`)
    expect(xml).toContain('<language>en-us</language>')
    expect(xml).not.toContain('<item>')
  })

  it('includes an atom:link self-reference pointing at the feed itself', () => {
    const xml = buildRssXml({
      title: 'barox.dev',
      description: 'A journal.',
      feedPath: '/rss.xml',
      entries: [],
    })

    expect(xml).toContain(
      `<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
    )
  })

  it('produces one <item> per entry with absolute link, permalink guid, RFC 822 pubDate, and excerpt as description', () => {
    const entry = makeEntry()
    const xml = buildRssXml({
      title: 'barox.dev',
      description: 'A journal.',
      feedPath: '/rss.xml',
      entries: [entry],
    })

    expect(xml.match(/<item>/g)).toHaveLength(1)
    expect(xml).toContain('<title>A Post</title>')
    expect(xml).toContain(`<link>${SITE_URL}/journal/a-post</link>`)
    expect(xml).toContain(
      `<guid isPermaLink="true">${SITE_URL}/journal/a-post</guid>`,
    )
    expect(xml).toContain(`<pubDate>${entry.date.toUTCString()}</pubDate>`)
    expect(xml).toContain('<description>A short summary.</description>')
  })

  it('sets lastBuildDate from the most recent entry', () => {
    const newest = makeEntry({ date: new Date('2026-06-01T00:00:00.000Z') })
    const xml = buildRssXml({
      title: 'barox.dev',
      description: 'A journal.',
      feedPath: '/rss.xml',
      entries: [newest],
    })

    expect(xml).toContain(
      `<lastBuildDate>${newest.date.toUTCString()}</lastBuildDate>`,
    )
  })

  it('XML-escapes titles and excerpts containing reserved characters', () => {
    const entry = makeEntry({
      title: 'Cats & Dogs <3',
      excerpt: 'A "great" review — 5 > 4 stars.',
    })
    const xml = buildRssXml({
      title: 'barox.dev',
      description: 'A journal.',
      feedPath: '/rss.xml',
      entries: [entry],
    })

    expect(xml).toContain('<title>Cats &amp; Dogs &lt;3</title>')
    expect(xml).toContain(
      '<description>A &quot;great&quot; review — 5 &gt; 4 stars.</description>',
    )
    expect(xml).not.toContain('Cats & Dogs <3')
  })

  it('escapes the channel title and description too', () => {
    const xml = buildRssXml({
      title: 'barox.dev & friends',
      description: 'Notes on <code>',
      feedPath: '/rss.xml',
      entries: [],
    })

    expect(xml).toContain('<title>barox.dev &amp; friends</title>')
    expect(xml).toContain('<description>Notes on &lt;code&gt;</description>')
  })
})
