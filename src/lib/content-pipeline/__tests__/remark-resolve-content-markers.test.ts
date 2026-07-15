import { compileSync } from '@mdx-js/mdx'
import { describe, expect, it } from 'vitest'
import { PostValidationError } from '../errors.ts'
import { remarkResolveContentMarkers } from '../remark-resolve-content-markers.ts'

function compileBody(body: string) {
  return compileSync(body, {
    outputFormat: 'function-body',
    remarkPlugins: [remarkResolveContentMarkers],
  })
}

describe('remarkResolveContentMarkers', () => {
  it.each(['left', 'right', 'full'])(
    'allows a valid Image variant "%s"',
    (variant) => {
      expect(() =>
        compileBody(`<Image variant="${variant}" src="a.png" />`),
      ).not.toThrow()
    },
  )

  it('allows an Image marker with no variant (renderer applies the default)', () => {
    expect(() => compileBody('<Image src="a.png" />')).not.toThrow()
  })

  it('throws PostValidationError for an invalid Image variant', () => {
    expect(() => compileBody('<Image variant="top" src="a.png" />')).toThrow(
      PostValidationError,
    )
    expect(() => compileBody('<Image variant="top" src="a.png" />')).toThrow(
      /variant/i,
    )
  })

  it('validates every Image marker in a body with multiple markers', () => {
    const body = [
      '<Image variant="left" src="a.png" />',
      'Some text.',
      '<Image variant="sideways" src="b.png" />',
    ].join('\n\n')

    expect(() => compileBody(body)).toThrow(PostValidationError)
  })

  it('allows a Sidenote with content', () => {
    expect(() => compileBody('<Sidenote>An aside.</Sidenote>')).not.toThrow()
  })

  it('throws PostValidationError for an empty Sidenote', () => {
    expect(() => compileBody('<Sidenote></Sidenote>')).toThrow(
      PostValidationError,
    )
    expect(() => compileBody('<Sidenote></Sidenote>')).toThrow(/Sidenote/)
  })

  it('throws PostValidationError for a self-closing (empty) Sidenote', () => {
    expect(() => compileBody('<Sidenote />')).toThrow(PostValidationError)
  })
})
