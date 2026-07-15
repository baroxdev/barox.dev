const MAX_EXCERPT_LENGTH = 200

/** Plain-text summary of a post's raw MDX body: markdown/JSX syntax stripped, truncated at a word boundary. */
export function deriveExcerpt(body: string): string {
  const plainText = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/<\/?[A-Za-z][^>]*>/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (plainText.length <= MAX_EXCERPT_LENGTH) return plainText

  const truncated = plainText.slice(0, MAX_EXCERPT_LENGTH)
  const lastSpace = truncated.lastIndexOf(' ')
  const cut = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated
  return `${cut}…`
}
