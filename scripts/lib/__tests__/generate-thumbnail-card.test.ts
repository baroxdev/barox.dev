import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { generateThumbnailCard } from '../generate-thumbnail-card.ts'

describe('generateThumbnailCard', () => {
  let dir: string
  let avatarPath: string

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'generate-thumbnail-card-'))
    avatarPath = path.join(dir, 'avatar.png')
    await writeFile(
      avatarPath,
      await sharp({
        create: { width: 64, height: 64, channels: 3, background: '#334455' },
      })
        .png()
        .toBuffer(),
    )
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('renders a 1200x630 PNG card', async () => {
    const png = await generateThumbnailCard({
      title: 'A Post Title',
      tags: ['meta', 'tanstack-start'],
      date: '2026-07-14',
      avatarPath,
    })

    const metadata = await sharp(png).metadata()
    expect(metadata.format).toBe('png')
    expect(metadata.width).toBe(1200)
    expect(metadata.height).toBe(630)
  }, 15_000)

  it('renders without a tags row when the post has no tags', async () => {
    const png = await generateThumbnailCard({
      title: 'A Post With No Tags',
      tags: [],
      date: '2026-07-14',
      avatarPath,
    })

    const metadata = await sharp(png).metadata()
    expect(metadata.width).toBe(1200)
    expect(metadata.height).toBe(630)
  }, 15_000)
})
