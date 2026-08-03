// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeBlock } from '../code-block.tsx'

function renderCodeBlock() {
  return render(
    <CodeBlock data-code-figure="">
      <figcaption data-code-title="">example.ts</figcaption>
      <pre>
        <code>const x = 1</code>
      </pre>
    </CodeBlock>,
  )
}

describe('CodeBlock', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders its children (the title and highlighted code) unchanged', () => {
    renderCodeBlock()

    expect(screen.getByText('example.ts')).toBeTruthy()
    expect(screen.getByText('const x = 1')).toBeTruthy()
  })

  it('copies the pre element’s text content to the clipboard on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    renderCodeBlock()

    fireEvent.click(screen.getByRole('button', { name: /copy code/i }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('const x = 1'))
  })

  it('shows a "copied" state briefly after a successful copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    renderCodeBlock()

    fireEvent.click(screen.getByRole('button', { name: /copy code/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /copied/i })).toBeTruthy(),
    )
  })

  it('renders a plain figure with no copy button when it is not a code-block figure', () => {
    render(
      <CodeBlock>
        <figcaption>A photo caption</figcaption>
        <img src="/photo.jpg" alt="" />
      </CodeBlock>,
    )

    expect(screen.getByText('A photo caption')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
