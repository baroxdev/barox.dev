# Data fetching: TanStack Query

Every route that needs server-derived data uses TanStack Query, not a bare
`loader` return value or a client-side `useEffect` fetch. This is wired up
in `src/router.tsx` / `src/routes/__root.tsx` (issue #20) — routes just
follow the pattern below.

## The pattern

1. **Server function**: fetch/compute the data in a `createServerFn` (from
   `@tanstack/react-start`). This is where content-pipeline calls, disk
   reads, or any other server-only work happens.
2. **`queryOptions` factory**: wrap the server function in a `queryOptions(...)`
   call (from `@tanstack/react-query`) exported as a function, so the query
   key/fn pair is defined once and reused identically in the loader and the
   component.
3. **Route loader**: call `context.queryClient.ensureQueryData(theQueryOptions())`
   for data the page can't render without (blocks SSR until resolved), or a
   non-awaited `context.queryClient.prefetchQuery(theQueryOptions())` for
   data that can stream in without blocking first paint.
4. **Route component**: consume the *same* `queryOptions(...)` via
   `useSuspenseQuery` — it reads the already-loaded SSR data with no client
   loading flash. Don't use plain `useQuery` here; that only resolves after
   client hydration.

See `src/server-greeting.ts` + `src/routes/index.tsx` for a minimal working
example (a smoke test proving the SSR-prefetch/hydration wiring — not real
site content).

## Why this gets you for free

- **SSR prefetch + streaming hydration**: `setupRouterSsrQueryIntegration`
  (called once in `src/router.tsx`) dehydrates the server's `QueryClient`
  and streams it into the client's cache automatically — no manual
  `dehydrate()`/`<HydrationBoundary>` per route.
- **Hover/tap preloading**: the router's `defaultPreload: 'intent'` already
  re-runs a route's `loader` on hover, so intent-based preloading
  automatically prefetches that route's queries too — nothing extra to wire.
- **Per-request isolation**: `getRouter()` creates a fresh `QueryClient` on
  every call (see `src/__tests__/router.test.ts`), so SSR requests never
  leak cached data between users.

## Testing

- Test `queryOptions` factories and the server functions they wrap directly
  — given inputs, what queryKey/queryFn shape results — independent of any
  route.
- Test loader behavior by instantiating a real `QueryClient` and asserting
  its cache after the loader runs, not by mocking `fetch` or React Query
  internals.
