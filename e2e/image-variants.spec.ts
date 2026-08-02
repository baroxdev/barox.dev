import { expect, test } from '@playwright/test'

test.describe('image variants on desktop', () => {
  test.use({ viewport: { width: 1280, height: 900 } })

  test('default and centered stay within the text column; fluid breaks out to the full viewport width', async ({
    page,
  }) => {
    await page.goto('/journal/building-barox-dev')

    const prose = page.locator('.prose-with-sidenotes')
    const defaultVariant = page.locator('img[alt="A placeholder diagram"]').first()
    const centered = page.locator('.image-centered')
    const fluid = page.locator('.image-fluid')

    await expect(defaultVariant).toBeVisible()
    await expect(centered).toBeVisible()
    await expect(fluid).toBeVisible()

    const proseBox = await prose.boundingBox()
    const defaultBox = await defaultVariant.boundingBox()
    const centeredBox = await centered.boundingBox()
    const fluidBox = await fluid.boundingBox()
    if (!proseBox || !defaultBox || !centeredBox || !fluidBox) {
      throw new Error('expected all four elements to have a bounding box')
    }

    // default and centered stay within the text column.
    expect(defaultBox.x).toBeGreaterThanOrEqual(proseBox.x - 1)
    expect(defaultBox.x + defaultBox.width).toBeLessThanOrEqual(proseBox.x + proseBox.width + 1)
    expect(centeredBox.x).toBeGreaterThanOrEqual(proseBox.x - 1)
    expect(centeredBox.x + centeredBox.width).toBeLessThanOrEqual(proseBox.x + proseBox.width + 1)

    // fluid breaks out past the text column on both sides, spanning the
    // full viewport width rather than just the prose column.
    expect(fluidBox.x).toBeLessThan(proseBox.x)
    expect(fluidBox.x + fluidBox.width).toBeGreaterThan(proseBox.x + proseBox.width)
    expect(fluidBox.width).toBeGreaterThan(proseBox.width)
  })
})

test.describe('image variants on mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('default and centered stay within the narrower text column; fluid still breaks out edge-to-edge', async ({
    page,
  }) => {
    await page.goto('/journal/building-barox-dev')

    const prose = page.locator('.prose-with-sidenotes')
    const defaultVariant = page.locator('img[alt="A placeholder diagram"]').first()
    const centered = page.locator('.image-centered')
    const fluid = page.locator('.image-fluid')

    await expect(defaultVariant).toBeVisible()
    await expect(centered).toBeVisible()
    await expect(fluid).toBeVisible()

    const proseBox = await prose.boundingBox()
    const defaultBox = await defaultVariant.boundingBox()
    const centeredBox = await centered.boundingBox()
    const fluidBox = await fluid.boundingBox()
    if (!proseBox || !defaultBox || !centeredBox || !fluidBox) {
      throw new Error('expected all four elements to have a bounding box')
    }

    expect(defaultBox.x).toBeGreaterThanOrEqual(proseBox.x - 1)
    expect(centeredBox.x).toBeGreaterThanOrEqual(proseBox.x - 1)

    // fluid still bleeds past the (narrower) text column's padding,
    // reaching the viewport edge.
    expect(fluidBox.x).toBeLessThan(proseBox.x)
    expect(fluidBox.width).toBeGreaterThan(proseBox.width)
  })
})
