import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getPostComponent } from '../lib/content-pipeline/compiled-posts.ts'
import { postQueryOptions } from '../services/posts.ts'
import type { PostDetail } from '../services/posts.ts'
import { CodeBlock } from '../components/mdx/code-block.tsx'
import { Image } from '../components/mdx/image.tsx'
import { Sidenote } from '../components/mdx/sidenote.tsx'
import { buildPageHead } from '../lib/seo/page-head.ts'
import { SITE_URL } from '../lib/seo/site-url.ts'

const MDX_COMPONENTS = { Sidenote, Image, figure: CodeBlock }

function postJsonLd(post: PostDetail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
    author: { '@type': 'Person', name: 'Barox' },
    url: `${SITE_URL}/journal/${post.slug}`,
  }
}

export const Route = createFileRoute('/journal_/$slug')({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(
      postQueryOptions(params.slug),
    )
    if (!post) throw notFound()
    return post
  },
  head: ({ loaderData: post }) =>
    post
      ? buildPageHead({
          title: `${post.title} — barox.dev`,
          description: post.excerpt,
          path: `/journal/${post.slug}`,
          type: 'article',
          jsonLd: postJsonLd(post),
        })
      : buildPageHead({
          title: 'Post not found — barox.dev',
          description: 'This post could not be found.',
          path: '/journal',
        }),
  component: Post,
  notFoundComponent: PostNotFound,
})

function formatPostDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function Post() {
  const { slug } = Route.useParams()
  const { data: post } = useSuspenseQuery(postQueryOptions(slug))

  // Unreachable in practice: the loader above throws notFound() whenever
  // getPost resolves to null, so this route never renders without a post,
  // and every post that passes that check has a matching compiled file
  // (see compiled-posts.ts's filename === frontmatter slug convention).
  const MDXContent = post && getPostComponent(slug)
  if (!post || !MDXContent) return null

  return (
    <main className="journal-layout mx-auto max-w-3xl px-6 py-16">
      <header>
        <h1 className="text-3xl font-bold text-ink">{post.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        </p>
        {post.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
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
      </header>

      <div className="prose prose-lg prose-with-sidenotes mt-10 max-w-none">
        <MDXContent components={MDX_COMPONENTS} />
      </div>
    </main>
  )
}

function PostNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-ink">Post not found</h1>
      <p className="mt-4 text-ink-muted">
        That post doesn&rsquo;t exist or hasn&rsquo;t been published yet.{' '}
        <Link to="/journal" className="text-accent">
          Back to the journal
        </Link>
      </p>
    </main>
  )
}
