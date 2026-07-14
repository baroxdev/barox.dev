import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/journal')({ component: Journal })

function Journal() {
  return <div className="p-8">Journal — coming soon.</div>
}
