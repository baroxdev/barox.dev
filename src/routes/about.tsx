import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  // Minimal title only, not buildPageHead — this page has no real content
  // yet (issue #12), so OG/canonical/JSON-LD would just advertise a
  // placeholder when shared.
  head: () => ({ meta: [{ title: 'About — barox.dev' }] }),
  component: About,
})

function About() {
  return <div className="p-8">About — coming soon.</div>
}
