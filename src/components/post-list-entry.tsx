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
      {entry.thumbnail && (
        <img
          src={entry.thumbnail}
          alt=""
          className="mb-4 h-48 w-full rounded object-cover"
        />
      )}
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
  )
}
