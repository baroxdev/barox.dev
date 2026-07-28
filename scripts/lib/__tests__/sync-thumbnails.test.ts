import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { syncThumbnails } from '../sync-thumbnails.ts'
import type { R2Client } from '../r2-client.ts'

// A minimal but valid 1x1 transparent PNG — satori/resvg's image handling
// needs real, decodable image bytes, but the actual pixels don't matter here.
const FIXTURE_AVATAR_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

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
  let avatarPath: string

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'sync-thumbnails-'))
    avatarPath = path.join(dir, 'avatar.png')
    await writeFile(avatarPath, FIXTURE_AVATAR_PNG)
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

  it('uploads a local-path thumbnail (resized/WebP-encoded) and rewrites frontmatter to the public URL', async () => {
    await writeFile(path.join(dir, 'cover.png'), FIXTURE_AVATAR_PNG)
    await writePost(
      'a-post.mdx',
      'slug: a-post\ntitle: A Post\ndate: 2026-01-01\ntags: []\npublished: true\nthumbnail: ./cover.png',
    )

    const r2Client = createFakeR2Client()
    const result = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
      avatarPath,
    })

    expect(result.synced).toHaveLength(1)
    expect(r2Client.uploaded).toHaveLength(1)

    const rewritten = await readFile(path.join(dir, 'a-post.mdx'), 'utf-8')
    expect(rewritten).toMatch(
      /thumbnail: https:\/\/media\.barox\.dev\/thumbnails\/[0-9a-f]{16}\.webp/,
    )
    expect(rewritten).not.toContain('./cover.png')
  })

  it('is idempotent: re-running after a sync uploads nothing and edits nothing further', async () => {
    await writeFile(path.join(dir, 'cover.png'), FIXTURE_AVATAR_PNG)
    await writePost(
      'a-post.mdx',
      'slug: a-post\ntitle: A Post\ndate: 2026-01-01\ntags: []\npublished: true\nthumbnail: ./cover.png',
    )

    const r2Client = createFakeR2Client()
    const first = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
      avatarPath,
    })
    expect(first.synced).toHaveLength(1)

    const second = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
      avatarPath,
    })

    expect(second.synced).toHaveLength(0)
    expect(r2Client.uploaded).toHaveLength(1)
  })

  it('dedupes identical image bytes across different posts via content hash', async () => {
    await writeFile(path.join(dir, 'cover-a.png'), FIXTURE_AVATAR_PNG)
    await writeFile(path.join(dir, 'cover-b.png'), FIXTURE_AVATAR_PNG)
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
      avatarPath,
    })

    expect(result.synced).toHaveLength(2)
    expect(r2Client.uploaded).toHaveLength(1)
  })

  it('leaves a post with an already-synced URL thumbnail untouched', async () => {
    await writePost(
      'already-synced.mdx',
      'slug: already-synced\ntitle: Already Synced\ndate: 2026-01-01\ntags: []\npublished: true\nthumbnail: https://media.barox.dev/thumbnails/abc123.webp',
    )

    const r2Client = createFakeR2Client()
    const result = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
      avatarPath,
    })

    expect(result.synced).toHaveLength(0)
    expect(r2Client.uploaded).toHaveLength(0)
  })

  it('skips an unpublished draft with no thumbnail entirely', async () => {
    await writePost(
      'draft.mdx',
      'slug: draft\ntitle: A Draft\ndate: 2026-01-01\ntags: []\npublished: false',
    )

    const r2Client = createFakeR2Client()
    const result = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
      avatarPath,
    })

    expect(result.synced).toHaveLength(0)
    expect(r2Client.uploaded).toHaveLength(0)

    const untouched = await readFile(path.join(dir, 'draft.mdx'), 'utf-8')
    expect(untouched).not.toContain('thumbnail:')
  })

  it('auto-generates a thumbnail card for a published post with no thumbnail field', async () => {
    await writePost(
      'no-thumb.mdx',
      'slug: no-thumb\ntitle: A Post With No Thumbnail\ndate: 2026-01-01\ntags: [meta]\npublished: true',
    )

    const r2Client = createFakeR2Client()
    const result = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
      avatarPath,
    })

    expect(result.synced).toHaveLength(1)
    expect(r2Client.uploaded).toHaveLength(1)

    const rewritten = await readFile(path.join(dir, 'no-thumb.mdx'), 'utf-8')
    expect(rewritten).toMatch(
      /thumbnail: https:\/\/media\.barox\.dev\/thumbnails\/[0-9a-f]{16}\.webp/,
    )
  }, 15_000)

  it('freezes a generated thumbnail: re-running after generation does not regenerate it', async () => {
    await writePost(
      'no-thumb.mdx',
      'slug: no-thumb\ntitle: A Post With No Thumbnail\ndate: 2026-01-01\ntags: []\npublished: true',
    )

    const r2Client = createFakeR2Client()
    const first = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
      avatarPath,
    })
    expect(first.synced).toHaveLength(1)

    const rewritten = await readFile(path.join(dir, 'no-thumb.mdx'), 'utf-8')

    // Simulate a later title edit — the frontmatter now disagrees with
    // whatever produced the existing generated image.
    await writeFile(
      path.join(dir, 'no-thumb.mdx'),
      rewritten.replace(
        'title: A Post With No Thumbnail',
        'title: A Much Better Title',
      ),
      'utf-8',
    )

    const second = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
      avatarPath,
    })

    expect(second.synced).toHaveLength(0)
    expect(r2Client.uploaded).toHaveLength(1)
  }, 15_000)

  it('check mode reports both an unsynced local path and a missing thumbnail, without uploading or writing files', async () => {
    await writeFile(path.join(dir, 'cover.png'), FIXTURE_AVATAR_PNG)
    await writePost(
      'local-path.mdx',
      'slug: local-path\ntitle: A Post\ndate: 2026-01-01\ntags: []\npublished: true\nthumbnail: ./cover.png',
    )
    await writePost(
      'no-thumb.mdx',
      'slug: no-thumb\ntitle: Another Post\ndate: 2026-01-01\ntags: []\npublished: true',
    )
    await writePost(
      'draft.mdx',
      'slug: draft\ntitle: A Draft\ndate: 2026-01-01\ntags: []\npublished: false',
    )

    const r2Client = createFakeR2Client()
    const result = await syncThumbnails({
      postsDir: dir,
      r2Client,
      publicBaseUrl: 'https://media.barox.dev',
      avatarPath,
      check: true,
    })

    expect(result.unsynced).toEqual(
      expect.arrayContaining([
        { file: 'local-path.mdx', reason: 'local-path' },
        { file: 'no-thumb.mdx', reason: 'missing' },
      ]),
    )
    expect(result.unsynced).toHaveLength(2)
    expect(r2Client.uploaded).toHaveLength(0)

    const untouched = await readFile(path.join(dir, 'local-path.mdx'), 'utf-8')
    expect(untouched).toContain('./cover.png')
  })
})
