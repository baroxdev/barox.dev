import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getPostComponent } from '../lib/content-pipeline/compiled-posts.ts'
import { postQueryOptions } from '../services/posts.ts'
import type { PostDetail } from '../services/posts.ts'
import { CodeBlock } from '../components/mdx/code-block.tsx'
import { Image } from '../components/mdx/image.tsx'
import { Sidenote } from '../components/mdx/sidenote.tsx'
import { GiscusComments } from '../components/giscus-comments.tsx'
import { buildPageHead } from '../lib/seo/page-head.ts'
import { SITE_URL } from '../lib/seo/site-url.ts'
import { cv } from '../content/cv.ts'

const MDX_COMPONENTS = { Sidenote, Image, figure: CodeBlock }

/** Fluid title size: 30px at small viewports up to a 56px ceiling around
 * desktop widths (~1024px), instead of jumping between fixed breakpoints. */
const POST_TITLE_SIZE = 'text-[clamp(1.875rem,4vw+1rem,3.5rem)] leading-tight'

/** og:image/JSON-LD source: the manual thumbnail if there is one, otherwise the auto-generated fallback. Never the reverse — a manual photo is always preferred over a generated card. */
function socialImage(post: PostDetail): string | undefined {
  return post.thumbnail ?? post.ogImage
}

function postJsonLd(post: PostDetail) {
  const image = socialImage(post)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
    author: { '@type': 'Person', name: 'Barox' },
    url: `${SITE_URL}/journal/${post.slug}`,
    ...(image ? { image } : {}),
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
          image: socialImage(post),
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
        {post.thumbnail ? (
          <div className="relative mb-6 min-h-72 overflow-hidden rounded-xl sm:aspect-[16/10] sm:min-h-0">
            <img
              src={post.thumbnail}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Literal black, not a --color-ink token: the overlay's job is
                guaranteeing white-text legibility over an arbitrary photo,
                in either theme — it has nothing to do with the page's own
                light/dark palette. */}
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 flex flex-col justify-between p-6">
              <div>
                <time
                  dateTime={post.date}
                  className="text-xs font-semibold tracking-wide text-white/75 uppercase"
                >
                  {formatPostDate(post.date)}
                </time>
                <h1
                  className={`mt-1 font-bold text-white ${POST_TITLE_SIZE}`}
                  style={{ viewTransitionName: `post-title-${post.slug}` }}
                >
                  {post.title}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="/images/avatar.png"
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-white">Barox</p>
                  <p className="text-xs text-white/70">{cv.title}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1
              className={`font-bold text-ink ${POST_TITLE_SIZE}`}
              style={{ viewTransitionName: `post-title-${post.slug}` }}
            >
              {post.title}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            </p>
          </>
        )}
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

      <GiscusComments />
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
