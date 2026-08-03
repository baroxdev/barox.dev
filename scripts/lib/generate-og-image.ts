import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import type { ReactNode } from 'react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CARD_WIDTH = 1200
const CARD_HEIGHT = 630

/**
 * Mirrors src/styles.css's light-theme tokens (--color-paper/-ink/etc).
 * satori can't read live CSS custom properties, so these are duplicated —
 * if the site's palette changes, update these too and re-sync any
 * auto-generated og:images (delete their `ogImage:` line) to pick up
 * the new colors; existing ones are frozen, same as manual thumbnails.
 */
const COLORS = {
  paper: '#fbf6ec',
  ink: '#1f2430',
  inkMuted: '#5b5a52',
  accent: '#1b3a5c',
}

const FONT_DIR = path.join(
  __dirname,
  '..',
  '..',
  'node_modules',
  '@fontsource',
  'fira-sans',
  'files',
)

let fontsPromise: Promise<{ regular: Buffer; bold: Buffer }> | undefined

function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(path.join(FONT_DIR, 'fira-sans-latin-400-normal.woff')),
    readFile(path.join(FONT_DIR, 'fira-sans-latin-700-normal.woff')),
  ]).then(([regular, bold]) => ({ regular, bold }))
  return fontsPromise
}

export interface OgImageData {
  title: string
  tags: string[]
  /** gray-matter parses YAML `date:` scalars into a Date already; a string is also accepted. */
  date: Date | string | unknown
  avatarPath: string
}

function formatCardDate(date: unknown): string {
  return new Date(date as string | number | Date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * satori's own runtime just duck-types a `{ type, props }` tree — this
 * project builds that tree as plain object literals rather than JSX, so
 * this local shape (not satori's public `ReactNode`-typed signature) is
 * what the tree below is actually checked against.
 */
interface CardElement {
  type: string
  props: {
    style?: Record<string, string | number>
    children?: CardElement | CardElement[] | string
  } & Record<string, unknown>
}

function headerBlock(data: OgImageData): CardElement {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column' },
      children: [
        {
          type: 'div',
          props: {
            style: { fontSize: 28, color: COLORS.inkMuted },
            children: 'barox.dev/journal',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              marginTop: 24,
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.2,
              color: COLORS.ink,
            },
            children: data.title,
          },
        },
        ...(data.tags.length > 0
          ? [
              {
                type: 'div',
                props: {
                  style: {
                    marginTop: 24,
                    fontSize: 28,
                    color: COLORS.inkMuted,
                  },
                  children: data.tags.join(' · '),
                },
              },
            ]
          : []),
      ],
    },
  }
}

function attributionBlock(
  data: OgImageData,
  avatarDataUrl: string,
): CardElement {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', alignItems: 'center' },
      children: [
        {
          type: 'img',
          props: {
            src: avatarDataUrl,
            width: 56,
            height: 56,
            style: { borderRadius: '50%' },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              marginLeft: 16,
              fontSize: 26,
              fontWeight: 700,
              color: COLORS.ink,
            },
            children: 'Barox',
          },
        },
        {
          type: 'div',
          props: {
            style: { marginLeft: 12, fontSize: 26, color: COLORS.inkMuted },
            children: `published on ${formatCardDate(data.date)}`,
          },
        },
      ],
    },
  }
}

function accentBar(): CardElement {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        width: '100%',
        height: 8,
        backgroundColor: COLORS.accent,
        marginTop: 32,
      },
    },
  }
}

/**
 * Renders a 1200x630 og:image card (title + tags + author attribution) for
 * posts with no manually-uploaded thumbnail. This is a link-preview asset
 * only — it duplicates content the page itself already renders (title,
 * tags, author, date), so unlike a manual thumbnail it's never shown as an
 * on-site banner. satori lays out JSX as SVG; resvg rasterizes that SVG to
 * PNG — the caller runs the result through the same optimize/upload
 * pipeline as a manual thumbnail.
 */
export async function generateOgImage(data: OgImageData): Promise<Buffer> {
  const [{ regular, bold }, avatarBytes] = await Promise.all([
    loadFonts(),
    readFile(data.avatarPath),
  ])

  const avatarExt = path.extname(data.avatarPath).slice(1)
  const avatarDataUrl = `data:image/${avatarExt};base64,${avatarBytes.toString('base64')}`

  const card: CardElement = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.paper,
        padding: '64px 72px 48px',
        fontFamily: 'Fira Sans',
      },
      children: [
        headerBlock(data),
        attributionBlock(data, avatarDataUrl),
        accentBar(),
      ],
    },
  }

  const svg = await satori(card as unknown as ReactNode, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [
      { name: 'Fira Sans', data: regular, weight: 400, style: 'normal' },
      { name: 'Fira Sans', data: bold, weight: 700, style: 'normal' },
    ],
  })

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH } })
  return resvg.render().asPng()
}
