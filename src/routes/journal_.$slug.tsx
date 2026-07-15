import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/journal_/$slug')({ component: Post })

function Post() {
  const { slug } = Route.useParams()
  return <div className="p-8">Post &ldquo;{slug}&rdquo; — coming soon.</div>
}
