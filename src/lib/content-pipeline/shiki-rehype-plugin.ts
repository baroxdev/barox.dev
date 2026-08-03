import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import githubDark from 'shiki/themes/github-dark.mjs'
import githubLight from 'shiki/themes/github-light.mjs'
import bash from 'shiki/langs/bash.mjs'
import javascript from 'shiki/langs/javascript.mjs'
import json from 'shiki/langs/json.mjs'
import jsx from 'shiki/langs/jsx.mjs'
import tsx from 'shiki/langs/tsx.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import {
  codeFigureTransformer,
  parseCodeFenceMeta,
} from './shiki-code-figure.ts'

/**
 * Dual light/dark Shiki themes so highlighted code follows this site's
 * class-based dark-mode toggle (see styles.css) instead of a single fixed
 * palette.
 */
const SHIKI_THEMES = { light: 'github-light', dark: 'github-dark' } as const

/**
 * Uses @shikijs/rehype's "/core" entry point + statically imported
 * per-language/theme grammar modules — not rehype-pretty-code, and not
 * shiki's own "getSingletonHighlighter"/"createHighlighter" convenience API.
 * Both of those have a hard-coded top-level `import ... from 'shiki'` (the
 * full ~200-language, ~50-theme bundle) that the bundler cannot tree-shake
 * even when a `langs`/`getHighlighter` option is supplied at runtime — that
 * blew the build up to 13MB of unused-language chunks for content that only
 * ever uses `ts`. Static imports are exactly what the bundler *can* narrow —
 * add a language here the day a post needs it.
 */
let highlighterPromise: ReturnType<typeof createHighlighterCore> | undefined

function getScopedHighlighter() {
  highlighterPromise ??= createHighlighterCore({
    themes: [githubLight, githubDark],
    langs: [typescript, tsx, javascript, jsx, json, bash],
    engine: createJavaScriptRegexEngine(),
  })
  return highlighterPromise
}

/**
 * Rehype plugin factory: registered in vite-mdx-plugin.ts's custom Vite
 * plugin, so highlighting happens once at build time as part of compiling
 * content/journal/*.mdx into real components — not at request time (see
 * compiled-posts.ts). MDX content can't be rendered via @mdx-js/mdx's
 * runSync/run at request time at all on this project's deploy target:
 * Cloudflare Workers' isolate sandbox disallows the `new Function()` call
 * those use internally, a platform security boundary, not a config option.
 */
export function rehypeShikiCodeBlocks() {
  return async (
    ...args: Parameters<ReturnType<typeof rehypeShikiFromHighlighter>>
  ) => {
    const highlighter = await getScopedHighlighter()
    return rehypeShikiFromHighlighter(highlighter, {
      themes: SHIKI_THEMES,
      defaultColor: false,
      parseMetaString: parseCodeFenceMeta,
      transformers: [codeFigureTransformer],
    })(...args)
  }
}
