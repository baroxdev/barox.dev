import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cv')({
  // Minimal title only, not buildPageHead — this page has no real content
  // yet (issue #13), so OG/canonical/JSON-LD would just advertise a
  // placeholder when shared.
  head: () => ({ meta: [{ title: 'CV — barox.dev' }] }),
  component: Cv,
})

function Cv() {
  return <div className="p-8">CV — coming soon.</div>
}
