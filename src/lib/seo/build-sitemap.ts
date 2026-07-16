import { absoluteUrl } from './site-url.ts'

export interface SitemapEntry {
  /** Site-relative path, e.g. "/journal/my-post" or "/" for the home page. */
  path: string
  /** ISO "YYYY-MM-DD" date, e.g. a post's publish date. */
  lastmod?: string
}

function buildUrlEntry(entry: SitemapEntry): string {
  const lastmod = entry.lastmod
    ? `\n    <lastmod>${entry.lastmod}</lastmod>`
    : ''
  return `  <url>\n    <loc>${absoluteUrl(entry.path)}</loc>${lastmod}\n  </url>`
}

/** Builds a sitemap.xml document listing the given site-relative paths. */
export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map(buildUrlEntry).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
  ]
    .filter(Boolean)
    .join('\n')
}
