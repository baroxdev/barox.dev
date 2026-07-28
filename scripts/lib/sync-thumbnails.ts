import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import type { R2Client } from './r2-client.ts'

/** 16 hex chars (64 bits) — negligible collision risk at this site's scale, tidier URLs than a full digest. */
const HASH_LENGTH = 16

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

function contentTypeFor(ext: string): string {
  return CONTENT_TYPES[ext.toLowerCase()] ?? 'application/octet-stream'
}

function isLocalPath(value: string): boolean {
  return !/^https?:\/\//i.test(value)
}

function extractThumbnailValue(raw: string): string | undefined {
  const thumbnail: unknown = matter(raw).data['thumbnail']
  return typeof thumbnail === 'string' ? thumbnail : undefined
}

function rewriteThumbnailLine(raw: string, newValue: string): string {
  return raw.replace(/^thumbnail:.*$/m, `thumbnail: ${newValue}`)
}

export interface SyncThumbnailsOptions {
  /** Directory holding the flat .mdx post files (and their colocated thumbnail images). */
  postsDir: string
  r2Client: R2Client
  publicBaseUrl: string
  /** Report-only: finds unsynced local-path thumbnails without uploading or writing files. */
  check?: boolean
}

export interface SyncedThumbnail {
  file: string
  key: string
  url: string
}

export interface SyncThumbnailsResult {
  synced: SyncedThumbnail[]
  /** Post files whose thumbnail is still a local path. Only populated in check mode. */
  unsynced: string[]
}

/**
 * Finds posts whose `thumbnail:` frontmatter is still a local path, uploads
 * the colocated image to R2 (skipping the upload if that content hash is
 * already there), and rewrites the frontmatter in place to the final
 * public URL — the .mdx file stays the single source of truth, no separate
 * local-path-to-URL manifest.
 */
export async function syncThumbnails({
  postsDir,
  r2Client,
  publicBaseUrl,
  check = false,
}: SyncThumbnailsOptions): Promise<SyncThumbnailsResult> {
  const files = (await readdir(postsDir)).filter((file) =>
    file.endsWith('.mdx'),
  )

  const synced: SyncedThumbnail[] = []
  const unsynced: string[] = []

  for (const file of files) {
    const filePath = path.join(postsDir, file)
    const raw = await readFile(filePath, 'utf-8')
    const thumbnail = extractThumbnailValue(raw)

    if (!thumbnail || !isLocalPath(thumbnail)) continue

    if (check) {
      unsynced.push(file)
      continue
    }

    const imagePath = path.join(postsDir, thumbnail)
    const imageBytes = await readFile(imagePath)
    const hash = createHash('sha256')
      .update(imageBytes)
      .digest('hex')
      .slice(0, HASH_LENGTH)
    const ext = path.extname(thumbnail)
    const key = `thumbnails/${hash}${ext}`

    if (!(await r2Client.exists(key))) {
      await r2Client.upload(key, imagePath, contentTypeFor(ext))
    }

    const url = `${publicBaseUrl.replace(/\/$/, '')}/${key}`
    await writeFile(filePath, rewriteThumbnailLine(raw, url), 'utf-8')

    synced.push({ file, key, url })
  }

  return { synced, unsynced }
}
