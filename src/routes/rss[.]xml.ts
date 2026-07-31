import { createFileRoute } from '@tanstack/react-router'
import {
  deriveRssEntries,
  loadPosts,
} from '../lib/content-pipeline/index.ts'
import { buildRssXml } from '../lib/seo/build-rss.ts'

export const Route = createFileRoute('/rss.xml')({
  server: {
    handlers: {
      GET: async () => {
        const xml = buildRssXml({
          title: 'barox.dev',
          description:
            "Barox's journal on software engineering, systems, and whatever he's deep in at the moment.",
          feedPath: '/rss.xml',
          // deriveRssEntries already sorts most-recent-first and filters to
          // published-only, so loadPosts's raw output goes straight in.
          entries: deriveRssEntries(await loadPosts()),
        })

        return new Response(xml, {
          headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
        })
      },
    },
  },
})
