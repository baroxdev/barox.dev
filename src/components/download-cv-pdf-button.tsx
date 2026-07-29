import { useState } from 'react'
import { Button } from '@base-ui/react/button'
import type { CvData } from '../content/cv.ts'

/**
 * Both @react-pdf/renderer and the document definition are dynamically
 * imported inside the click handler — they're only needed once someone
 * actually asks for a PDF, so the ~sizeable renderer/fontkit code never
 * ships in the initial /cv bundle or the SSR bundle.
 */
export function DownloadCvPdfButton({ cv }: { cv: CvData }) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'error'>('idle')

  async function handleClick() {
    setStatus('generating')
    try {
      const [{ pdf }, { CvPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../lib/cv-pdf/cv-pdf-document.tsx'),
      ])

      const pdfBlob = await pdf(<CvPdfDocument cv={cv} />).toBlob()
      // Safari's built-in PDF viewer intercepts navigation to blob: URLs
      // typed application/pdf and previews them instead of honoring the
      // anchor's `download` attribute. Re-typing as a generic binary blob
      // stops Safari from recognizing it as displayable content, so it
      // falls back to actually downloading the file (same well-known
      // workaround used by libraries like FileSaver.js).
      const downloadBlob = new Blob([pdfBlob], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(downloadBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${cv.name.replace(/\s+/g, '-')}-CV.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={status === 'generating'}
      focusableWhenDisabled
      className="rounded-full border border-border px-4 py-1.5 text-sm text-ink no-underline hover:text-accent data-disabled:opacity-60"
    >
      {status === 'generating'
        ? 'Preparing PDF…'
        : status === 'error'
          ? 'Couldn’t generate PDF — try again'
          : 'Download PDF'}
    </Button>
  )
}
