import { describe, expect, it } from 'vitest'
import { loadPosts } from '../load-posts.ts'

function rawPost(frontmatter: string) {
  return `---\n${frontmatter}\n---\n\nSome body text.\n`
}

describe('loadPosts', () => {
  it('parses every source in the map into a Post', () => {
    const posts = loadPosts({
      'post-a.mdx': rawPost(
        [
          'slug: post-a',
          'title: Post A',
          'date: 2026-01-01',
          'tags: [a]',
          'published: true',
        ].join('\n'),
      ),
      'post-b.mdx': rawPost(
        [
          'slug: post-b',
          'title: Post B',
          'date: 2026-02-01',
          'tags: [b]',
          'published: false',
        ].join('\n'),
      ),
    })

    expect(posts).toHaveLength(2)
    expect(posts.map((post) => post.slug).sort()).toEqual([
      'post-a',
      'post-b',
    ])
  })

  it('returns an empty array for an empty source map', () => {
    expect(loadPosts({})).toEqual([])
  })

  it('defaults to the bundled content/journal sources and finds the real first post', () => {
    const posts = loadPosts()

    expect(posts.map((post) => post.slug)).toContain('building-barox-dev')
  })
})
