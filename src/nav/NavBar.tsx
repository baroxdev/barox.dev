import { Link } from '@tanstack/react-router'
import { ThemeToggle } from '../theme/ThemeToggle.tsx'

const NAV_LINKS = [
  { to: '/journal', label: 'Journal' },
  { to: '/about', label: 'About' },
  { to: '/cv', label: 'CV' },
] as const

export function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="link-hand-underline font-semibold text-accent"
        >
          barox.dev
        </Link>

        <div className="flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-ink hover:text-accent"
              activeProps={{ className: 'text-accent' }}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
