// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Sidenote } from '../sidenote.tsx'

function getCheckbox(): HTMLInputElement {
  return screen.getByRole('checkbox')
}

describe('Sidenote', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders its content and an unchecked toggle', () => {
    render(<Sidenote>A note about the text.</Sidenote>)

    expect(screen.getByText('A note about the text.')).toBeTruthy()
    expect(getCheckbox().checked).toBe(false)
  })

  it('associates the marker label with the toggle checkbox', () => {
    render(<Sidenote>A note about the text.</Sidenote>)

    const label = document.querySelector(`label[for="${getCheckbox().id}"]`)

    expect(label).not.toBeNull()
  })

  it('checks the toggle when its marker is clicked, unchecks on a second click', () => {
    render(<Sidenote>Note text</Sidenote>)
    const marker = screen.getByText('Sidenote')

    fireEvent.click(marker)
    expect(getCheckbox().checked).toBe(true)

    fireEvent.click(marker)
    expect(getCheckbox().checked).toBe(false)
  })

  it('gives each Sidenote instance its own toggle id', () => {
    render(
      <>
        <Sidenote>First</Sidenote>
        <Sidenote>Second</Sidenote>
      </>,
    )

    const [first, second] = screen.getAllByRole('checkbox') as [
      HTMLInputElement,
      HTMLInputElement,
    ]
    expect(first.id).not.toEqual(second.id)
  })
})
