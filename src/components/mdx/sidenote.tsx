import type { ReactNode } from 'react'

/**
 * Minimal stub: renders inline, no marginalia column layout. Issue #8
 * ("Sidenote / marginalia system") replaces this with the real design.
 */
export function Sidenote({ children }: { children?: ReactNode }) {
  return <span className="italic text-ink-muted">{children}</span>
}
