import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/cv')({ component: Cv })

function Cv() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">CV</h1>
      <p className="mt-4 text-ink-muted">Coming soon.</p>
    </div>
  )
}
