import { useId } from 'react'
import type { ReactNode } from 'react'

/**
 * Renders in the right margin column on desktop (>=1024px), positioned via
 * float:right/clear:right so multiple sidenotes stack without overlapping —
 * see the `.sidenote-*` rules in styles.css. On mobile it collapses to a
 * numbered marker; tapping toggles the note via a hidden checkbox (no JS
 * state needed).
 */
export function Sidenote({ children }: { children?: ReactNode }) {
  const id = useId()

  return (
    <span className="sidenote">
      <label htmlFor={id} className="sidenote-marker">
        <span className="sr-only">Sidenote</span>
      </label>
      <input type="checkbox" id={id} className="sidenote-toggle" />
      <span className="sidenote-content">{children}</span>
    </span>
  )
}
