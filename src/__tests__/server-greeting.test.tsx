import { Suspense } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { serverGreetingQueryOptions } from '../server-greeting.ts'

function Greeting() {
  const { data } = useSuspenseQuery(serverGreetingQueryOptions())
  return <p>{data.message}</p>
}

describe('serverGreetingQueryOptions', () => {
  it('has a stable, dedicated query key', () => {
    expect(serverGreetingQueryOptions().queryKey).toEqual(['server-greeting'])
  })
})

describe('server greeting smoke query (issue #20 SSR proof)', () => {
  it('renders fully-resolved data with no suspense fallback once the cache is pre-populated', () => {
    const queryClient = new QueryClient()

    // Mirrors the effect of the route loader's ensureQueryData(...) having
    // already resolved on the server, then setupRouterSsrQueryIntegration
    // hydrating that result into the client's cache.
    queryClient.setQueryData(serverGreetingQueryOptions().queryKey, {
      message: 'Hello from the server',
      generatedAt: '2026-01-01T00:00:00.000Z',
    })

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<p>Loading…</p>}>
          <Greeting />
        </Suspense>
      </QueryClientProvider>,
    )

    expect(html).toContain('Hello from the server')
    expect(html).not.toContain('Loading…')
  })

  it('shows the fallback instead when the query has not resolved yet', () => {
    const queryClient = new QueryClient()
    const pendingGreetingQuery = queryOptions({
      queryKey: ['server-greeting'],
      queryFn: () => new Promise<{ message: string }>(() => {}),
    })

    function PendingGreeting() {
      const { data } = useSuspenseQuery(pendingGreetingQuery)
      return <p>{data.message}</p>
    }

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<p>Loading…</p>}>
          <PendingGreeting />
        </Suspense>
      </QueryClientProvider>,
    )

    expect(html).toContain('Loading…')
    expect(html).not.toContain('Hello from the server')
  })
})
