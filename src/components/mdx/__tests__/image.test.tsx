// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Image } from '../image.tsx'

describe('Image', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the src and alt unchanged', () => {
    render(<Image src="/images/placeholder-diagram.svg" alt="A diagram" />)

    const img = screen.getByRole('img', { name: 'A diagram' })
    expect(img.getAttribute('src')).toBe('/images/placeholder-diagram.svg')
  })

  it('defaults to the left variant, with no image-left class', () => {
    render(<Image src="/images/placeholder-diagram.svg" alt="A diagram" />)

    const img = screen.getByRole('img', { name: 'A diagram' })
    expect(img.className).not.toMatch(/image-/)
  })

  it('applies an image-right class for the right variant', () => {
    render(
      <Image
        src="/images/placeholder-diagram.svg"
        alt="A diagram"
        variant="right"
      />,
    )

    const img = screen.getByRole('img', { name: 'A diagram' })
    expect(img.className).toMatch(/\bimage-right\b/)
  })

  it('applies an image-full class for the full variant', () => {
    render(
      <Image
        src="/images/placeholder-wide.svg"
        alt="A wide diagram"
        variant="full"
      />,
    )

    const img = screen.getByRole('img', { name: 'A wide diagram' })
    expect(img.className).toMatch(/\bimage-full\b/)
  })
})
