import { useState } from 'react'
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

      const blob = await pdf(<CvPdfDocument cv={cv} />).toBlob()
      const url = URL.createObjectURL(blob)
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
    <button
      type="button"
      onClick={handleClick}
      disabled={status === 'generating'}
      className="rounded-full border border-border px-4 py-1.5 text-sm text-ink no-underline hover:text-accent disabled:opacity-60"
    >
      {status === 'generating'
        ? 'Preparing PDF…'
        : status === 'error'
          ? 'Couldn’t generate PDF — try again'
          : 'Download PDF'}
    </button>
  )
}
