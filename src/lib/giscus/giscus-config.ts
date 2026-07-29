/**
 * Giscus (GitHub-Discussions-backed comments, issue #15) configuration.
 *
 * repoId/categoryId come from https://giscus.app once GitHub Discussions is
 * enabled, the "Comments" category exists, and the giscus app is installed
 * on this repo — see docs/giscus-setup.md for the full walkthrough.
 * GiscusComments renders nothing if either is ever cleared back to "".
 */
export const GISCUS_CONFIG = {
  repo: 'baroxdev/barox.dev',
  repoId: 'R_kgDOTXTuKA',
  category: 'Comments',
  categoryId: 'DIC_kwDOTXTuKM4DCNns',
  mapping: 'pathname',
} as const
