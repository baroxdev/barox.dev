import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/journal_/tags/$tag')({
  // Minimal title only, not buildPageHead — this page has no real content
  // yet (issue #10), so OG/canonical/JSON-LD would just advertise a
  // placeholder when shared.
  head: ({ params }) => ({
    meta: [{ title: `#${params.tag} — barox.dev` }],
  }),
  component: TagIndex,
})

function TagIndex() {
  const { tag } = Route.useParams()
  return (
    <div className="p-8">Posts tagged &ldquo;{tag}&rdquo; — coming soon.</div>
  )
}
