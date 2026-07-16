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
  it('produces a validated Post from valid MDX frontmatter', async () => {
    const post = await parsePost(withFrontmatter(validFrontmatter))

    expect(post.slug).toBe('my-first-post')
    expect(post.title).toBe('My First Post')
    expect(post.date).toEqual(new Date('2026-01-15'))
    expect(post.tags).toEqual(['career', 'system-design'])
    expect(post.published).toBe(true)
    expect(post.excerpt).toBe('Hello world.')
  })

  it('fails fast with a clear validation error when a required field is missing', async () => {
    const missingTitle = [
      'slug: my-first-post',
      'date: 2026-01-15',
      'tags: [career]',
      'published: true',
    ].join('\n')

    await expect(parsePost(withFrontmatter(missingTitle))).rejects.toThrow(
      PostValidationError,
    )
    await expect(parsePost(withFrontmatter(missingTitle))).rejects.toThrow(
      /title/,
    )
  })

  it('fails fast with a clear validation error when a field is malformed', async () => {
    const badSlug = [
      'slug: Not A Valid Slug!',
      'title: My First Post',
      'date: 2026-01-15',
      'tags: [career]',
      'published: true',
    ].join('\n')

    await expect(parsePost(withFrontmatter(badSlug))).rejects.toThrow(
      PostValidationError,
    )
    await expect(parsePost(withFrontmatter(badSlug))).rejects.toThrow(/slug/)
  })

  it('fails fast when frontmatter is entirely missing', async () => {
    await expect(
      parsePost('Just a plain body, no frontmatter.'),
    ).rejects.toThrow(PostValidationError)
  })

  it('resolves Sidenote and image-variant markers in the body during compilation', async () => {
    const body = [
      'Some intro text.<Sidenote>An aside.</Sidenote>',
      '<Image variant="right" src="diagram.png" />',
      '<Image variant="full" src="wide.png" />',
    ].join('\n\n')

    await expect(
      parsePost(withFrontmatter(validFrontmatter, body)),
    ).resolves.toMatchObject({ slug: 'my-first-post' })
  })

  it('fails fast when the body uses an invalid Image variant', async () => {
    const body = '<Image variant="sideways" src="diagram.png" />'

    await expect(
      parsePost(withFrontmatter(validFrontmatter, body)),
    ).rejects.toThrow(PostValidationError)
    await expect(
      parsePost(withFrontmatter(validFrontmatter, body)),
    ).rejects.toThrow(/variant/i)
  })
})
