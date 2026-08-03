import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { latestPostsQueryOptions } from '../services/posts.ts'
import { buildPageHead } from '../lib/seo/page-head.ts'
import { PostListEntry } from '../components/post-list-entry.tsx'

export const Route = createFileRoute('/')({
  head: () =>
    buildPageHead({
      title: 'barox.dev — Notes from building software',
      description:
        "Barox's journal on software engineering, systems, and whatever he's deep in at the moment.",
      path: '/',
    }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(latestPostsQueryOptions()),
  component: Home,
})

export function Home() {
  const { data: posts } = useSuspenseQuery(latestPostsQueryOptions())

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <section>
        <h1 className="text-3xl font-bold text-ink">
          Notes from building software
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">
          I'm Barox — this is where I write down what I learn while building
          things: mostly software engineering, systems, and whatever I'm deep in
          at the moment.
        </p>
      </section>

      <section className="mt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">
            Latest from the journal
          </h2>
          <Link
            to="/journal"
            className="text-sm font-medium text-accent no-underline hover:underline"
          >
            View more →
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="mt-4 text-ink-muted">
            No posts published yet — check back soon.
          </p>
        ) : (
          <ul className="mt-6 space-y-10">
            {posts.map((post) => (
              <PostListEntry key={post.slug} entry={post} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
