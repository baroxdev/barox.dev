import { createHash } from 'node:crypto'
import { readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import matter from 'gray-matter'
import { generateOgImage } from './generate-og-image.ts'
import { optimizeImage } from './optimize-image.ts'
import type { R2Client } from './r2-client.ts'

/** 16 hex chars (64 bits) — negligible collision risk at this site's scale, tidier URLs than a full digest. */
const HASH_LENGTH = 16

function isLocalPath(value: string): boolean {
  return !/^https?:\/\//i.test(value)
}

interface FrontmatterFields {
  thumbnail: string | undefined
  ogImage: string | undefined
  title: string
  tags: string[]
  date: unknown
  published: boolean
}

function extractFrontmatterFields(raw: string): FrontmatterFields {
  const data = matter(raw).data as Record<string, unknown>
  const thumbnail = data['thumbnail']
  const ogImage = data['ogImage']
  const tags = data['tags']

  return {
    thumbnail: typeof thumbnail === 'string' ? thumbnail : undefined,
    ogImage: typeof ogImage === 'string' ? ogImage : undefined,
    title: typeof data['title'] === 'string' ? data['title'] : '',
    tags: Array.isArray(tags)
      ? tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    date: data['date'],
    published: data['published'] === true,
  }
}

/** Replaces an existing `key:` line, or inserts one just before the closing frontmatter `---`. */
function setFrontmatterLine(raw: string, key: string, value: string): string {
  const linePattern = new RegExp(`^${key}:.*$`, 'm')
  if (linePattern.test(raw)) {
    return raw.replace(linePattern, `${key}: ${value}`)
  }
  return raw.replace(/\n---\n/, `\n${key}: ${value}\n---\n`)
}

async function uploadOptimized(
  sourceBytes: Buffer,
  sourceExt: string,
  r2Client: R2Client,
  publicBaseUrl: string,
): Promise<{ key: string; url: string }> {
  const hash = createHash('sha256')
    .update(sourceBytes)
    .digest('hex')
    .slice(0, HASH_LENGTH)
  const finalExt = sourceExt.toLowerCase() === '.svg' ? '.svg' : '.webp'
  const key = `thumbnails/${hash}${finalExt}`

  if (!(await r2Client.exists(key))) {
    const optimized = await optimizeImage(sourceBytes, sourceExt)
    const tmpPath = path.join(tmpdir(), `thumbnail-${hash}${optimized.ext}`)
    await writeFile(tmpPath, optimized.buffer)
    try {
      await r2Client.upload(key, tmpPath, optimized.contentType)
    } finally {
      await rm(tmpPath, { force: true })
    }
  }

  return { key, url: `${publicBaseUrl.replace(/\/$/, '')}/${key}` }
}

export interface SyncThumbnailsOptions {
  /** Directory holding the flat .mdx post files (and their colocated thumbnail images). */
  postsDir: string
  r2Client: R2Client
  publicBaseUrl: string
  /** Author photo composited into an auto-generated og:image. Only read when a post has neither thumbnail nor ogImage and check is false. */
  avatarPath: string
  /** Report-only: finds posts needing a sync without uploading, generating, or writing files. */
  check?: boolean
}

export interface SyncedThumbnail {
  file: string
  field: 'thumbnail' | 'ogImage'
  key: string
  url: string
}

export type UnsyncedReason = 'thumbnail-local-path' | 'missing'

export interface UnsyncedThumbnail {
  file: string
  reason: UnsyncedReason
}

export interface SyncThumbnailsResult {
  synced: SyncedThumbnail[]
  /** Post files needing a sync. Only populated in check mode. */
  unsynced: UnsyncedThumbnail[]
}

/**
 * Two independent, optional frontmatter fields:
 *
 * - `thumbnail` — always manual, a real photo colocated next to the post.
 *   Shown as the on-site banner (homepage/journal/tag lists, post detail)
 *   AND used for og:image/JSON-LD when present.
 * - `ogImage` — auto-generated (title/tags/author card) whenever a post has
 *   neither field set, since it duplicates content the page already
 *   renders and would be redundant as an on-site banner. Used for
 *   og:image/JSON-LD only, never rendered inline.
 *
 * Either field's bytes flow through the same optimize (resize +
 * WebP)/hash/upload pipeline. Both are frozen once synced: a later title
 * edit doesn't regenerate `ogImage`, the author must delete its line to
 * force a fresh render. The .mdx file stays the single source of truth, no
 * separate local-path-to-URL manifest.
 */
export async function syncThumbnails({
  postsDir,
  r2Client,
  publicBaseUrl,
  avatarPath,
  check = false,
}: SyncThumbnailsOptions): Promise<SyncThumbnailsResult> {
  const files = (await readdir(postsDir)).filter((file) =>
    file.endsWith('.mdx'),
  )

  const synced: SyncedThumbnail[] = []
  const unsynced: UnsyncedThumbnail[] = []

  for (const file of files) {
    const filePath = path.join(postsDir, file)
    let raw = await readFile(filePath, 'utf-8')
    const fields = extractFrontmatterFields(raw)

    if (!fields.published) continue // drafts don't need a thumbnail/og:image yet

    const thumbnailUnsynced =
      fields.thumbnail !== undefined && isLocalPath(fields.thumbnail)
    const needsOgImage =
      fields.thumbnail === undefined && fields.ogImage === undefined

    if (!thumbnailUnsynced && !needsOgImage) continue // fully synced already

    if (check) {
      unsynced.push({
        file,
        reason: thumbnailUnsynced ? 'thumbnail-local-path' : 'missing',
      })
      continue
    }

    if (thumbnailUnsynced && fields.thumbnail) {
      const imagePath = path.join(postsDir, fields.thumbnail)
      const sourceBytes = await readFile(imagePath)
      const sourceExt = path.extname(fields.thumbnail)
      const { key, url } = await uploadOptimized(
        sourceBytes,
        sourceExt,
        r2Client,
        publicBaseUrl,
      )
      raw = setFrontmatterLine(raw, 'thumbnail', url)
      synced.push({ file, field: 'thumbnail', key, url })
    }

    if (needsOgImage) {
      const sourceBytes = await generateOgImage({
        title: fields.title,
        tags: fields.tags,
        date: fields.date,
        avatarPath,
      })
      const { key, url } = await uploadOptimized(
        sourceBytes,
        '.png',
        r2Client,
        publicBaseUrl,
      )
      raw = setFrontmatterLine(raw, 'ogImage', url)
      synced.push({ file, field: 'ogImage', key, url })
    }

    await writeFile(filePath, raw, 'utf-8')
  }

  return { synced, unsynced }
}
