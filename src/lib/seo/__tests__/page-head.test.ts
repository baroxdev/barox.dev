import { describe, expect, it } from 'vitest'
import { buildPageHead } from '../page-head.ts'
import { SITE_NAME, SITE_URL } from '../site-url.ts'

describe('buildPageHead', () => {
  it('builds title, description, and canonical link for a page', () => {
    const head = buildPageHead({
      title: 'Journal',
      description: 'Notes on software engineering.',
      path: '/journal',
    })

    expect(head.meta).toContainEqual({ title: 'Journal' })
    expect(head.meta).toContainEqual({
      name: 'description',
      content: 'Notes on software engineering.',
    })
    expect(head.links).toContainEqual({
      rel: 'canonical',
      href: `${SITE_URL}/journal`,
    })
  })

  it('builds Open Graph tags from the same title/description', () => {
    const head = buildPageHead({
      title: 'A Post',
      description: 'An excerpt.',
      path: '/journal/a-post',
    })

    expect(head.meta).toContainEqual({
      property: 'og:title',
      content: 'A Post',
    })
    expect(head.meta).toContainEqual({
      property: 'og:description',
      content: 'An excerpt.',
    })
    expect(head.meta).toContainEqual({
      property: 'og:url',
      content: `${SITE_URL}/journal/a-post`,
    })
    expect(head.meta).toContainEqual({
      property: 'og:site_name',
      content: SITE_NAME,
    })
  })

  it('defaults og:type to "website"', () => {
    const head = buildPageHead({
      title: 'Home',
      description: 'Home page.',
      path: '/',
    })

    expect(head.meta).toContainEqual({
      property: 'og:type',
      content: 'website',
    })
  })

  it('accepts an explicit og:type override (e.g. "article" for posts)', () => {
    const head = buildPageHead({
      title: 'A Post',
      description: 'An excerpt.',
      path: '/journal/a-post',
      type: 'article',
    })

    expect(head.meta).toContainEqual({
      property: 'og:type',
      content: 'article',
    })
  })

  it('builds Twitter Card tags from the same title/description', () => {
    const head = buildPageHead({
      title: 'A Post',
      description: 'An excerpt.',
      path: '/journal/a-post',
    })

    expect(head.meta).toContainEqual({
      name: 'twitter:card',
      content: 'summary',
    })
    expect(head.meta).toContainEqual({
      name: 'twitter:title',
      content: 'A Post',
    })
    expect(head.meta).toContainEqual({
      name: 'twitter:description',
      content: 'An excerpt.',
    })
  })

  it('joins path onto SITE_URL without a double slash for the root path', () => {
    const head = buildPageHead({ title: 'Home', description: 'x', path: '/' })

    expect(head.links).toContainEqual({ rel: 'canonical', href: SITE_URL })
  })

  it('omits the script:ld+json meta entry when jsonLd is not given', () => {
    const head = buildPageHead({ title: 'Home', description: 'x', path: '/' })

    expect(head.meta.some((entry) => 'script:ld+json' in entry)).toBe(false)
  })

  it('adds a script:ld+json meta entry when jsonLd is given', () => {
    const head = buildPageHead({
      title: 'A Post',
      description: 'An excerpt.',
      path: '/journal/a-post',
      jsonLd: { '@type': 'Article', headline: 'A Post' },
    })

    expect(head.meta).toContainEqual({
      'script:ld+json': { '@type': 'Article', headline: 'A Post' },
    })
  })
})
