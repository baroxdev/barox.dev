import { expect, test } from '@playwright/test'

test('a sample post with code blocks renders without error', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  const response = await page.goto('/journal/building-barox-dev')
  expect(response?.ok()).toBe(true)

  await expect(
    page.getByRole('heading', {
      name: 'Building barox.dev, Kicking Off the Journal',
    }),
  ).toBeVisible()

  await expect(page.locator('[data-code-figure]').first()).toBeVisible()

  expect(errors).toEqual([])
})

test('an unknown slug shows the not-found page instead of crashing', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/journal/this-post-does-not-exist')

  await expect(
    page.getByRole('heading', { name: 'Post not found' }),
  ).toBeVisible()

  expect(errors).toEqual([])
})
