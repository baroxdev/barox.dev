import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { syncThumbnails } from '../sync-thumbnails.ts'
import type { R2Client } from '../r2-client.ts'

function createFakeR2Client(): R2Client & { uploaded: string[] } {
  const existing = new Set<string>()
  const uploaded: string[] = []
  return {
    uploaded,
    async exists(key) {
      return existing.has(key)
    },
    async upload(key) {
      uploaded.push(key)
      existing.add(key)
    },
  }
}

describe('syncThumbnails', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'sync-thumbnails-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  async function writePost(name: string, frontmatter: string) {
    await writeFile(
      path.join(dir, name),
      `---\n${frontmatter}\n---\n\nBody.\n`,
      'utf-8',
    )
  }

  it('uploads a local-path thumbnail and rewrites frontmatter to the public URL', async () => {
    await writeFile(path.join(dir, 'cover.png'), Buffer.from([1, 2, 3]))
    await writePost(
      'a-post.mdx',
      'slug: a-post\ntitle: A Post\ndate: 2026-01-01\ntags: []\npublished: true\nthumbnail: ./cover.png',
    )

    const r2Client = createFakeR2Client()
    const result = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
    })

    expect(result.synced).toHaveLength(1)
    expect(r2Client.uploaded).toHaveLength(1)

    const rewritten = await readFile(path.join(dir, 'a-post.mdx'), 'utf-8')
    expect(rewritten).toMatch(
      /thumbnail: https:\/\/media\.barox\.dev\/thumbnails\/[0-9a-f]{16}\.png/,
    )
    expect(rewritten).not.toContain('./cover.png')
  })

  it('is idempotent: re-running after a sync uploads nothing and edits nothing further', async () => {
    await writeFile(path.join(dir, 'cover.png'), Buffer.from([1, 2, 3]))
    await writePost(
      'a-post.mdx',
      'slug: a-post\ntitle: A Post\ndate: 2026-01-01\ntags: []\npublished: true\nthumbnail: ./cover.png',
    )

    const r2Client = createFakeR2Client()
    const first = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
    })
    expect(first.synced).toHaveLength(1)

    const second = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
    })

    expect(second.synced).toHaveLength(0)
    expect(r2Client.uploaded).toHaveLength(1)
  })

  it('dedupes identical image bytes across different posts via content hash', async () => {
    const bytes = Buffer.from([9, 9, 9])
    await writeFile(path.join(dir, 'cover-a.png'), bytes)
    await writeFile(path.join(dir, 'cover-b.png'), bytes)
    await writePost(
      'post-a.mdx',
      'slug: post-a\ntitle: A\ndate: 2026-01-01\ntags: []\npublished: true\nthumbnail: ./cover-a.png',
    )
    await writePost(
      'post-b.mdx',
      'slug: post-b\ntitle: B\ndate: 2026-01-01\ntags: []\npublished: true\nthumbnail: ./cover-b.png',
    )

    const r2Client = createFakeR2Client()
    const result = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
    })

    expect(result.synced).toHaveLength(2)
    expect(r2Client.uploaded).toHaveLength(1)
  })

  it('leaves posts with no thumbnail or an already-synced URL untouched', async () => {
    await writePost(
      'no-thumb.mdx',
      'slug: no-thumb\ntitle: No Thumb\ndate: 2026-01-01\ntags: []\npublished: true',
    )
    await writePost(
      'already-synced.mdx',
      'slug: already-synced\ntitle: Already Synced\ndate: 2026-01-01\ntags: []\npublished: true\nthumbnail: https://media.barox.dev/thumbnails/abc123.png',
    )

    const r2Client = createFakeR2Client()
    const result = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
    })

    expect(result.synced).toHaveLength(0)
    expect(r2Client.uploaded).toHaveLength(0)
  })

  it('check mode reports unsynced posts without uploading or writing files', async () => {
    await writeFile(path.join(dir, 'cover.png'), Buffer.from([1, 2, 3]))
    await writePost(
      'a-post.mdx',
      'slug: a-post\ntitle: A Post\ndate: 2026-01-01\ntags: []\npublished: true\nthumbnail: ./cover.png',
    )

    const r2Client = createFakeR2Client()
    const result = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
      check: true,
    })

    expect(result.unsynced).toEqual(['a-post.mdx'])
    expect(r2Client.uploaded).toHaveLength(0)

    const untouched = await readFile(path.join(dir, 'a-post.mdx'), 'utf-8')
    expect(untouched).toContain('./cover.png')
  })
})
