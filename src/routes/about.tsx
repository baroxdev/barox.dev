import { createFileRoute } from '@tanstack/react-router'
import { FileText, Github, Linkedin, Mail, Rss } from 'lucide-react'
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
      <p className="text-sm font-semibold tracking-widest text-accent uppercase">
        About
      </p>
      <h1 className="mt-2 text-4xl font-bold text-ink">{cv.name}</h1>

      <div className="mt-10 flex flex-col gap-10 sm:flex-row">
        <img
          src="/images/avatar.png"
          alt={cv.name}
          className="h-56 w-56 shrink-0 rounded-lg object-cover"
        />

        <div className="prose prose-lg max-w-none">
          <p>
            I'm a Software Engineer based in Ho Chi Minh City, Vietnam. I build
            web products end to end — frontend architecture, backend APIs, and
            the occasional AI feature that's actually useful, not bolted on
            for the pitch deck.
          </p>

          <p>
            Currently building at EPOS Vietnam (Floating Cube Studios, part of
            Ant International), on point-of-sale and business management
            software. Before that: B2B e-commerce tooling at Arobid, an IELTS
            practice platform at ClassMate, and marketing sites for banking and
            education clients at MangoAds. I studied Software Engineering at FPT
            University.
          </p>

          <p>
            barox.dev isn't a portfolio — it's a journal. Debugging rabbit
            holes, architecture decisions I'd make differently in hindsight,
            the small lessons that don't fit in a pull request description.
          </p>

          <p>
            If you're hiring, the CV below is the fast path. Otherwise —
            thanks for reading, and the RSS feed is there if you want to keep
            up without checking back.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 not-prose">
        <a
          href="/cv"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-paper no-underline transition-opacity hover:opacity-90"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          CV
        </a>
        <a
          href={`mailto:${cv.contact.email}`}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink no-underline transition-colors hover:bg-border"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Email
        </a>
        <a
          href={cv.contact.linkedin}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink no-underline transition-colors hover:bg-border"
        >
          <Linkedin className="h-4 w-4" aria-hidden="true" />
          LinkedIn
        </a>
        <a
          href={cv.contact.github}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink no-underline transition-colors hover:bg-border"
        >
          <Github className="h-4 w-4" aria-hidden="true" />
          GitHub
        </a>
        <a
          href="/rss.xml"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink no-underline transition-colors hover:bg-border"
        >
          <Rss className="h-4 w-4" aria-hidden="true" />
          RSS
        </a>
      </div>

      <section className="mt-16">
        <p className="text-sm font-semibold tracking-widest text-accent uppercase">
          Projects
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {cv.projects.map((project) => (
            <div
              key={project.name}
              className="rounded-lg border border-border p-4"
            >
              <h3 className="font-semibold text-ink">{project.name}</h3>
              <p className="mt-1 text-sm text-ink-muted">
                {project.highlights[0]}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.tech.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-border px-2 py-0.5 text-xs text-ink-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
