import { defineConfig, devices } from '@playwright/test'

// A dedicated, uncommon port (not the shared "pnpm dev" port 3000) — this
// repo's dev server routinely runs alongside other parallel worktrees/agent
// sessions on the same machine, so a fixed, less-likely-to-collide port
// with --strictPort (fail fast, don't silently drift to a different port)
// keeps this URL trustworthy instead of drifting out of sync with reality.
const PORT = 4317

export default defineConfig({
  testDir: './e2e',
  // Only one webServer instance is shared across every test here — Vite's
  // dev-mode on-demand compilation doesn't handle concurrent cold requests
  // well, so parallel workers can abort each other's navigations. This
  // suite is a handful of smoke tests, not a large one; correctness matters
  // more than parallel speed here.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm exec vite dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
