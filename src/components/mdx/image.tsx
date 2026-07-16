/**
 * Minimal stub: plain img, `variant` (left/right/full) is accepted but
 * ignored. Issue #9 ("Image variant system") replaces this with the real
 * left/right/full placement layout.
 */
export function Image({
  src,
  alt,
}: {
  src: string
  alt?: string
  variant?: 'left' | 'right' | 'full'
}) {
  return <img src={src} alt={alt ?? ''} className="h-auto max-w-full rounded" />
}
