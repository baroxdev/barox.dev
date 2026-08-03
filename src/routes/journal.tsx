import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { journalIndexQueryOptions } from '../services/posts.ts'
import { buildPageHead } from '../lib/seo/page-head.ts'
import { PostListEntry } from '../components/post-list-entry.tsx'

export const Route = createFileRoute('/journal')({
  head: () =>
    buildPageHead({
      title: 'Journal — barox.dev',
      description:
        "Chronological journal of Barox's software engineering notes and lessons learned.",
      path: '/journal',
    }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(journalIndexQueryOptions()),
  component: Journal,
})

export function Journal() {
  const { data: entries } = useSuspenseQuery(journalIndexQueryOptions())

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-ink">Journal</h1>

      {entries.length === 0 ? (
        <p className="mt-4 text-ink-muted">
          No posts published yet — check back soon.
        </p>
      ) : (
        <ul className="mt-10 space-y-10">
          {entries.map((entry) => (
            <PostListEntry key={entry.slug} entry={entry} />
          ))}
        </ul>
      )}

      <p className="mt-16 border-t border-border pt-6 text-sm text-ink-muted">
        <a href="/rss.xml">Subscribe via RSS</a>
      </p>
    </main>
  )
}
