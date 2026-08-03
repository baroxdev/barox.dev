import matter from 'gray-matter'
import { compile } from '@mdx-js/mdx'
import { deriveExcerpt } from './derive-excerpt.ts'
import { PostValidationError } from './errors.ts'
import { postFrontmatterSchema } from './post-frontmatter-schema.ts'
import { remarkResolveContentMarkers } from './remark-resolve-content-markers.ts'
import type { Post } from './types.ts'

function formatZodMessage(error: {
  issues: { path: PropertyKey[]; message: string }[]
}): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ')
}

/**
 * Parses raw MDX post source into a validated Post domain object.
 *
 * Compiles the body (discarding the result) purely to run
 * remarkResolveContentMarkers's fail-fast Sidenote/Image validation with a
 * clear PostValidationError, independent of the framework. The actual
 * MDX-to-component compilation used for rendering happens separately, at
 * build time, via the custom Vite plugin in vite-mdx-plugin.ts — not here,
 * and not at request time (see compiled-posts.ts for why).
 */
export async function parsePost(raw: string): Promise<Post> {
  const { data: frontmatter, content: body } = matter(raw)

  const result = postFrontmatterSchema.safeParse(frontmatter)
  if (!result.success) {
    throw new PostValidationError(
      `Invalid post frontmatter: ${formatZodMessage(result.error)}`,
    )
  }

  await compile(body, {
    outputFormat: 'function-body',
    remarkPlugins: [remarkResolveContentMarkers],
  })

  return {
    ...result.data,
    excerpt: deriveExcerpt(body),
  }
}
