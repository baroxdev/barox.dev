import { expect, test } from '@playwright/test'

test.describe('image variants on desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('left renders at the text-column width, right bleeds into the margin column, full breaks out past both', async ({
    page,
  }) => {
    await page.goto('/journal/building-barox-dev')

    const prose = page.locator('.prose-with-sidenotes')
    const left = page.locator('img[alt="A placeholder diagram"]').first()
    const right = page.locator('.image-right')
    const full = page.locator('.image-full')

    await expect(left).toBeVisible()
    await expect(right).toBeVisible()
    await expect(full).toBeVisible()

    const proseBox = await prose.boundingBox()
    const leftBox = await left.boundingBox()
    const rightBox = await right.boundingBox()
    const fullBox = await full.boundingBox()
    if (!proseBox || !leftBox || !rightBox || !fullBox) {
      throw new Error('expected all four elements to have a bounding box')
    }

    // left stays within the text column.
    expect(leftBox.x).toBeGreaterThanOrEqual(proseBox.x - 1)
    expect(leftBox.x + leftBox.width).toBeLessThanOrEqual(proseBox.x + proseBox.width + 1)

    // right bleeds into the margin, right of the text column — same as a
    // sidenote.
    expect(rightBox.x).toBeGreaterThan(proseBox.x + proseBox.width - 5)

    // full breaks out past the text column on the right, further than the
    // right variant's own left edge — it spans the reserved margin column
    // too, not just the text column.
    expect(fullBox.x + fullBox.width).toBeGreaterThan(proseBox.x + proseBox.width)
    expect(fullBox.width).toBeGreaterThan(proseBox.width)
  })
})

test.describe('image variants on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('right and full both collapse to the same in-flow width as left', async ({
    page,
  }) => {
    await page.goto('/journal/building-barox-dev')

    const left = page.locator('img[alt="A placeholder diagram"]').first()
    const right = page.locator('.image-right')
    const full = page.locator('.image-full')

    await expect(left).toBeVisible()
    await expect(right).toBeVisible()
    await expect(full).toBeVisible()

    const leftBox = await left.boundingBox()
    const rightBox = await right.boundingBox()
    const fullBox = await full.boundingBox()
    if (!leftBox || !rightBox || !fullBox) {
      throw new Error('expected all three elements to have a bounding box')
    }

    // No margin column below the breakpoint: right and full render at the
    // same width as left, not bled/broken out.
    expect(rightBox.width).toBeCloseTo(leftBox.width, 0)
    expect(fullBox.width).toBeCloseTo(leftBox.width, 0)
  })
})
