import { createFileRoute } from '@tanstack/react-router'
import { buildPageHead } from '../lib/seo/page-head.ts'
import { cv } from '../content/cv.ts'
import type { CvExperience, CvProject } from '../content/cv.ts'
import { DownloadCvPdfButton } from '../components/download-cv-pdf-button.tsx'

export const Route = createFileRoute('/cv')({
  head: () =>
    buildPageHead({
      title: `${cv.name} — CV — barox.dev`,
      description: cv.summary,
      path: '/cv',
    }),
  component: Cv,
})

function DateRange({ start, end }: { start: string; end: string }) {
  return (
    <p className="text-sm whitespace-nowrap text-ink-muted">
      {start} – {end}
    </p>
  )
}

function TechTags({ tech }: { tech: string[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {tech.map((item) => (
        <li
          key={item}
          className="rounded-full border border-border px-2 py-0.5 text-sm text-ink-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

function ExperienceEntry({ entry }: { entry: CvExperience }) {
  return (
    <li className="border-b border-border pb-10 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-lg font-semibold text-ink">{entry.role}</h3>
        <DateRange start={entry.start} end={entry.end} />
      </div>
      <p className="mt-1 text-ink-muted">
        {entry.companyUrl ? (
          <a
            href={entry.companyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-accent"
          >
            {entry.company}
          </a>
        ) : (
          entry.company
        )}
        {' — '}
        {entry.location}
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-ink">
        {entry.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
      <TechTags tech={entry.tech} />
    </li>
  )
}

function ProjectEntry({ project }: { project: CvProject }) {
  return (
    <li className="border-b border-border pb-10 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-lg font-semibold text-ink">{project.name}</h3>
        <DateRange start={project.start} end={project.end} />
      </div>
      <p className="mt-1 text-ink-muted">
        {project.role}
        {project.teamSize ? ` — Team: ${project.teamSize}` : ''}
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-ink">
        {project.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
      <TechTags tech={project.tech} />
    </li>
  )
}

function Cv() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">{cv.name}</h1>
          <p className="mt-1 text-lg text-ink-muted">{cv.title}</p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <li>
              <a href={`mailto:${cv.contact.email}`} className="text-accent">
                {cv.contact.email}
              </a>
            </li>
            <li>
              <a href={`tel:${cv.contact.phone}`} className="text-accent">
                {cv.contact.phone}
              </a>
            </li>
            <li>
              <a
                href={cv.contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-accent"
              >
                LinkedIn
              </a>
            </li>
            <li>
              <a
                href={cv.contact.github}
                target="_blank"
                rel="noreferrer"
                className="text-accent"
              >
                GitHub
              </a>
            </li>
          </ul>
        </div>
        <DownloadCvPdfButton cv={cv} />
      </header>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink">Summary</h2>
        <p className="mt-4 text-ink-muted">{cv.summary}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink">Experience</h2>
        <ul className="mt-6 space-y-10">
          {cv.experience.map((entry) => (
            <ExperienceEntry key={`${entry.company}-${entry.start}`} entry={entry} />
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink">Projects</h2>
        <ul className="mt-6 space-y-10">
          {cv.projects.map((project) => (
            <ProjectEntry key={project.name} project={project} />
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink">Skills</h2>
        <dl className="mt-6 space-y-4">
          {Object.entries(cv.skills).map(([category, items]) => (
            <div key={category} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="w-48 shrink-0 font-semibold text-ink">{category}</dt>
              <dd className="text-ink-muted">{items.join(', ')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink">Education</h2>
        <ul className="mt-6 space-y-4">
          {cv.education.map((entry) => (
            <li key={entry.degree}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-lg font-semibold text-ink">{entry.degree}</h3>
                <p className="text-sm whitespace-nowrap text-ink-muted">{entry.end}</p>
              </div>
              <p className="mt-1 text-ink-muted">{entry.school}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
