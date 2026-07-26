import { expect, test } from '@playwright/test'

test('a known tag lists its published posts', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  const response = await page.goto('/journal/tags/meta')
  expect(response?.ok()).toBe(true)

  await expect(
    page.getByRole('heading', { name: /building barox\.dev/i }),
  ).toBeVisible()

  expect(errors).toEqual([])
})

test('an unknown tag shows an empty state, not an error', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  const response = await page.goto('/journal/tags/does-not-exist')
  expect(response?.ok()).toBe(true)

  await expect(page.getByText(/no posts tagged/i)).toBeVisible()

  expect(errors).toEqual([])
})
