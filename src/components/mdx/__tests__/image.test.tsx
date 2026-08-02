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

  it('defaults to the default variant, with no image-default class', () => {
    render(<Image src="/images/placeholder-diagram.svg" alt="A diagram" />)

    const img = screen.getByRole('img', { name: 'A diagram' })
    expect(img.className).not.toMatch(/image-/)
  })

  it('applies an image-fluid class for the fluid variant', () => {
    render(
      <Image
        src="/images/placeholder-wide.svg"
        alt="A wide diagram"
        variant="fluid"
      />,
    )

    const img = screen.getByRole('img', { name: 'A wide diagram' })
    expect(img.className).toMatch(/\bimage-fluid\b/)
  })
})
