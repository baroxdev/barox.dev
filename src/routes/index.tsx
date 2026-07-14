import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { serverGreetingQueryOptions } from '../server-greeting.ts'

export const Route = createFileRoute('/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(serverGreetingQueryOptions()),
  component: Home,
})

function Home() {
  const { data } = useSuspenseQuery(serverGreetingQueryOptions())

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">barox.dev</h1>
      <p className="mt-4 text-lg">Site under construction.</p>
      {/* Smoke test for issue #20 — proves TanStack Query SSR-prefetches
          this server response with no client-side loading flash. Remove
          once #5 (Home page) or #6 (Journal index) replaces this route. */}
      <p className="mt-4 text-sm text-gray-500">
        {data.message} (generated at {data.generatedAt})
      </p>
    </div>
  )
}
