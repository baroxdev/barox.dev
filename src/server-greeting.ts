import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'

/**
 * Minimal smoke-test data for issue #20 (TanStack Query + Start SSR
 * integration): proves ensureQueryData/useSuspenseQuery SSR-prefetch the
 * server's response with no client-side loading flash. Not real content —
 * #6/#7 will define their own queryOptions following this same pattern.
 */
const getServerGreeting = createServerFn({ method: 'GET' }).handler(() => {
  return {
    message: 'Hello from the server',
    generatedAt: new Date().toISOString(),
  }
})

export const serverGreetingQueryOptions = () =>
  queryOptions({
    queryKey: ['server-greeting'],
    queryFn: () => getServerGreeting(),
  })
