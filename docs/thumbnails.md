# Post thumbnails: R2 setup

Optional post thumbnails are stored in Cloudflare R2 and served from a
custom domain. The sync script (`pnpm run sync-thumbnails`) uploads and
rewrites frontmatter — but creating the bucket, its public domain, and API
credentials touches the live Cloudflare account, so those steps need the
account owner, same as the Worker deploy setup in `docs/deploy.md`.

## 1. Create the R2 bucket

```bash
npx wrangler r2 bucket create barox-dev-thumbnails
```

## 2. Map a public custom domain to the bucket

**Dashboard → R2 → barox-dev-thumbnails → Settings → Custom Domains → Connect Domain**,
enter `media.barox.dev`. Since `barox.dev` is already on Cloudflare's
nameservers, the DNS record and TLS cert provision automatically.

## 3. Credentials

The sync script shells out to the `wrangler` CLI, so it reuses the same
`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` already set up for deploys
(`docs/deploy.md`) — no new credential type. Confirm that API token's scope
includes R2 read/write (**Account → R2 → Edit**); the Workers-Scripts-only
token from the deploy doc may need this permission added.

## 4. Configure the bucket name and public URL

Locally (`.env` or shell) and as repo secrets/variables for CI:

```bash
R2_BUCKET_NAME=barox-dev-thumbnails
R2_PUBLIC_BASE_URL=https://media.barox.dev
```

```bash
gh variable set R2_BUCKET_NAME --body barox-dev-thumbnails
gh variable set R2_PUBLIC_BASE_URL --body https://media.barox.dev
```

CI only needs these two for a real (non-`--check`) sync run — the `pnpm run
sync-thumbnails:check` step wired into `ci.yml` never touches R2 or these
variables; it only reports posts whose `thumbnail:` frontmatter is still an
unsynced local path.

## Usage

### Manual thumbnail

Author drops an image next to the post (e.g.
`content/journal/my-post-thumbnail.png`) and sets
`thumbnail: ./my-post-thumbnail.png` in frontmatter, then runs:

```bash
pnpm run sync-thumbnails
```

Every thumbnail — manual or auto-generated (below) — is resized to a max
width of 1200px and re-encoded as WebP (quality 80) before upload, so a
multi-megabyte source photo doesn't end up served to visitors as-is. The
resulting object is content-hash keyed (hashing the _original_ source
bytes, before optimizing) — re-running with no new or changed images
re-encodes and uploads nothing. The script rewrites that post's
`thumbnail:` line in place to the final `https://media.barox.dev/...` URL.
Commit the rewritten `.mdx` file (and the resized source image, if new) as
usual.

### Auto-generated thumbnail (no manual image)

A published post with **no** `thumbnail:` field at all gets one generated
automatically — a card with the title, tags, and an author attribution
row — instead of requiring a manual upload. This needs a real author photo
checked in at **`public/images/avatar.png`** (no fallback if it's missing —
generation will fail loudly).

Once generated and synced, a thumbnail is frozen: editing the post's title
afterward does **not** regenerate it. Delete the `thumbnail:` line and
re-run `pnpm run sync-thumbnails` to force a fresh render.

## Verifying setup

- [ ] `wrangler r2 bucket create barox-dev-thumbnails` succeeded
- [ ] `media.barox.dev` is connected as a custom domain on the bucket and resolves over HTTPS
- [ ] `R2_BUCKET_NAME` / `R2_PUBLIC_BASE_URL` are set locally and as CI variables
- [ ] `public/images/avatar.png` exists (required for auto-generated thumbnails)
- [ ] `pnpm run sync-thumbnails` on a post with a local-path thumbnail uploads a resized WebP and rewrites the frontmatter to a working `media.barox.dev` URL
- [ ] `pnpm run sync-thumbnails` on a post with no `thumbnail:` field generates and uploads a card
- [ ] Re-running `pnpm run sync-thumbnails` immediately after uploads nothing and edits nothing
