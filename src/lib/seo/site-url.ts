/**
 * Production origin, per issue #1's implementation decisions
 * ("Domain barox.dev already registered on Cloudflare"). Used for canonical
 * URLs, Open Graph og:url, and sitemap.xml — none of which should vary by
 * deploy target (canary.barox.dev should still advertise the canonical
 * production URL, not itself).
 */
export const SITE_URL = 'https://barox.dev'

export const SITE_NAME = 'barox.dev'
