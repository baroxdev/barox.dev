/**
 * Giscus (GitHub-Discussions-backed comments, issue #15) configuration.
 *
 * repoId/categoryId can't be filled in until the repo owner enables GitHub
 * Discussions and installs the giscus app — both are account-owner actions
 * on the live GitHub repo, the same category of setup as the Cloudflare/R2
 * steps in docs/deploy.md and docs/thumbnails.md. See docs/giscus-setup.md
 * for the exact steps; GiscusComments renders nothing until these are set.
 */
export const GISCUS_CONFIG = {
  repo: 'baroxdev/barox.dev',
  repoId: '',
  category: 'Comments',
  categoryId: '',
  mapping: 'pathname',
} as const
