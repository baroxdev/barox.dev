import type { Post } from '../types.ts'

let counter = 0

/** Builds a Post fixture for tests, with sensible defaults for unspecified fields. */
export function makePost(overrides: Partial<Post> = {}): Post {
  counter += 1
  return {
    slug: `test-post-${counter}`,
    title: `Test Post ${counter}`,
    date: new Date('2026-01-01'),
    tags: [],
    published: true,
    compiledSource: '',
    ...overrides,
  }
}
