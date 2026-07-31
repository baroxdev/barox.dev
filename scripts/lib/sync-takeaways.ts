import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import type { TakeawaysClient } from './takeaways-client.ts'

interface FrontmatterFields {
  title: string
  published: boolean
  hasKeyTakeaways: boolean
  body: string
}

function extractFrontmatterFields(raw: string): FrontmatterFields {
  const parsed = matter(raw)
  const data = parsed.data as Record<string, unknown>

  return {
    title: typeof data['title'] === 'string' ? data['title'] : '',
    published: data['published'] === true,
    hasKeyTakeaways: Array.isArray(data['keyTakeaways']),
    body: parsed.content,
  }
}

/** Plain-text extraction mirroring content-pipeline's deriveExcerpt, but
 * untruncated — the AI needs the whole post, not a 200-char preview. Kept
 * as a local copy rather than importing from src/: scripts/ has stayed
 * self-contained from gray-matter parsing on down (see sync-thumbnails.ts's
 * own extractFrontmatterFields for the same reasoning). */
function stripMarkdown(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/<\/?[A-Za-z][^>]*>/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Inserts a YAML list block just before the closing frontmatter `---`.
 * Insert-only (no replace branch, unlike sync-thumbnails's
 * setFrontmatterLine): keyTakeaways is frozen once set, so this is only
 * ever called when the field doesn't already exist yet. Each item is
 * JSON-stringified — a valid YAML double-quoted flow scalar — so any
 * character the AI returns (colons, quotes) round-trips safely. */
function insertFrontmatterList(
  raw: string,
  key: string,
  values: string[],
): string {
  const block = `${key}:\n${values.map((v) => `  - ${JSON.stringify(v)}`).join('\n')}\n`
  return raw.replace(/\n---\n/, `\n${block}---\n`)
}

export interface SyncTakeawaysOptions {
  /** Directory holding the flat .mdx post files. */
  postsDir: string
  client: TakeawaysClient
}

export interface SyncedTakeaways {
  file: string
  takeaways: string[]
}

export interface SkippedTakeaways {
  file: string
  reason: string
}

export interface SyncTakeawaysResult {
  synced: SyncedTakeaways[]
  /** Posts where generation was attempted but failed — not a run failure,
   * see sync-takeaways.ts's runSync: these are logged and left for a
   * future run rather than blocking anything. */
  skipped: SkippedTakeaways[]
}

/**
 * keyTakeaways is frozen once synced, same manual-trigger model as
 * thumbnail/ogImage (see sync-thumbnails.ts): a later title/body edit does
 * NOT regenerate it, the author must delete the field and re-run to force
 * a refresh. Unlike thumbnail/ogImage, this field is optional even for a
 * fully "synced" post — a failed/unavailable generation just leaves it
 * unset, since a key-takeaways box is an enhancement, not a publish
 * requirement.
 */
export async function syncTakeaways({
  postsDir,
  client,
}: SyncTakeawaysOptions): Promise<SyncTakeawaysResult> {
  const files = (await readdir(postsDir)).filter((file) =>
    file.endsWith('.mdx'),
  )

  const synced: SyncedTakeaways[] = []
  const skipped: SkippedTakeaways[] = []

  for (const file of files) {
    const filePath = path.join(postsDir, file)
    const raw = await readFile(filePath, 'utf-8')
    const fields = extractFrontmatterFields(raw)

    if (!fields.published) continue // drafts don't need takeaways yet
    if (fields.hasKeyTakeaways) continue // frozen once generated

    try {
      const takeaways = await client.generate({
        title: fields.title,
        body: stripMarkdown(fields.body),
      })
      const rewritten = insertFrontmatterList(raw, 'keyTakeaways', takeaways)
      await writeFile(filePath, rewritten, 'utf-8')
      synced.push({ file, takeaways })
    } catch (error) {
      skipped.push({
        file,
        reason: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return { synced, skipped }
}
