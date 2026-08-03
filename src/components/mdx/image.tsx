import type { ImageVariant } from '#/lib/content-pipeline'

export function Image({
  src,
  alt,
  variant = 'default',
}: {
  src: string
  alt?: string
  variant?: ImageVariant
}) {
  const variantClassName = variant === 'default' ? '' : ` image-${variant}`

  return (
    <img
      src={src}
      alt={alt ?? ''}

      className={`h-auto w-auto max-w-full rounded-xl ${variantClassName}`}
      crossOrigin="anonymous"
      decoding="async"
      loading="lazy"
      referrerPolicy="no-referrer"
      sizes="100vw"
      srcSet={`${src} 1x, ${src} 2x`}
    />
  )
}
