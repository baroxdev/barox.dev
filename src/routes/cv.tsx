import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cv')({ component: Cv })

function Cv() {
  return <div className="p-8">CV — coming soon.</div>
}
