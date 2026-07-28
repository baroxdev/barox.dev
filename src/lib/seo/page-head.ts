import { SITE_NAME, absoluteUrl } from './site-url.ts'

export interface PageHeadOptions {
  title: string
  description: string
  /** Site-relative path, e.g. "/journal/my-post" or "/" for the home page. */
  path: string
  /** Open Graph type. Defaults to "website"; post pages pass "article". */
  type?: 'website' | 'article'
  /** Absolute image URL (e.g. a post's thumbnail) for og:image/twitter:image. */
  image?: string
  /** JSON-LD structured data (e.g. a schema.org Article), for post pages. */
  jsonLd?: Record<string, unknown>
}

/**
 * Builds the title/description/Open Graph/Twitter Card/canonical-link head
 * entries every real page shares, from one title+description pair — so each
 * route's head() only has to supply page-specific content, not repeat this
 * boilerplate. Return shape matches TanStack Router's head() option
 * directly (see src/routes/__root.tsx for the pattern this composes into).
 */
export function buildPageHead({
  title,
  description,
  path,
  type = 'website',
  image,
  jsonLd,
}: PageHeadOptions) {
  const url = absoluteUrl(path)

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: type },
      { property: 'og:url', content: url },
      { property: 'og:site_name', content: SITE_NAME },
      // A thumbnail earns the larger "summary_large_image" Twitter card;
      // without one, "summary" avoids Twitter rendering an empty image box.
      {
        name: 'twitter:card',
        content: image ? 'summary_large_image' : 'summary',
      },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      ...(image
        ? [
            { property: 'og:image', content: image },
            { name: 'twitter:image', content: image },
          ]
        : []),
      ...(jsonLd ? [{ 'script:ld+json': jsonLd }] : []),
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
