import sharp from 'sharp'

/** Matches the on-site display size (banner) and the OG-image standard. */
const MAX_WIDTH = 1200
const WEBP_QUALITY = 80

export interface OptimizedImage {
  buffer: Buffer
  ext: string
  contentType: string
}

/**
 * Resizes (never upscales) to MAX_WIDTH and re-encodes as WebP — thumbnails
 * are only ever displayed at banner width or as a 1200x630 OG card, so
 * shipping a multi-megabyte original serves bytes no viewport can use.
 * SVGs pass through unrasterized: they're already vector/small, and
 * rasterizing one to WebP would only make it bigger.
 */
export async function optimizeImage(
  bytes: Buffer,
  sourceExt: string,
): Promise<OptimizedImage> {
  if (sourceExt.toLowerCase() === '.svg') {
    return { buffer: bytes, ext: '.svg', contentType: 'image/svg+xml' }
  }

  const buffer = await sharp(bytes)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()

  return { buffer, ext: '.webp', contentType: 'image/webp' }
}
