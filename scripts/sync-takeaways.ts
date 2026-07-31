import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGeminiTakeawaysClient } from './lib/takeaways-client.ts'
import { syncTakeaways } from './lib/sync-takeaways.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = path.join(__dirname, '..', 'content', 'journal')

async function runSync() {
  const apiKey = process.env['GEMINI_API_KEY']
  if (!apiKey) {
    // Not a publish blocker (see sync-takeaways.ts): posts just ship
    // without a Key Takeaways box until this is run with a key configured.
    console.warn(
      'GEMINI_API_KEY not set — skipping key-takeaways generation.',
    )
    return
  }

  const model = process.env['GEMINI_MODEL']
  const client = createGeminiTakeawaysClient(apiKey, model)

  const { synced, skipped } = await syncTakeaways({
    postsDir: POSTS_DIR,
    client,
  })

  for (const { file, takeaways } of synced) {
    console.log(`${file} -> ${takeaways.length} takeaways generated`)
  }
  for (const { file, reason } of skipped) {
    console.warn(`${file}: skipped (${reason})`)
  }
  if (synced.length === 0 && skipped.length === 0) {
    console.log('No posts need key takeaways.')
  }
}

runSync().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
