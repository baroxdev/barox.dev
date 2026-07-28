import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createWranglerR2Client } from './lib/r2-client.ts'
import { syncThumbnails } from './lib/sync-thumbnails.ts'
import type { R2Client } from './lib/r2-client.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = path.join(__dirname, '..', 'content', 'journal')

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

/** Never called: check mode returns before any code path reaches this client. */
const uncalledR2Client: R2Client = {
  exists() {
    throw new Error('r2Client.exists should not be called in --check mode')
  },
  upload() {
    throw new Error('r2Client.upload should not be called in --check mode')
  },
}

async function runCheck() {
  const { unsynced } = await syncThumbnails({
    postsDir: POSTS_DIR,
    r2Client: uncalledR2Client,
    publicBaseUrl: '',
    check: true,
  })

  if (unsynced.length > 0) {
    console.error(
      `Found ${unsynced.length} post(s) with an unsynced local thumbnail — run \`pnpm run sync-thumbnails\` locally before committing:\n` +
        unsynced.map((file) => `  - ${file}`).join('\n'),
    )
    process.exitCode = 1
    return
  }

  console.log('All post thumbnails are synced.')
}

async function runSync() {
  const bucket = requireEnv('R2_BUCKET_NAME')
  const publicBaseUrl = requireEnv('R2_PUBLIC_BASE_URL')

  const { synced } = await syncThumbnails({
    postsDir: POSTS_DIR,
    r2Client: createWranglerR2Client(bucket),
    publicBaseUrl,
  })

  if (synced.length === 0) {
    console.log('No local-path thumbnails to sync.')
    return
  }

  for (const { file, url } of synced) {
    console.log(`${file} -> ${url}`)
  }
}

const check = process.argv.includes('--check')

;(check ? runCheck() : runSync()).catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
