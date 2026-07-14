import { defineConfig } from 'vitest/config'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    // The Cloudflare plugin's Worker-environment externals conflict with
    // Vitest's own SSR environment, so skip it under `vitest` (process.env.VITEST).
    ...(process.env.VITEST
      ? []
      : [cloudflare({ viteEnvironment: { name: 'ssr' } })]),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  test: {
    coverage: {
      // Coverage is currently tracked for the content pipeline specifically
      // (the project's primary testing seam) rather than applied blindly to
      // presentational/layout code — see AGENTS.md / issue #1.
      include: ['src/content-pipeline/**'],
      exclude: [
        'src/content-pipeline/**/*.test.ts',
        'src/content-pipeline/test-support/**',
        'src/content-pipeline/index.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
})

export default config
