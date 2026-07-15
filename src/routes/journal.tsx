import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { journalIndexQueryOptions } from '../services/posts.ts'

export const Route = createFileRoute('/journal')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(journalIndexQueryOptions()),
  component: Journal,
})

function formatPostDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

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
            <li
              key={entry.slug}
              className="border-b border-border pb-10 last:border-b-0 last:pb-0"
            >
              <h2 className="text-lg font-semibold text-ink">
                <Link
                  to="/journal/$slug"
                  params={{ slug: entry.slug }}
                  className="text-ink no-underline hover:text-accent"
                >
                  {entry.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                <time dateTime={entry.date}>{formatPostDate(entry.date)}</time>
              </p>
              {entry.tags.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <li key={tag}>
                      <Link
                        to="/journal/tags/$tag"
                        params={{ tag }}
                        className="rounded-full border border-border px-2 py-0.5 text-sm text-ink-muted no-underline hover:text-accent"
                      >
                        {tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
