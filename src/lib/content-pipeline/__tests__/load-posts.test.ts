import { describe, expect, it } from 'vitest'
import { loadPosts } from '../load-posts.ts'

function rawPost(frontmatter: string) {
  return `---\n${frontmatter}\n---\n\nSome body text.\n`
}

describe('loadPosts', () => {
  it('parses every source in the map into a Post', async () => {
    const posts = await loadPosts({
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
    expect(posts.map((post) => post.slug).sort()).toEqual(['post-a', 'post-b'])
  })

  it('returns an empty array for an empty source map', async () => {
    expect(await loadPosts({})).toEqual([])
  })

  it('defaults to the bundled content/journal sources and finds the real first post', async () => {
    const posts = await loadPosts()

    expect(posts.map((post) => post.slug)).toContain('building-barox-dev')
  })

  it('memoizes the default (no-argument) call so parsing only happens once', async () => {
    const first = await loadPosts()
    const second = await loadPosts()

    expect(second).toBe(first)
  })

  it('does not memoize calls that pass an explicit source map', async () => {
    const sources = {
      'post-a.mdx': rawPost(
        [
          'slug: post-a',
          'title: Post A',
          'date: 2026-01-01',
          'tags: [a]',
          'published: true',
        ].join('\n'),
      ),
    }

    const first = await loadPosts(sources)
    const second = await loadPosts(sources)

    expect(second).not.toBe(first)
  })
})
