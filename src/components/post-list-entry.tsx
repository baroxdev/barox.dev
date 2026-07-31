import { Link } from '@tanstack/react-router'

export interface PostListEntryData {
  slug: string
  title: string
  date: string
  tags: string[]
  thumbnail?: string
}

function formatPostDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function PostListEntry({ entry }: { entry: PostListEntryData }) {
  return (
    <li className="border-b border-border pb-10 last:border-b-0 last:pb-0">
      {entry.thumbnail ? (
        <Link
          to="/journal/$slug"
          params={{ slug: entry.slug }}
          viewTransition
          className="group relative block aspect-video overflow-hidden rounded-lg no-underline"
        >
          <img
            src={entry.thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
          {/* Literal black, not a --color-ink token: the overlay's job is
              guaranteeing white-text legibility over an arbitrary photo, in
              either theme — it has nothing to do with the page's own
              light/dark palette. */}
          <div className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/45" />
          <div className="absolute inset-0 flex flex-col justify-end gap-2 p-5">
            <time
              dateTime={entry.date}
              className="text-xs font-semibold tracking-wide text-white/75 uppercase"
            >
              {formatPostDate(entry.date)}
            </time>
            <h2
              className="text-xl font-bold text-white"
              style={{ viewTransitionName: `post-title-${entry.slug}` }}
            >
              {entry.title}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <img
                src="/images/avatar.png"
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
              <span className="text-sm text-white/85">Barox</span>
            </div>
          </div>
        </Link>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-ink">
            <Link
              to="/journal/$slug"
              params={{ slug: entry.slug }}
              viewTransition
              className="text-ink no-underline hover:text-accent"
              style={{ viewTransitionName: `post-title-${entry.slug}` }}
            >
              {entry.title}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            <time dateTime={entry.date}>{formatPostDate(entry.date)}</time>
          </p>
        </>
      )}
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
  )
}
