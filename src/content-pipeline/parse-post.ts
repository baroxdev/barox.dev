import matter from 'gray-matter'
import { compileSync } from '@mdx-js/mdx'
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

/** Parses raw MDX post source into a validated Post domain object. */
export function parsePost(raw: string): Post {
  const { data: frontmatter, content: body } = matter(raw)

  const result = postFrontmatterSchema.safeParse(frontmatter)
  if (!result.success) {
    throw new PostValidationError(
      `Invalid post frontmatter: ${formatZodMessage(result.error)}`,
    )
  }

  const compiled = compileSync(body, {
    outputFormat: 'function-body',
    remarkPlugins: [remarkResolveContentMarkers],
  })

  return {
    ...result.data,
    compiledSource: String(compiled),
  }
}
