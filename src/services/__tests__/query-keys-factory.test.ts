import { describe, expect, it } from 'vitest'
import { queryKeysFactory } from '../query-keys-factory.ts'

describe('queryKeysFactory', () => {
  const postsKeys = queryKeysFactory('posts')

  it('roots "all" on the given key', () => {
    expect(postsKeys.all).toEqual(['posts'])
  })

  it('scopes "lists" under "all"', () => {
    expect(postsKeys.lists()).toEqual(['posts', 'list'])
  })

  it('omits the query segment when list() is called with no query', () => {
    expect(postsKeys.list()).toEqual(['posts', 'list'])
  })

  it('nests the query in a { query } segment when list() is given one', () => {
    expect(postsKeys.list({ variant: 'latest' })).toEqual([
      'posts',
      'list',
      { query: { variant: 'latest' } },
    ])
  })

  it('scopes "details" under "all"', () => {
    expect(postsKeys.details()).toEqual(['posts', 'detail'])
  })

  it('omits the query segment when detail() is called with no query', () => {
    expect(postsKeys.detail('a-slug')).toEqual(['posts', 'detail', 'a-slug'])
  })

  it('nests the query in a { query } segment when detail() is given one', () => {
    expect(postsKeys.detail('a-slug', { variant: 'latest' })).toEqual([
      'posts',
      'detail',
      'a-slug',
      { query: { variant: 'latest' } },
    ])
  })

  it('produces independent key roots for different factories', () => {
    const otherKeys = queryKeysFactory('other')
    expect(otherKeys.all).toEqual(['other'])
    expect(postsKeys.all).toEqual(['posts'])
  })
})
