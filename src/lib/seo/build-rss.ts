import { absoluteUrl } from './site-url.ts'
import type { RssEntry } from '../content-pipeline/types.ts'

/** Escapes the 5 XML predefined entities — item titles/excerpts are free
 * text (post frontmatter), unlike sitemap.xml which only ever emits URLs. */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildItem(entry: RssEntry): string {
  const url = absoluteUrl(entry.link)
  return [
    '  <item>',
    `    <title>${escapeXml(entry.title)}</title>`,
    `    <link>${url}</link>`,
    `    <guid isPermaLink="true">${url}</guid>`,
    `    <pubDate>${entry.date.toUTCString()}</pubDate>`,
    `    <description>${escapeXml(entry.excerpt)}</description>`,
    '  </item>',
  ].join('\n')
}

export interface RssChannelOptions {
  title: string
  description: string
  /** Site-relative path this feed is served from, e.g. "/rss.xml". */
  feedPath: string
  entries: RssEntry[]
}

/** Builds an RSS 2.0 feed document from published-post entries (see
 * deriveRssEntries), most recent first — see sitemap.xml's build-sitemap.ts
 * for the sibling document this mirrors. */
export function buildRssXml({
  title,
  description,
  feedPath,
  entries,
}: RssChannelOptions): string {
  const lastBuildDate = (entries[0]?.date ?? new Date()).toUTCString()
  const items = entries.map(buildItem).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `  <title>${escapeXml(title)}</title>`,
    `  <link>${absoluteUrl('/')}</link>`,
    `  <description>${escapeXml(description)}</description>`,
    '  <language>en-us</language>',
    `  <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `  <atom:link href="${absoluteUrl(feedPath)}" rel="self" type="application/rss+xml" />`,
    items,
    '</channel>',
    '</rss>',
  ]
    .filter(Boolean)
    .join('\n')
}
