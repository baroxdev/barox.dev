import { expect, test } from '@playwright/test'

test.describe('sidenotes on desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('render visible inline in the text column, without overlapping each other', async ({
    page,
  }) => {
    await page.goto('/journal/building-barox-dev')

    const prose = page.locator('.prose-with-sidenotes')
    const notes = page.locator('.sidenote-content')

    await expect(notes.first()).toBeVisible()
    expect(await notes.count()).toBeGreaterThanOrEqual(2)

    const proseBox = await prose.boundingBox()
    const firstBox = await notes.nth(0).boundingBox()
    const secondBox = await notes.nth(1).boundingBox()
    if (!proseBox || !firstBox || !secondBox) {
      throw new Error('expected all three elements to have a bounding box')
    }

    // Rendered in flow, within the text column — not bled into a margin.
    expect(firstBox.x).toBeCloseTo(proseBox.x, 0)
    expect(secondBox.x).toBeCloseTo(proseBox.x, 0)

    // Stacked, not collided: the second note starts no higher than the
    // first one ends.
    expect(secondBox.y).toBeGreaterThanOrEqual(firstBox.y + firstBox.height - 1)
  })

  test('does not show the mobile-only numbered marker', async ({ page }) => {
    await page.goto('/journal/building-barox-dev')

    await expect(page.locator('.sidenote-marker').first()).toBeHidden()
  })
})

test.describe('sidenotes on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('collapse to a marker; tapping toggles the note open and closed', async ({
    page,
  }) => {
    await page.goto('/journal/building-barox-dev')

    const marker = page.locator('.sidenote-marker').first()
    const note = page.locator('.sidenote-content').first()

    await expect(note).toBeHidden()

    await marker.click()
    await expect(note).toBeVisible()

    await marker.click()
    await expect(note).toBeHidden()
  })
})
