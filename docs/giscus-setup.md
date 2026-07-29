# Giscus comments setup

Post pages render a comments widget (`GiscusComments`, `src/components/giscus-comments.tsx`)
backed by [giscus](https://giscus.app), which stores comments as GitHub
Discussions on this repo. The component renders nothing until it's
configured — enabling Discussions and installing the giscus app touch the
live GitHub repo, so those steps need the repo owner, same category of
setup as the Cloudflare/R2 steps in `docs/deploy.md` and `docs/thumbnails.md`.

## 1. Enable GitHub Discussions

**Repo → Settings → General → Features → Discussions** (check the box).
The repo is already public, which giscus requires.

## 2. Create a "Comments" discussion category

**Discussions tab → New category** (or use an existing one). A category
with the **Announcements** format works well for this — only maintainers
(you) can start a new discussion thread, but anyone can reply, which
matches the "one discussion per post" mapping below and stops random new
threads from being created outside the giscus widget.

Name it `Comments` to match `GISCUS_CONFIG.category` in
`src/lib/giscus/giscus-config.ts` (or update that constant to whatever
name you pick).

## 3. Install the giscus app

Install the [giscus GitHub App](https://github.com/apps/giscus) on
`baroxdev/barox.dev`. This is what lets the widget create/read discussions
on your behalf without needing visitors to grant it write access to
anything else.

## 4. Get the repo ID and category ID

Visit [giscus.app](https://giscus.app), fill in the configuration form:

- **Repository**: `baroxdev/barox.dev`
- **Page ↔ Discussions Mapping**: "Discussion title contains page `pathname`"
- **Discussion Category**: the `Comments` category from step 2

Once the repo is detected (confirming steps 1–3 worked), the generated
`<script>` snippet at the bottom of the page contains `data-repo-id` and
`data-category-id` — copy both.

## 5. Fill in the config

Edit `src/lib/giscus/giscus-config.ts`:

```ts
export const GISCUS_CONFIG = {
  repo: 'baroxdev/barox.dev',
  repoId: 'R_...', // from giscus.app
  category: 'Comments',
  categoryId: 'DIC_...', // from giscus.app
  mapping: 'pathname',
} as const
```

These IDs aren't secrets — they're already embedded in the public script
tag giscus.app generates for you, and in the widget's own HTML on every
page that loads it — so they're committed as plain constants, not env vars.

## Theme

The widget uses a custom theme (`public/giscus/light.css` and `dark.css`)
rather than one of giscus's built-in presets, so it matches barox.dev's own
paper/ink/accent palette instead of looking like a generic GitHub-styled
embed. `GiscusComments` points `data-theme` at the absolute URL of whichever
file matches the current site theme, and re-points it live via `postMessage`
when the reader toggles light/dark.

Because the widget lives in a cross-origin iframe, it can't read our page's
CSS custom properties directly — the theme files duplicate the real hex
values from `src/tokens/colors.css` as literal colors. **If the site's
palette ever changes, update these two files too** (same caveat as the
auto-generated OG image template in `scripts/lib/generate-og-image.ts`).

## Verifying setup

- [ ] GitHub Discussions is enabled on `baroxdev/barox.dev`
- [ ] A `Comments` discussion category exists
- [ ] The giscus app is installed on the repo
- [ ] `repoId`/`categoryId` are filled in in `giscus-config.ts` (not empty strings)
- [ ] Visiting a post page shows the giscus widget below the article body
- [ ] Commenting (as a GitHub-authenticated user) creates a discussion thread scoped to that post's pathname
- [ ] Toggling light/dark mode updates the widget's theme without a page reload
- [ ] The widget's colors visually match the rest of the site (paper background, ink text, navy accent), not GitHub's default light/dark theme
