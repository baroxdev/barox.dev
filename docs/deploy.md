# Deploying barox.dev to Cloudflare

The app builds to a Cloudflare Worker (`@cloudflare/vite-plugin` + `wrangler.jsonc`, Worker name `barox-dev`). Building and a dry-run deploy are verified in CI-less local testing (`pnpm build`, `wrangler deploy --dry-run`), but the steps below touch the live Cloudflare account and the `barox.dev` domain, so they need to be done by the account owner — an agent without account credentials can't complete them.

## 1. Authenticate wrangler (one-time, for manual/local deploys)

```bash
npx wrangler login
```

Or, for CI/non-interactive use, create an API token (Workers Scripts: Edit) in the Cloudflare dashboard and export it as `CLOUDFLARE_API_TOKEN` (plus `CLOUDFLARE_ACCOUNT_ID`).

## 2. First manual deploy

```bash
pnpm build
npx wrangler deploy
```

This publishes the Worker as `barox-dev` on your `*.workers.dev` subdomain so you can sanity-check it before wiring up the custom domain.

## 3. Connect the `barox.dev` domain

In the Cloudflare dashboard: **Workers & Pages → barox-dev → Settings → Domains & Routes → Add → Custom Domain**, enter `barox.dev`. Since the domain is already on Cloudflare's nameservers, the DNS record and TLS cert provision automatically — no manual DNS edits needed.

## 4. Enable auto-deploy on push to `main`

`.github/workflows/deploy.yml` already builds and runs `wrangler deploy` on every push to `main` — this keeps the deploy pipeline versioned and reviewable in the repo rather than living only as unversioned dashboard config. It just needs two repo secrets, which only you (as the account owner) can add:

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

Use the API token from step 1 (Workers Scripts: Edit scope) and the account ID shown on the Cloudflare dashboard's right sidebar. Once both secrets are set, the next push to `main` triggers the workflow automatically.

(Cloudflare's dashboard-native **Workers Builds** git integration is an alternative if you'd rather not use GitHub Actions — **Workers & Pages → barox-dev → Settings → Build → Connect to Git** — but it isn't used here since its build config lives outside the repo, unversioned.)

## 5. Canary environment (`canary.barox.dev`)

For trying out in-progress work before it hits production, `wrangler.jsonc` defines a second Worker via `env.canary` (name `barox-dev-canary`), routed to `canary.barox.dev` with `custom_domain: true`. Unlike the production domain in step 3, this one **doesn't need a manual dashboard click** — Cloudflare provisions a `custom_domain: true` route automatically the first time you deploy that environment, as long as the `barox.dev` zone is already on the account (it is) and `canary.barox.dev` has no conflicting DNS record (it shouldn't, being unused so far):

```bash
pnpm run deploy:canary
```

`.github/workflows/deploy-canary.yml` runs this same deploy automatically on every push to the `canary` branch, reusing the `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` secrets from step 4 — no extra secrets to add. `canary` is currently the active integration branch (see `docs/agents/branching.md`): ticket work branches from and merges into `canary`, so every merge shows up live at `canary.barox.dev` before the owner promotes `canary` into `main`.

## 6. Enable Cloudflare Web Analytics

**Analytics & Logs → Web Analytics** in the dashboard → add `barox.dev` as a site → it auto-injects the cookie-less beacon for Workers-served sites (or copy the provided snippet into `src/routes/__root.tsx` if it isn't auto-injected). Confirm pageviews start appearing after visiting the live site.

## Verifying acceptance criteria

- [ ] `wrangler deploy` succeeds and `*.workers.dev` URL loads
- [ ] `barox.dev` resolves to the Worker over HTTPS
- [ ] A push to `main` triggers the `Deploy` GitHub Actions workflow and it succeeds
- [ ] A push to `canary` triggers the `Deploy Canary` workflow and `canary.barox.dev` resolves over HTTPS
- [ ] Web Analytics dashboard shows a pageview after visiting the site
