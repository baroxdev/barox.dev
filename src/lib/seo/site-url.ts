/**
 * Production origin, per issue #1's implementation decisions
 * ("Domain barox.dev already registered on Cloudflare"). Used for canonical
 * URLs, Open Graph og:url, and sitemap.xml — none of which should vary by
 * deploy target (canary.barox.dev should still advertise the canonical
 * production URL, not itself).
 */
export const SITE_URL = 'https://barox.dev'

export const SITE_NAME = 'barox.dev'

/**
 * Joins a site-relative path onto SITE_URL, with no trailing slash for the
 * root path — one shared convention, so the canonical/og:url a page
 * declares about itself and the URL the sitemap advertises for that same
 * page always byte-match. (Previously duplicated separately in
 * page-head.ts and build-sitemap.ts, which silently drifted: one produced
 * "https://barox.dev" for the home page, the other
 * "https://barox.dev/" — exactly the signal split canonical URLs exist
 * to prevent.)
 */
export function absoluteUrl(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`
}
