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
    <li className="flex gap-5 border-b border-border pb-10 last:border-b-0 last:pb-0">
      {entry.thumbnail && (
        <Link
          to="/journal/$slug"
          params={{ slug: entry.slug }}
          viewTransition
          className="block shrink-0"
        >
          <img
            src={entry.thumbnail}
            alt=""
            className="h-24 w-32 rounded-xl object-cover sm:h-28 sm:w-40"
          />
        </Link>
      )}
      <div className="min-w-0 flex-1">
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
      </div>
    </li>
  )
}
