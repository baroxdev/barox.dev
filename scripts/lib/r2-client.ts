import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface R2Client {
  exists: (key: string) => Promise<boolean>
  upload: (key: string, filePath: string, contentType: string) => Promise<void>
}

export type CommandRunner = (command: string, args: string[]) => Promise<void>

const defaultRunner: CommandRunner = async (command, args) => {
  await execFileAsync(command, args)
}

/**
 * Talks to R2 via the `wrangler` CLI (already a devDependency for deploys)
 * instead of the S3-compatible SDK, so no new credential type is
 * introduced — wrangler already reads CLOUDFLARE_API_TOKEN/
 * CLOUDFLARE_ACCOUNT_ID from the environment for every other command in
 * this repo.
 */
export function createWranglerR2Client(
  bucket: string,
  runCommand: CommandRunner = defaultRunner,
): R2Client {
  return {
    async exists(key) {
      try {
        // `object get` is used purely as an existence probe here — output
        // is discarded to /dev/null since only the exit code matters.
        await runCommand('wrangler', [
          'r2',
          'object',
          'get',
          `${bucket}/${key}`,
          '--remote',
          '--file',
          '/dev/null',
        ])
        return true
      } catch {
        return false
      }
    },
    async upload(key, filePath, contentType) {
      await runCommand('wrangler', [
        'r2',
        'object',
        'put',
        `${bucket}/${key}`,
        '--remote',
        '--file',
        filePath,
        '--content-type',
        contentType,
      ])
    },
  }
}
