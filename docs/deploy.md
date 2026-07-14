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

Use Cloudflare **Workers Builds** (native git integration — no GitHub Actions/secrets needed):

**Workers & Pages → barox-dev → Settings → Build → Connect to Git**, select the `baroxdev/barox.dev` repo, branch `main`, build command `pnpm build`, deploy command `npx wrangler deploy`. Every push to `main` will then trigger an automatic build + deploy.

## 5. Enable Cloudflare Web Analytics

**Analytics & Logs → Web Analytics** in the dashboard → add `barox.dev` as a site → it auto-injects the cookie-less beacon for Workers-served sites (or copy the provided snippet into `src/routes/__root.tsx` if it isn't auto-injected). Confirm pageviews start appearing after visiting the live site.

## Verifying acceptance criteria

- [ ] `wrangler deploy` succeeds and `*.workers.dev` URL loads
- [ ] `barox.dev` resolves to the Worker over HTTPS
- [ ] A push to `main` triggers a build in the Cloudflare dashboard without manual intervention
- [ ] Web Analytics dashboard shows a pageview after visiting the site
