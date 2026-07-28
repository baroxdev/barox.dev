import { createHash } from 'node:crypto'
import { readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import matter from 'gray-matter'
import { generateThumbnailCard } from './generate-thumbnail-card.ts'
import { optimizeImage } from './optimize-image.ts'
import type { R2Client } from './r2-client.ts'

/** 16 hex chars (64 bits) — negligible collision risk at this site's scale, tidier URLs than a full digest. */
const HASH_LENGTH = 16

function isLocalPath(value: string): boolean {
  return !/^https?:\/\//i.test(value)
}

interface FrontmatterFields {
  thumbnail: string | undefined
  title: string
  tags: string[]
  date: unknown
  published: boolean
}

function extractFrontmatterFields(raw: string): FrontmatterFields {
  const data = matter(raw).data as Record<string, unknown>
  const thumbnail = data['thumbnail']
  const tags = data['tags']

  return {
    thumbnail: typeof thumbnail === 'string' ? thumbnail : undefined,
    title: typeof data['title'] === 'string' ? data['title'] : '',
    tags: Array.isArray(tags)
      ? tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    date: data['date'],
    published: data['published'] === true,
  }
}

/** Replaces an existing `thumbnail:` line, or inserts one just before the closing frontmatter `---`. */
function setThumbnailLine(raw: string, value: string): string {
  if (/^thumbnail:.*$/m.test(raw)) {
    return raw.replace(/^thumbnail:.*$/m, `thumbnail: ${value}`)
  }
  return raw.replace(/\n---\n/, `\nthumbnail: ${value}\n---\n`)
}

export interface SyncThumbnailsOptions {
  /** Directory holding the flat .mdx post files (and their colocated thumbnail images). */
  postsDir: string
  r2Client: R2Client
  publicBaseUrl: string
  /** Author photo composited into an auto-generated card. Only read when a post has no thumbnail and check is false. */
  avatarPath: string
  /** Report-only: finds posts needing a sync without uploading, generating, or writing files. */
  check?: boolean
}

export interface SyncedThumbnail {
  file: string
  key: string
  url: string
}

export type UnsyncedReason = 'local-path' | 'missing'

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
 * Every published post ends up with a thumbnail — either a manually
 * colocated local-path image, or (when `thumbnail:` is absent entirely) one
 * generated from the title/tags/author. Either source's bytes flow through
 * the same optimize (resize + WebP)/hash/upload/frontmatter-rewrite
 * pipeline, so a generated thumbnail is indistinguishable from a manual one
 * once synced — including being frozen: a later title edit doesn't
 * regenerate it, the author must delete the `thumbnail:` line to force a
 * fresh sync. The .mdx file stays the single source of truth, no separate
 * local-path-to-URL manifest.
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
    const raw = await readFile(filePath, 'utf-8')
    const fields = extractFrontmatterFields(raw)

    if (fields.thumbnail && !isLocalPath(fields.thumbnail)) continue // already synced
    if (!fields.published) continue // drafts don't need a thumbnail yet

    if (check) {
      unsynced.push({
        file,
        reason: fields.thumbnail ? 'local-path' : 'missing',
      })
      continue
    }

    let sourceBytes: Buffer
    let sourceExt: string

    if (fields.thumbnail) {
      const imagePath = path.join(postsDir, fields.thumbnail)
      sourceBytes = await readFile(imagePath)
      sourceExt = path.extname(fields.thumbnail)
    } else {
      sourceBytes = await generateThumbnailCard({
        title: fields.title,
        tags: fields.tags,
        date: fields.date,
        avatarPath,
      })
      sourceExt = '.png'
    }

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

    const url = `${publicBaseUrl.replace(/\/$/, '')}/${key}`
    await writeFile(filePath, setThumbnailLine(raw, url), 'utf-8')

    synced.push({ file, key, url })
  }

  return { synced, unsynced }
}
