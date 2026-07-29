import { createFileRoute } from '@tanstack/react-router'
import { buildPageHead } from '../lib/seo/page-head.ts'
import { cv } from '../content/cv.ts'

export const Route = createFileRoute('/about')({
  head: () =>
    buildPageHead({
      title: 'About — barox.dev',
      description:
        'Software Engineer in Ho Chi Minh City, writing about what he learns building software — not a portfolio, a working journal.',
      path: '/about',
    }),
  component: About,
})

function About() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center gap-6">
        <img
          src="/images/avatar.png"
          alt="Barox"
          className="h-24 w-24 rounded-full object-cover"
        />
        <h1 className="text-3xl font-bold text-ink">About</h1>
      </div>

      <div className="prose prose-lg mt-8 max-w-none">
        <p>Barox — Software Engineer, Ho Chi Minh City.</p>

        <p>
          Building at EPOS Vietnam. Before that: Arobid, ClassMate, MangoAds.
          FPT University.
        </p>

        {/* Placeholder — swap for a real photo (workspace/team/whatever)
            whenever one's ready; no other change needed. */}
        <img
          src="/images/placeholder-about.svg"
          alt="Photo coming soon"
          className="h-auto max-w-full rounded"
        />

        <p>
          React. Next.js. TypeScript. Node. And a real interest in where AI is{' '}
          <span className="mark-circle">actually useful</span> — not just where
          it's trendy.
        </p>

        <p>
          barox.dev isn't a portfolio. It's a{' '}
          <span className="mark-circle">journal</span> — the debugging, the
          wrong turns, the small stuff nobody writes down.
        </p>

        <p>
          <a href={cv.contact.github} target="_blank" rel="noreferrer">
            GitHub
          </a>{' '}
          for the code. <a href="/cv">CV</a> if you're hiring. Otherwise —{' '}
          <span className="mark-circle">stick around</span>.
        </p>
      </div>
    </main>
  )
}
