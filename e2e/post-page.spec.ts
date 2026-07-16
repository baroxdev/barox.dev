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

  await expect(
    page.locator('[data-rehype-pretty-code-figure]').first(),
  ).toBeVisible()

  expect(errors).toEqual([])
})
