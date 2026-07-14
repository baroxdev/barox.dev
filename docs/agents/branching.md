# Branching

Until the site owner says otherwise, **`main` is kept clean and only receives
merges when the owner explicitly promotes `canary` into it.** `canary` is the
active integration branch — it's where ticket work lands, and it auto-deploys
to `canary.barox.dev` on every push (see `docs/deploy.md`).

## What this means for ticket work

- **Branch from `canary`, not `main`.** Before starting a new ticket:
  ```
  git fetch origin
  git checkout -b <branch-name> origin/canary
  ```
  A tool that creates worktrees/branches from the repo's default branch
  (currently `main` on GitHub) will get this wrong — check out `canary`
  explicitly instead of relying on the default.
- **Open PRs with base `canary`**, not `main`:
  ```
  gh pr create --base canary --draft ...
  ```
- Do not merge a PR into `main`, and do not push directly to `main`, unless
  the site owner explicitly asks for it. Merging `canary` into `main` is a
  deliberate promotion step the owner performs on their own schedule.
- CI (`.github/workflows/ci.yml`) and the canary deploy workflow
  (`.github/workflows/deploy-canary.yml`) both run on every push to
  `canary`, so `canary.barox.dev` always reflects lint/typecheck/test-passing
  work — never a merge that's known to be broken.

## Why

Keeping `main` production-clean while `canary` absorbs in-progress ticket
work lets the owner preview and review accumulated changes at
`canary.barox.dev` before deciding what actually ships to production,
without every individual ticket PR needing to be production-ready the
moment it merges.

This rule is a point-in-time process decision, not a permanent architecture
choice — revisit it if the site owner says the workflow has changed (e.g.
once the site reaches a stable v1 and short-lived feature branches merging
straight to `main` becomes the norm again).
