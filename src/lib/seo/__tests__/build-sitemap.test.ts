import { describe, expect, it } from 'vitest'
import { buildSitemapXml } from '../build-sitemap.ts'
import { SITE_URL } from '../site-url.ts'

describe('buildSitemapXml', () => {
  it('produces a valid urlset with one <url> per entry', () => {
    const xml = buildSitemapXml([{ path: '/' }, { path: '/journal' }])

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    )
    expect(xml).toContain(`<loc>${SITE_URL}</loc>`)
    expect(xml).toContain(`<loc>${SITE_URL}/journal</loc>`)
    expect(xml.match(/<url>/g)).toHaveLength(2)
  })

  it('includes a <lastmod> when given, omits it otherwise', () => {
    const xml = buildSitemapXml([
      { path: '/journal/a-post', lastmod: '2026-07-14' },
      { path: '/journal' },
    ])

    expect(xml).toContain('<lastmod>2026-07-14</lastmod>')
    expect(xml.match(/<lastmod>/g)).toHaveLength(1)
  })

  it('returns a urlset with no <url> entries for an empty list', () => {
    const xml = buildSitemapXml([])

    expect(xml).not.toContain('<url>')
    expect(xml).toContain('<urlset')
  })
})
