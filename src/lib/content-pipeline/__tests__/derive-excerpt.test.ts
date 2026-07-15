import { describe, expect, it } from 'vitest'
import { deriveExcerpt } from '../derive-excerpt.ts'

describe('deriveExcerpt', () => {
  it('returns short plain-text bodies unchanged', () => {
    expect(deriveExcerpt('Hello world.')).toBe('Hello world.')
  })

  it('strips heading markers', () => {
    expect(deriveExcerpt('## Why a content pipeline first')).toBe(
      'Why a content pipeline first',
    )
  })

  it('strips emphasis and inline-code markers', () => {
    expect(deriveExcerpt('This is **bold**, this is _italic_, `code`.')).toBe(
      'This is bold, this is italic, code.',
    )
  })

  it('strips JSX marker tags but keeps their text content', () => {
    expect(
      deriveExcerpt(
        'Some intro text.<Sidenote>An aside.</Sidenote> More text.',
      ),
    ).toBe('Some intro text.An aside. More text.')
  })

  it('drops self-closing JSX tags entirely', () => {
    expect(
      deriveExcerpt(
        'Before.\n\n<Image variant="right" src="a.png" />\n\nAfter.',
      ),
    ).toBe('Before. After.')
  })

  it('drops fenced code blocks', () => {
    expect(deriveExcerpt('Before.\n\n```ts\nconst x = 1\n```\n\nAfter.')).toBe(
      'Before. After.',
    )
  })

  it('resolves markdown links to their link text', () => {
    expect(deriveExcerpt('See [the docs](https://example.com) for more.')).toBe(
      'See the docs for more.',
    )
  })

  it('collapses newlines and repeated whitespace into single spaces', () => {
    expect(deriveExcerpt('Line one.\nLine two.\n\nLine three.')).toBe(
      'Line one. Line two. Line three.',
    )
  })

  it('truncates long bodies at a word boundary with an ellipsis', () => {
    const word = 'lorem '
    const body = word.repeat(60).trim()

    const excerpt = deriveExcerpt(body)

    expect(excerpt.length).toBeLessThanOrEqual(201)
    expect(excerpt.endsWith('…')).toBe(true)
    expect(body.startsWith(excerpt.slice(0, -1))).toBe(true)
  })

  it('does not truncate a body exactly at the limit', () => {
    const body = 'a'.repeat(200)

    expect(deriveExcerpt(body)).toBe(body)
  })

  it('hard-truncates a single word with no spaces to break on', () => {
    const body = 'a'.repeat(250)

    const excerpt = deriveExcerpt(body)

    expect(excerpt).toBe(`${'a'.repeat(200)}…`)
  })
})
