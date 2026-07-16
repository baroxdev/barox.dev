import { describe, expect, it } from 'vitest'
import type { Root } from 'hast'
import {
  codeFigureTransformer,
  parseCodeFenceMeta,
} from '../shiki-code-figure.ts'

describe('parseCodeFenceMeta', () => {
  it('extracts a title from a title="..." meta string', () => {
    expect(parseCodeFenceMeta('title="example.ts"')).toEqual({
      title: 'example.ts',
    })
  })

  it('returns an undefined title when there is no title in the meta string', () => {
    expect(parseCodeFenceMeta('')).toEqual({ title: undefined })
    expect(parseCodeFenceMeta('showLineNumbers')).toEqual({
      title: undefined,
    })
  })
})

const stubPre: Root['children'][number] = {
  type: 'element',
  tagName: 'pre',
  properties: {},
  children: [],
}

const stubRoot: Root = { type: 'root', children: [stubPre] }

function runTransformer(title: string | undefined): Root {
  const context = {
    options: { meta: { title } },
  } as unknown as ThisParameterType<
    NonNullable<typeof codeFigureTransformer.root>
  >
  return codeFigureTransformer.root!.call(context, stubRoot) as Root
}

describe('codeFigureTransformer', () => {
  it('always wraps the highlighted output in a data-code-figure figure', () => {
    const result = runTransformer(undefined)

    expect(result.children).toHaveLength(1)
    const figure = result.children[0]
    expect(figure).toMatchObject({
      type: 'element',
      tagName: 'figure',
      properties: { 'data-code-figure': '' },
    })
  })

  it('omits the figcaption when there is no title', () => {
    const result = runTransformer(undefined)
    const figure = result.children[0] as Root['children'][number] & {
      children: Root['children']
    }

    expect(figure.children).toEqual([stubPre])
  })

  it('adds a data-code-title figcaption when a title is present', () => {
    const result = runTransformer('example.ts')
    const figure = result.children[0] as Root['children'][number] & {
      children: Root['children']
    }

    expect(figure.children[0]).toMatchObject({
      type: 'element',
      tagName: 'figcaption',
      properties: { 'data-code-title': '' },
      children: [{ type: 'text', value: 'example.ts' }],
    })
    expect(figure.children[1]).toBe(stubPre)
  })
})
