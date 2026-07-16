import { createFileRoute } from '@tanstack/react-router'
import {
  loadPosts,
  publishedSortedDesc,
  toIsoDateString,
} from '../lib/content-pipeline/index.ts'
import { buildSitemapXml } from '../lib/seo/build-sitemap.ts'

/**
 * Lists / and /journal plus every published post — not /about, /cv, or
 * /journal/tags/[tag], since those are still "coming soon" stubs (issues
 * #12, #13, #10) with no real content to advertise to search engines yet.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const posts = publishedSortedDesc(await loadPosts())

        const xml = buildSitemapXml([
          { path: '/' },
          { path: '/journal' },
          ...posts.map((post) => ({
            path: `/journal/${post.slug}`,
            lastmod: toIsoDateString(post.date),
          })),
        ])

        return new Response(xml, {
          headers: { 'Content-Type': 'application/xml' },
        })
      },
    },
  },
})
