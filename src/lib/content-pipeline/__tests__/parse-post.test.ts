import { describe, expect, it } from 'vitest'
import { parsePost } from '../parse-post.ts'
import { PostValidationError } from '../errors.ts'

function withFrontmatter(frontmatter: string, body = 'Hello world.') {
  return `---\n${frontmatter}\n---\n\n${body}\n`
}

const validFrontmatter = [
  'slug: my-first-post',
  'title: My First Post',
  'date: 2026-01-15',
  'tags: [career, system-design]',
  'published: true',
].join('\n')

describe('parsePost', () => {
  it('produces a validated Post from valid MDX frontmatter', () => {
    const post = parsePost(withFrontmatter(validFrontmatter))

    expect(post.slug).toBe('my-first-post')
    expect(post.title).toBe('My First Post')
    expect(post.date).toEqual(new Date('2026-01-15'))
    expect(post.tags).toEqual(['career', 'system-design'])
    expect(post.published).toBe(true)
    expect(typeof post.compiledSource).toBe('string')
    expect(post.compiledSource.length).toBeGreaterThan(0)
    expect(post.excerpt).toBe('Hello world.')
  })

  it('fails fast with a clear validation error when a required field is missing', () => {
    const missingTitle = [
      'slug: my-first-post',
      'date: 2026-01-15',
      'tags: [career]',
      'published: true',
    ].join('\n')

    expect(() => parsePost(withFrontmatter(missingTitle))).toThrow(
      PostValidationError,
    )
    expect(() => parsePost(withFrontmatter(missingTitle))).toThrow(/title/)
  })

  it('fails fast with a clear validation error when a field is malformed', () => {
    const badSlug = [
      'slug: Not A Valid Slug!',
      'title: My First Post',
      'date: 2026-01-15',
      'tags: [career]',
      'published: true',
    ].join('\n')

    expect(() => parsePost(withFrontmatter(badSlug))).toThrow(
      PostValidationError,
    )
    expect(() => parsePost(withFrontmatter(badSlug))).toThrow(/slug/)
  })

  it('fails fast when frontmatter is entirely missing', () => {
    expect(() => parsePost('Just a plain body, no frontmatter.')).toThrow(
      PostValidationError,
    )
  })

  it('resolves Sidenote and image-variant markers in the body during compilation', () => {
    const body = [
      'Some intro text.<Sidenote>An aside.</Sidenote>',
      '<Image variant="right" src="diagram.png" />',
      '<Image variant="full" src="wide.png" />',
    ].join('\n\n')

    const post = parsePost(withFrontmatter(validFrontmatter, body))

    expect(post.compiledSource.length).toBeGreaterThan(0)
  })

  it('fails fast when the body uses an invalid Image variant', () => {
    const body = '<Image variant="sideways" src="diagram.png" />'

    expect(() => parsePost(withFrontmatter(validFrontmatter, body))).toThrow(
      PostValidationError,
    )
    expect(() => parsePost(withFrontmatter(validFrontmatter, body))).toThrow(
      /variant/i,
    )
  })
})
