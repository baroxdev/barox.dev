import { expect, test } from '@playwright/test'

test('the home page has a real title, description, and canonical link', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page).toHaveTitle('barox.dev — Notes from building software')

  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /./,
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://barox.dev',
  )
})

test('a post page has a distinct title and JSON-LD Article data', async ({
  page,
}) => {
  await page.goto('/journal/building-barox-dev')

  await expect(page).toHaveTitle(
    'Building barox.dev, Kicking Off the Journal — barox.dev',
  )

  const jsonLd = await page
    .locator('script[type="application/ld+json"]')
    .textContent()
  expect(JSON.parse(jsonLd ?? '{}')).toMatchObject({
    '@type': 'Article',
    headline: 'Building barox.dev, Kicking Off the Journal',
  })
})

test('sitemap.xml is served as valid XML listing the real post', async ({
  request,
}) => {
  const response = await request.get('/sitemap.xml')

  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toContain('application/xml')

  const body = await response.text()
  expect(body).toContain('<urlset')
  expect(body).toContain('https://barox.dev/journal/building-barox-dev')
})
