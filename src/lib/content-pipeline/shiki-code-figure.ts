import type { ElementContent, Root } from 'hast'
import type { ShikiTransformer } from 'shiki'

const TITLE_META_PATTERN = /title="([^"]+)"/

/** Extracts `title="..."` from a fenced code block's raw meta string. */
export function parseCodeFenceMeta(metaString: string): { title?: string } {
  return { title: TITLE_META_PATTERN.exec(metaString)?.[1] }
}

/**
 * Wraps every highlighted code block in a `<figure data-code-figure>`
 * — with a `<figcaption data-code-title>` sibling only when a
 * title is present — so CodeBlock (src/components/mdx/code-block.tsx) always
 * has a single, uniform element to intercept and add chrome/copy behavior to,
 * matching the shape the (bundle-bloating, since-removed) rehype-pretty-code
 * library produced.
 */
export const codeFigureTransformer: ShikiTransformer = {
  name: 'post-code-figure',
  root(hast: Root): Root {
    const title = (this.options.meta as { title?: string } | undefined)?.title

    return {
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'figure',
          properties: { 'data-code-figure': '' },
          children: [
            ...(title
              ? [
                  {
                    type: 'element' as const,
                    tagName: 'figcaption',
                    properties: { 'data-code-title': '' },
                    children: [{ type: 'text' as const, value: title }],
                  },
                ]
              : []),
            ...(hast.children as ElementContent[]),
          ],
        },
      ],
    }
  },
}
