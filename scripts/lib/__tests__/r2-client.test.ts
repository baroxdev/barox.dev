import { describe, expect, it, vi } from 'vitest'
import { createWranglerR2Client } from '../r2-client.ts'

describe('createWranglerR2Client', () => {
  it('uploads via `wrangler r2 object put` with --remote and --content-type', async () => {
    const runCommand = vi.fn().mockResolvedValue(undefined)
    const client = createWranglerR2Client('my-bucket', runCommand)

    await client.upload('thumbnails/abc123.png', '/tmp/cover.png', 'image/png')

    expect(runCommand).toHaveBeenCalledWith('wrangler', [
      'r2',
      'object',
      'put',
      'my-bucket/thumbnails/abc123.png',
      '--remote',
      '--file',
      '/tmp/cover.png',
      '--content-type',
      'image/png',
    ])
  })

  it('exists() returns true when the get command succeeds, false when it throws', async () => {
    const runCommand = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('not found'))
    const client = createWranglerR2Client('my-bucket', runCommand)

    await expect(client.exists('thumbnails/abc123.png')).resolves.toBe(true)
    await expect(client.exists('thumbnails/missing.png')).resolves.toBe(false)
  })
})
