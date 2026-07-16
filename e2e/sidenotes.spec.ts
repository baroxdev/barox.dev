import { expect, test } from '@playwright/test'

test.describe('sidenotes on desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('render visible in the margin, right of the text column, without overlapping each other', async ({
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

    // Positioned in the margin: to the right of the text column, not
    // inline within it.
    expect(firstBox.x).toBeGreaterThan(proseBox.x + proseBox.width - 5)
    expect(secondBox.x).toBeGreaterThan(proseBox.x + proseBox.width - 5)

    // Stacked, not collided: the second note starts no higher than the
    // first one ends.
    expect(secondBox.y).toBeGreaterThanOrEqual(firstBox.y + firstBox.height - 1)
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
