import matter from 'gray-matter'
import { compile } from '@mdx-js/mdx'
import type { Plugin } from 'vite'
import { remarkResolveContentMarkers } from './remark-resolve-content-markers.ts'
import { rehypeShikiCodeBlocks } from './shiki-rehype-plugin.ts'

/**
 * Compiles content/journal/*.mdx into real ES module components at build
 * time (see compiled-posts.ts for why request-time compilation can't work
 * on this deploy target). Not @mdx-js/rollup: that plugin strips a module
 * id's query string *before* filtering (`id.split('?')[0]`), so it can't
 * tell `foo.mdx` apart from `foo.mdx?raw` — it clobbers load-posts.ts's raw
 * string import (used for frontmatter/metadata) with compiled JS instead of
 * leaving it alone. Checking the untouched `id` here (Vite passes the query
 * string through to transform hooks) avoids that collision entirely.
 */
export function mdxPlugin(): Plugin {
  return {
    name: 'barox-mdx',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.endsWith('.mdx')) return undefined

      // Same split parsePost.ts uses — without it, the YAML frontmatter
      // block gets compiled as part of the body, and remark parses its
      // closing `---` as a Setext heading underline for the line above it.
      const { content: body } = matter(code)

      const compiled = await compile(body, {
        outputFormat: 'program',
        remarkPlugins: [remarkResolveContentMarkers],
        rehypePlugins: [rehypeShikiCodeBlocks],
      })

      return { code: String(compiled), map: null }
    },
  }
}
