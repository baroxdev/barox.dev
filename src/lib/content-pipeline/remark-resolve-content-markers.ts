import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import { PostValidationError } from './errors.ts'
import type { ImageVariant } from './types.ts'

const VALID_IMAGE_VARIANTS: ReadonlySet<string> = new Set([
  'left',
  'right',
  'full',
] satisfies ImageVariant[])

interface MdxJsxAttribute {
  type: 'mdxJsxAttribute'
  name: string
  value?: string | { value: string } | null
}

interface MdxJsxExpressionAttribute {
  type: 'mdxJsxExpressionAttribute'
  value: string
}

interface MdxJsxElement {
  type: 'mdxJsxFlowElement' | 'mdxJsxTextElement'
  name?: string | null
  attributes: (MdxJsxAttribute | MdxJsxExpressionAttribute)[]
  children: unknown[]
}

function isMdxJsxElement(node: unknown): node is MdxJsxElement {
  const type = (node as { type?: unknown }).type
  return type === 'mdxJsxFlowElement' || type === 'mdxJsxTextElement'
}

function findAttribute(
  node: MdxJsxElement,
  name: string,
): MdxJsxAttribute | undefined {
  return node.attributes.find(
    (attribute): attribute is MdxJsxAttribute =>
      attribute.type === 'mdxJsxAttribute' && attribute.name === name,
  )
}

function validateImageVariant(node: MdxJsxElement): void {
  const attribute = findAttribute(node, 'variant')
  if (!attribute || typeof attribute.value !== 'string') return

  if (!VALID_IMAGE_VARIANTS.has(attribute.value)) {
    throw new PostValidationError(
      `Invalid Image variant "${attribute.value}" — must be one of left, right, full`,
    )
  }
}

function validateSidenoteHasContent(node: MdxJsxElement): void {
  if (node.children.length === 0) {
    throw new PostValidationError('Sidenote must not be empty')
  }
}

/**
 * Resolves Sidenote and Image markers during MDX compilation: validates
 * that Image's `variant` is one of left/right/full (when present — the
 * renderer defaults an absent one) and that Sidenote isn't empty, so
 * malformed markers fail fast at parse time rather than at render time.
 */
export function remarkResolveContentMarkers() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (!isMdxJsxElement(node)) return
      if (node.name === 'Image') validateImageVariant(node)
      if (node.name === 'Sidenote') validateSidenoteHasContent(node)
    })
  }
}
