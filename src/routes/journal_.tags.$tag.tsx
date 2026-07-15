import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/journal_/tags/$tag')({
  component: TagIndex,
})

function TagIndex() {
  const { tag } = Route.useParams()
  return (
    <div className="p-8">Posts tagged &ldquo;{tag}&rdquo; — coming soon.</div>
  )
}
