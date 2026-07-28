import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { optimizeImage } from '../optimize-image.ts'

async function makePng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 140, b: 160 },
    },
  })
    .png()
    .toBuffer()
}

describe('optimizeImage', () => {
  it('re-encodes a raster image to WebP', async () => {
    const png = await makePng(100, 100)

    const result = await optimizeImage(png, '.png')

    expect(result.ext).toBe('.webp')
    expect(result.contentType).toBe('image/webp')

    const metadata = await sharp(result.buffer).metadata()
    expect(metadata.format).toBe('webp')
  })

  it('resizes an oversized image down to the max width without upscaling', async () => {
    const large = await makePng(2000, 1000)

    const result = await optimizeImage(large, '.png')
    const metadata = await sharp(result.buffer).metadata()

    expect(metadata.width).toBe(1200)
    expect(metadata.height).toBe(600)
  })

  it('never upscales an image smaller than the max width', async () => {
    const small = await makePng(300, 150)

    const result = await optimizeImage(small, '.png')
    const metadata = await sharp(result.buffer).metadata()

    expect(metadata.width).toBe(300)
    expect(metadata.height).toBe(150)
  })

  it('passes an SVG through unrasterized', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>',
    )

    const result = await optimizeImage(svg, '.svg')

    expect(result.ext).toBe('.svg')
    expect(result.contentType).toBe('image/svg+xml')
    expect(result.buffer).toBe(svg)
  })
})
