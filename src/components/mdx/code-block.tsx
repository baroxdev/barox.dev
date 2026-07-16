import { useRef, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { Check, Copy } from 'lucide-react'

const COPIED_RESET_MS = 1500

/**
 * Overrides every `<figure>` the compiled MDX body renders — the only place
 * both the optional title (a sibling `<figcaption>`) and the highlighted
 * `<pre>` are reachable together (see shiki-code-figure.ts). Only adds the
 * copy button when the figure actually came from that code-block wrapper
 * (`data-code-figure`); any other `<figure>` a post uses (e.g.
 * an image caption) renders untouched. Chrome/title styling is CSS only
 * (see styles.css); this component only owns the copy button, the one
 * interactive/stateful piece of the post body.
 */
export function CodeBlock({
  children,
  ...props
}: ComponentPropsWithoutRef<'figure'>) {
  const figureRef = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const code = figureRef.current?.querySelector('pre')?.textContent ?? ''
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), COPIED_RESET_MS)
  }

  if (!('data-code-figure' in props)) {
    return <figure {...props}>{children}</figure>
  }

  return (
    <figure {...props} ref={figureRef} className="group relative">
      {children}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code to clipboard'}
        className="absolute right-2 top-2 rounded border border-border bg-paper p-1.5 text-ink-muted opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
      >
        {copied ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </figure>
  )
}
