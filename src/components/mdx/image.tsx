type ImageVariant = 'left' | 'right' | 'full'

/**
 * `left` (default) renders at the normal text-column width, in flow.
 * `right` bleeds into the same margin column Sidenote (#8) uses, sharing
 * its float/clear stacking so the two interleave without colliding — see
 * `.image-right`/`.sidenote-content` in styles.css. `full` breaks out to
 * the entire widened post-page width (text column + margin column). Below
 * the 1024px breakpoint there's no margin column to bleed into, so `right`
 * and `full` both collapse to the same in-flow rendering as `left`.
 */
export function Image({
  src,
  alt,
  variant = 'left',
}: {
  src: string
  alt?: string
  variant?: ImageVariant
}) {
  const variantClassName = variant === 'left' ? '' : ` image-${variant}`

  return (
    <img
      src={src}
      alt={alt ?? ''}
      className={`h-auto max-w-full rounded${variantClassName}`}
    />
  )
}
