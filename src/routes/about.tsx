import { createFileRoute } from '@tanstack/react-router'
import { buildPageHead } from '../lib/seo/page-head.ts'
import { cv } from '../content/cv.ts'

export const Route = createFileRoute('/about')({
  head: () =>
    buildPageHead({
      title: 'About — barox.dev',
      description:
        "Software Engineer in Ho Chi Minh City, writing about what he learns building software — not a portfolio, a working journal.",
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
        <p>
          I'm Phan Quoc Bao — online, just Barox. I'm a Software Engineer
          based in Ho Chi Minh City, Vietnam, currently building at EPOS
          Vietnam (Floating Cube Studios, part of Ant International), where
          I work on point-of-sale and business management software.
        </p>

        <p>
          Before that, I spent time at Arobid building B2B e-commerce
          tooling, at ClassMate building an IELTS practice platform, and at
          MangoAds building marketing sites for banking and education
          clients. I studied Software Engineering at FPT University.
        </p>

        {/* Placeholder — swap for a real photo (workspace/team/whatever)
            whenever one's ready; no other change needed. */}
        <img
          src="/images/placeholder-about.svg"
          alt="Photo coming soon"
          className="h-auto max-w-full rounded"
        />

        <p>
          Day to day I work mostly in React, Next.js, and TypeScript on the
          frontend, and Node.js/NestJS on the backend — lately with a
          growing interest in where AI actually earns its place in a
          product, rather than being bolted on for its own sake.
        </p>

        <h2>Why this site exists</h2>

        <p>
          barox.dev is a personal engineering journal, not a portfolio. I'm
          writing here to build a writing habit and to keep a record of
          what I actually learn while building things — the debugging
          rabbit holes, the architecture decisions I'd make differently in
          hindsight, and the small lessons that don't fit neatly into a
          pull request description.
        </p>

        <p>
          If you're a fellow engineer, I hope some of it is useful or at
          least relatable. If you're newer to the field, I hope it's
          approachable — most of what ends up here is the kind of thing I
          wish someone had written down for me a few years ago. And if
          you're looking at this site to evaluate me for a role, the{' '}
          <a href="/cv">CV page</a> is the fastest path to what you need.
        </p>

        <p>
          You can find my code on{' '}
          <a href={cv.contact.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          , or reach out by{' '}
          <a href={`mailto:${cv.contact.email}`}>email</a>.
        </p>
      </div>
    </main>
  )
}
