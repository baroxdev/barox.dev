import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { syncTakeaways } from '../sync-takeaways.ts'
import type { TakeawaysClient, TakeawaysInput } from '../takeaways-client.ts'

const FIXTURE_TAKEAWAYS = [
  'The content pipeline validates frontmatter before anything renders.',
  'Posts are plain MDX files, no CMS.',
  'Excerpts are derived, not hand-written.',
]

function createFakeClient(
  respond: (input: TakeawaysInput) => Promise<string[]> = async () =>
    FIXTURE_TAKEAWAYS,
): TakeawaysClient & { calls: TakeawaysInput[] } {
  const calls: TakeawaysInput[] = []
  return {
    calls,
    async generate(input) {
      calls.push(input)
      return respond(input)
    },
  }
}

describe('syncTakeaways', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'sync-takeaways-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  async function writePost(name: string, frontmatter: string, body: string) {
    await writeFile(
      path.join(dir, name),
      `---\n${frontmatter}\n---\n\n${body}\n`,
      'utf-8',
    )
  }

  it('generates takeaways for a published post with none set, and writes them into frontmatter', async () => {
    await writePost(
      'a-post.mdx',
      'slug: a-post\ntitle: A Post\ndate: 2026-01-01\ntags: []\npublished: true',
      'Some body content.',
    )

    const client = createFakeClient()
    const result = await syncTakeaways({ postsDir: dir, client })

    expect(result.synced).toEqual([
      { file: 'a-post.mdx', takeaways: FIXTURE_TAKEAWAYS },
    ])
    expect(result.skipped).toHaveLength(0)

    const rewritten = await readFile(path.join(dir, 'a-post.mdx'), 'utf-8')
    expect(rewritten).toContain('keyTakeaways:')
    expect(rewritten).toContain(
      '  - "The content pipeline validates frontmatter before anything renders."',
    )
  })

  it('passes the plain-text (markdown-stripped) body and title to the client', async () => {
    await writePost(
      'a-post.mdx',
      'slug: a-post\ntitle: A Post\ndate: 2026-01-01\ntags: []\npublished: true',
      'A [link](https://example.com) and **bold** text.\n\n```js\ncode block\n```',
    )

    const client = createFakeClient()
    await syncTakeaways({ postsDir: dir, client })

    expect(client.calls).toHaveLength(1)
    expect(client.calls[0]).toEqual({
      title: 'A Post',
      body: 'A link and bold text.',
    })
  })

  it('is idempotent: a post that already has keyTakeaways is never regenerated', async () => {
    await writePost(
      'a-post.mdx',
      'slug: a-post\ntitle: A Post\ndate: 2026-01-01\ntags: []\npublished: true\nkeyTakeaways:\n  - "Existing takeaway."',
      'Body.',
    )

    const client = createFakeClient()
    const result = await syncTakeaways({ postsDir: dir, client })

    expect(result.synced).toHaveLength(0)
    expect(client.calls).toHaveLength(0)

    const untouched = await readFile(path.join(dir, 'a-post.mdx'), 'utf-8')
    expect(untouched).toContain('Existing takeaway.')
  })

  it('freezes generated takeaways: a later title edit does not trigger regeneration', async () => {
    await writePost(
      'a-post.mdx',
      'slug: a-post\ntitle: A Post\ndate: 2026-01-01\ntags: []\npublished: true',
      'Body.',
    )

    const client = createFakeClient()
    const first = await syncTakeaways({ postsDir: dir, client })
    expect(first.synced).toHaveLength(1)

    const rewritten = await readFile(path.join(dir, 'a-post.mdx'), 'utf-8')
    await writeFile(
      path.join(dir, 'a-post.mdx'),
      rewritten.replace('title: A Post', 'title: A Much Better Title'),
      'utf-8',
    )

    const second = await syncTakeaways({ postsDir: dir, client })

    expect(second.synced).toHaveLength(0)
    expect(client.calls).toHaveLength(1)
  })

  it('skips an unpublished draft entirely, without calling the client', async () => {
    await writePost(
      'draft.mdx',
      'slug: draft\ntitle: A Draft\ndate: 2026-01-01\ntags: []\npublished: false',
      'Body.',
    )

    const client = createFakeClient()
    const result = await syncTakeaways({ postsDir: dir, client })

    expect(result.synced).toHaveLength(0)
    expect(client.calls).toHaveLength(0)

    const untouched = await readFile(path.join(dir, 'draft.mdx'), 'utf-8')
    expect(untouched).not.toContain('keyTakeaways:')
  })

  it('records a failed generation as skipped, without writing anything, and continues to the next post', async () => {
    await writePost(
      'fails.mdx',
      'slug: fails\ntitle: Fails\ndate: 2026-01-01\ntags: []\npublished: true',
      'Body.',
    )
    await writePost(
      'succeeds.mdx',
      'slug: succeeds\ntitle: Succeeds\ndate: 2026-01-01\ntags: []\npublished: true',
      'Body.',
    )

    const client = createFakeClient(async ({ title }) => {
      if (title === 'Fails') throw new Error('rate limited')
      return FIXTURE_TAKEAWAYS
    })

    const result = await syncTakeaways({ postsDir: dir, client })

    expect(result.synced).toEqual([
      { file: 'succeeds.mdx', takeaways: FIXTURE_TAKEAWAYS },
    ])
    expect(result.skipped).toEqual([
      { file: 'fails.mdx', reason: 'rate limited' },
    ])

    const untouched = await readFile(path.join(dir, 'fails.mdx'), 'utf-8')
    expect(untouched).not.toContain('keyTakeaways:')
  })
})
