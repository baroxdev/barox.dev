import { describe, expect, it } from 'vitest'
import { getRouter } from '../router.tsx'

describe('getRouter', () => {
  it('creates a fresh QueryClient per call rather than sharing one', () => {
    const routerA = getRouter()
    const routerB = getRouter()

    const queryClientA = routerA.options.context.queryClient
    const queryClientB = routerB.options.context.queryClient

    expect(queryClientA).toBeDefined()
    expect(queryClientB).toBeDefined()
    expect(queryClientA).not.toBe(queryClientB)
  })

  it('makes queryClient available on the router context', () => {
    const router = getRouter()

    expect(router.options.context.queryClient.getQueryCache).toBeTypeOf(
      'function',
    )
  })
})
