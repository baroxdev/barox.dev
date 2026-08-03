import { configDefaults, defineConfig } from 'vitest/config'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { mdxPlugin } from './src/lib/content-pipeline/vite-mdx-plugin.ts'

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
    // Compiles content/journal/*.mdx into real components at build time —
    // must run before viteReact(). Cloudflare Workers' isolate sandbox
    // disallows the runtime `new Function()` call @mdx-js/mdx's runSync/run
    // use internally, so MDX can't be compiled from a stored string per
    // request on this deploy target (see compiled-posts.ts).
    mdxPlugin(),
    tanstackStart(),
    viteReact(),
  ],
  test: {
    // e2e/ holds Playwright specs, run via `pnpm test:e2e` — Vitest's own
    // default include pattern would otherwise also try to execute them.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      // Coverage is currently tracked for the content pipeline specifically
      // (the project's primary testing seam) rather than applied blindly to
      // presentational/layout code — see AGENTS.md / issue #1.
      include: ['src/lib/content-pipeline/**'],
      exclude: [
        'src/lib/content-pipeline/**/*.test.ts',
        'src/lib/content-pipeline/test-support/**',
        'src/lib/content-pipeline/index.ts',
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
