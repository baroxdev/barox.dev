import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { tagQueryOptions } from '../services/posts.ts'
import { buildPageHead } from '../lib/seo/page-head.ts'
import { PostListEntry } from '../components/post-list-entry.tsx'

export const Route = createFileRoute('/journal_/tags/$tag')({
  head: ({ params }) =>
    buildPageHead({
      title: `#${params.tag} — barox.dev`,
      description: `Posts tagged "${params.tag}" on barox.dev.`,
      path: `/journal/tags/${params.tag}`,
    }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(tagQueryOptions(params.tag)),
  component: TagIndex,
})

function TagIndex() {
  const { tag } = Route.useParams()
  const { data: entries } = useSuspenseQuery(tagQueryOptions(tag))

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-ink">
        Posts tagged &ldquo;{tag}&rdquo;
      </h1>

      {entries.length === 0 ? (
        <p className="mt-4 text-ink-muted">
          No posts tagged &ldquo;{tag}&rdquo; yet.
        </p>
      ) : (
        <ul className="mt-10 space-y-10">
          {entries.map((entry) => (
            <PostListEntry key={entry.slug} entry={entry} />
          ))}
        </ul>
      )}
    </main>
  )
}
