import type { QueryKey } from '@tanstack/react-query'

/**
 * Medusa-style query-key factory: a resource's queries are either a
 * filtered list or a lookup by id, so every consumer gets `list`/`detail`
 * builders rooted on the same key for free instead of hand-writing
 * `queryKey` arrays per query.
 */
export interface QueryKeyFactory<TListQuery = unknown, TDetailQuery = string> {
  all: QueryKey
  lists: () => QueryKey
  list: (query?: TListQuery) => QueryKey
  details: () => QueryKey
  detail: (id: TDetailQuery, query?: TListQuery) => QueryKey
}

function withoutNullish(segments: readonly unknown[]): QueryKey {
  return segments.filter((segment) => segment != null)
}

export function queryKeysFactory<
  TKey extends string,
  TListQuery = unknown,
  TDetailQuery = string,
>(key: TKey): QueryKeyFactory<TListQuery, TDetailQuery> {
  const factory: QueryKeyFactory<TListQuery, TDetailQuery> = {
    all: [key],
    lists: () => [...factory.all, 'list'],
    list: (query) =>
      withoutNullish([...factory.lists(), query ? { query } : undefined]),
    details: () => [...factory.all, 'detail'],
    detail: (id, query) =>
      withoutNullish([...factory.details(), id, query ? { query } : undefined]),
  }
  return factory
}
