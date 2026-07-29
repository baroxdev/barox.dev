# Research: hand-drawn/sketchy annotation techniques (for `.mark-circle`)

Status: research only. No source files were changed as part of this write-up.

## Why this doc exists

The About page uses `.mark-circle` (`src/styles.css`, and see the "Visual personality"
implementation-decision in issue #1, which budgets 2-3 total "deliberately imperfect but
organized" typographic details site-wide) to sketchnote-circle a keyword, e.g.:

```html
<span className="mark-circle">actually useful</span>
```

(`src/routes/about.tsx` on the `claude/about-page` branch — the current worktree's `main`
doesn't yet have this branch merged; `src/styles.css` there is still the pre-personality
version. All `mark-circle`/`link-hand-underline` line references below are to
`origin/claude/about-page`.)

Current implementation:

```css
.mark-circle {
  --circle-mark: url("data:image/svg+xml,...single wobbly closed path, viewBox 0 0 220 100...");
  position: relative;
  padding: 0 0.15em;
}
.mark-circle::before {
  content: '';
  position: absolute;
  inset: -0.55em -0.5em;
  background-color: var(--color-accent);
  mask-image: var(--circle-mark);
  mask-repeat: no-repeat;
  mask-size: 100% 100%;   /* <-- non-uniform stretch to whatever the word measures */
  pointer-events: none;
}
```

The site owner's verdict: "the hand drawn still bad" — messy, crosses through letters
awkwardly, doesn't read as intentional.

This doc investigates how the primary reference implementations for this exact effect
(RoughNotation, rough.js) actually do it, why the current approach can't match that, and
what's realistic for this site's stack (React 19 + Tailwind v4 + TanStack Start, SSR'd,
explicit "no heavy client JS unless there's a genuine need" principle from issue #1).

## 1. Primary sources read

Both repos were cloned locally and read directly (not summarized from memory or a blog post):

- `rough-stuff/rough-notation` — cloned at the tip of `master`, `package.json` version
  `0.5.1`. Files read in full: `src/rough-notation.ts`, `src/render.ts`, `src/model.ts`.
- `rough-stuff/rough` (roughjs) — cloned at the tip of `master`, `package.json` version
  `4.6.6`. Files read: `src/renderer.ts`, `src/generator.ts`, `src/math.ts` (relevant
  excerpts below).
- Both projects' own `README.md` (first-party, same repo) for size claims and design intent.
- Actual npm-published packages (`rough-notation@0.5.1`, `roughjs@4.6.6`) installed into a
  scratch directory and their **built** `lib`/`bundled` output measured directly with
  `wc -c` / `gzip -c | wc -c` — not a guess, not bundlephobia (which 403'd through the
  proxy).

### 1.1 RoughNotation: how it draws a circle around real, wrapped text

**It measures the actual rendered bounding box of the element at runtime**, not a
fixed/guessed shape. From `src/rough-notation.ts`:

```ts
// lines 227–240
private rects(): Rect[] {
  const ret: Rect[] = [];
  if (this._svg) {
    if (this._config.multiline) {
      const elementRects = this._e.getClientRects();
      for (let i = 0; i < elementRects.length; i++) {
        ret.push(this.svgRect(this._svg, elementRects[i]));
      }
    } else {
      ret.push(this.svgRect(this._svg, this._e.getBoundingClientRect()));
    }
  }
  return ret;
}
```

`getBoundingClientRect()` (or `getClientRects()` per-line for multiline text) is the
literal, rendered box of the annotated `<span>`/element — font, weight, kerning, and
whatever text actually wrapped to are all accounted for, because the browser already laid
it out. This is the single biggest structural difference from the current CSS-mask
approach, which has no idea how wide/tall the word actually rendered and just stretches a
fixed path to fill the padding box.

It also **re-measures on resize**: a `ResizeObserver` plus a `window resize` listener
(lines 60-72, 110-125) call `show()` again if the measured rect changed, so re-wrapped
text on a narrower viewport gets a freshly-fitted circle, not a stretched stale one.

**Per-instance random seed**, not a fixed path:

```ts
// line 13
private _seed = randomSeed(); // from roughjs/bin/math: Math.floor(Math.random() * 2**31)
```

Every `annotate(el, { type: 'circle' })` call gets its own seed, so two circles on the
same page with the same text never draw an identical wobble — this is the "randomize per
element" property the current single static SVG path structurally cannot have (one
`data:` URL, reused byte-for-byte at every call site).

**How the actual circle is drawn** — `src/render.ts`, the `'circle'` case (lines 169-184):

```ts
case 'circle': {
  const doubleO = getOptions('double', seed);
  const width = rect.w + (padding[1] + padding[3]);
  const height = rect.h + (padding[0] + padding[2]);
  const x = rect.x - padding[3] + (width / 2);
  const y = rect.y - padding[0] + (height / 2);
  const fullItr = Math.floor(iterations / 2);
  const singleItr = iterations - (fullItr * 2);
  for (let i = 0; i < fullItr; i++) {
    opList.push(ellipse(x, y, width, height, doubleO));
  }
  for (let i = 0; i < singleItr; i++) {
    opList.push(ellipse(x, y, width, height, o));
  }
  break;
}
```

`iterations` defaults to `2` (line 63: `config.iterations || 2`). With `type: 'double'`
options, `disableMultiStroke` is `false` (line 26: `disableMultiStroke: type !== 'double'`),
so a single `ellipse(...)` call here *itself* draws two overlapping elliptical passes (see
1.2) — meaning the default circle annotation is really drawn as **two overlapping,
independently-perturbed elliptical strokes**, not one static path. `getOptions` (lines
8-30) sets `roughness: 1.5`, `bowing: 1`, `maxRandomnessOffset: 2` for circle/underline/box,
vs. `roughness: 3` for the `highlight` marker type — i.e. RoughNotation tunes how "sketchy"
each annotation type looks, it isn't one fixed wobble amplitude for everything.

Finally, the SVG element itself is only created/positioned once real layout exists
(`attach()`, lines 74-101) — it's inserted `afterend`/`beforebegin` as a sibling of the
annotated element and absolutely positioned to overlay it; nothing is drawn until
`show()` is called against a real, laid-out DOM node.

### 1.2 rough.js: the actual sketchy-perturbation math

Two mechanisms combine: **randomized control points on each curve**, and **multiple
overlapping passes with different offsets** ("multiStroke").

**Ellipse generation** — `src/renderer.ts`:

```ts
// lines 97-107 — the ellipse's own radii get a small random jitter first
export function generateEllipseParams(width, height, o) {
  const psq = Math.sqrt(Math.PI * 2 * Math.sqrt((Math.pow(width/2,2) + Math.pow(height/2,2))/2));
  const stepCount = Math.ceil(Math.max(o.curveStepCount, (o.curveStepCount/Math.sqrt(200))*psq));
  const increment = (Math.PI * 2) / stepCount;
  let rx = Math.abs(width / 2);
  let ry = Math.abs(height / 2);
  const curveFitRandomness = 1 - o.curveFitting; // default curveFitting 0.95 -> 0.05 jitter
  rx += _offsetOpt(rx * curveFitRandomness, o);
  ry += _offsetOpt(ry * curveFitRandomness, o);
  return { increment, rx, ry };
}

// lines 109-121 — the two-pass "multiStroke" ellipse
export function ellipseWithParams(x, y, o, ellipseParams) {
  const [ap1, cp1] = _computeEllipsePoints(ellipseParams.increment, x, y,
    ellipseParams.rx, ellipseParams.ry, 1,
    ellipseParams.increment * _offset(0.1, _offset(0.4, 1, o), o), o);
  let o1 = _curve(ap1, null, o);
  if ((!o.disableMultiStroke) && (o.roughness !== 0)) {
    const [ap2] = _computeEllipsePoints(ellipseParams.increment, x, y,
      ellipseParams.rx, ellipseParams.ry, 1.5, 0, o);
    const o2 = _curve(ap2, null, o);
    o1 = o1.concat(o2);
  }
  return { estimatedPoints: cp1, opset: { type: 'path', ops: o1 } };
}
```

Each of the `stepCount` points around the ellipse is placed via `_computeEllipsePoints`,
which perturbs the ideal `cx + rx*cos(angle)` position by a random offset every call (see
below) — so the ellipse outline is a closed Bezier-ish curve through *slightly wrong*
points, not a perfect ellipse with a wobbly stroke applied on top. The second pass
(`ap2`) reuses the same center/radii but a different point-density multiplier (`1.5`) and
its own fresh random offsets, which is what produces the classic "drawn twice, slightly
out of registration" sketch look.

**The perturbation itself** — `src/math.ts` (the actual PRNG) and `src/renderer.ts`:

```ts
// math.ts — seeded linear-congruential generator (deterministic given a seed,
// falls back to Math.random() if seed is 0/undefined)
export class Random {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    if (this.seed) {
      return ((2 ** 31 - 1) & (this.seed = Math.imul(48271, this.seed))) / 2 ** 31;
    }
    return Math.random();
  }
}

// renderer.ts
function random(ops) {
  if (!ops.randomizer) { ops.randomizer = new Random(ops.seed || 0); }
  return ops.randomizer.next();
}
function _offset(min, max, ops, roughnessGain = 1) {
  return ops.roughness * roughnessGain * ((random(ops) * (max - min)) + min);
}
function _offsetOpt(x, ops, roughnessGain = 1) {
  return _offset(-x, x, ops, roughnessGain);
}
```

Every coordinate that gets drawn (curve endpoints, ellipse sample points, arc points) is
passed through `_offsetOpt`, which scales a random value by `options.roughness` — that's
the actual "roughness" knob: it's a multiplier on per-point jitter magnitude, not a visual
filter applied after the fact.

**Bowing** (curve control-point sag) — `src/renderer.ts`, inside `_curve`:

```ts
let midDispX = o.bowing * o.maxRandomnessOffset * (y2 - y1) / 200;
let midDispY = o.bowing * o.maxRandomnessOffset * (x1 - x2) / 200;
midDispX = _offsetOpt(midDispX, o, roughnessGain);
midDispY = _offsetOpt(midDispY, o, roughnessGain);
```

`bowing` controls how much a straight segment's midpoint is displaced perpendicular to
the segment before randomization is applied — this is what makes a rough.js line/curve
look like it sags/bulges like a hand-drawn stroke rather than just being a jittered
straight line.

**Multi-pass ("multiStroke") for general curves** — `src/generator.ts`:

```ts
// curve(): two overlapping passes at different, roughness-scaled offsets
const o1 = _curveWithOffset(pointsList[0], 1 * (1 + o.roughness * 0.2), o);
const o2 = o.disableMultiStroke
  ? []
  : _curveWithOffset(pointsList[0], 1.5 * (1 + o.roughness * 0.22), cloneOptionsAlterSeed(o));
```

`cloneOptionsAlterSeed` (also in `generator.ts`, `seed: ops.seed ? ops.seed + 1 : ops.seed`)
deliberately advances the seed for the second pass so the two overlapping strokes are
correlated (same overall shape) but not identical — again, the "drawn twice, not quite
lined up" look.

**Net effect, in one sentence, backed by the code above**: rough.js does not distort one
fixed path — it samples a fresh set of points from the target geometry (fitted to the
*actual* size requested) through a seeded PRNG every time it's asked to draw, at up to two
overlapping passes with independently perturbed points, with jitter magnitude tied to a
`roughness`/`bowing` config rather than baked into a single asset.

### 1.3 First-party design-rationale / size statements

- `rough-notation/README.md` (same repo, first-party): *"Rough Notation uses RoughJS...
  Rough Notation is 3.83kb in size when gzipped."*
- `rough/README.md` (same repo, first-party): *"Rough.js is a small (<9 kB) graphics
  library that lets you draw in a sketchy, hand-drawn-like, style... supports drawing SVG
  paths... works with both Canvas and SVG."*
- Measured directly (not from the READMEs) by installing the published packages and
  measuring the actual built output shipped to consumers:

  | Package | File | Raw bytes | Gzip bytes |
  |---|---|---|---|
  | `rough-notation@0.5.1` | `lib/rough-notation.esm.js` | 10,691 | 3,973 |
  | `roughjs@4.6.6` (full, canvas+SVG) | `bundled/rough.esm.js` | 27,748 | 8,930 |

  Note `rough-notation`'s own `package.json` lists `roughjs` only as a **devDependency**
  — its Rollup build (`rollup.config.js`, tree-shaking `roughjs/bin/{core,renderer,math,geometry}`
  per the `import` list at the top of `src/render.ts`) inlines only the pieces it actually
  calls (`line`, `rectangle`, `ellipse`, `linearPath` — no canvas backend, no fill-pattern
  code). So the real cost of "RoughNotation on this site" is **~3.9 KB gzipped, once**,
  not RoughNotation-plus-all-of-roughjs (~8.9 KB) stacked on top.

## 2. Why the current fixed-path CSS mask reads as "bad"

Side-by-side against what section 1 actually showed:

| Property | RoughNotation / rough.js | Current `.mark-circle` |
|---|---|---|
| Shape source | Ellipse fitted to the **measured** `getBoundingClientRect()` of the real, wrapped text, re-measured on resize | One SVG `<path>` authored once in a `viewBox="0 0 220 100"` box, with no knowledge of any specific word's dimensions |
| Fit to text | Aspect ratio preserved — width/height passed into `ellipse(x, y, width, height, o)` independently, but the underlying point geometry is still an ellipse *of that box*, not a distorted unrelated shape | `mask-size: 100% 100%` **non-uniformly stretches** a 220×100 path to whatever box the padding produces — a 3-letter word and an 8-letter word get the same path warped by wildly different X/Y factors, so the curve's proportions (and where its "gaps"/loop cross the baseline) shift unpredictably per instance |
| Passes/strokes | 2 overlapping, independently-perturbed elliptical curves per circle (default `iterations: 2`, `disableMultiStroke: false`) | 1 static stroke, silhouette-masked — no overlap, no layered strokes |
| Per-instance randomization | Fresh `randomSeed()` per `annotate()` call (`rough-notation.ts:13`); every instance's wobble differs | Same literal path reused byte-for-byte at every call site — visually identical shape merely rescaled |
| Adapts to actual rendered text | Yes — bounding box comes from the live DOM node post-layout, post-font-load | No — CSS has no way to introspect "how many pixels wide did this word render," only the box the padding produced, which the mask is then blindly stretched into |
| Where letters get crossed | Ellipse math keeps the loop roughly following the padding-box perimeter regardless of aspect ratio, because it's generated *for that box*, not reused from a different box | The hand-picked path's "closing gap" and pinch points were drawn for one specific 220:100 aspect ratio; stretched to (e.g.) a 5:1 or 1.5:1 box, the same pinch points land in different relative places — sometimes mid-letter — with no way to predict or correct it per word |

The core diagnosis: **non-uniform stretch of a single fixed asset is not the same
operation as generating geometry for the target box.** An SVG ellipse's curvature is
defined relative to its own rx/ry; stretching a *pre-rendered, already-curved* path
non-uniformly changes the relationship between every control point and every other
control point in a way that has nothing to do with hand-drawn imperfection — it's the
same failure mode as stretching a circular logo into an oval by dragging one corner. The
"stretch reads as more hand-drawn, not less" comment in the current CSS (styles.css, in
the `.mark-circle` block comment) is the wrong intuition: real hand-drawn variation comes
from *where the pen wobbles along a path fitted to the actual shape*, not from distorting
someone else's already-fitted path.

## 3. Options for this site

All four evaluated against: React 19, Tailwind v4, TanStack Start with SSR on, and issue
#1's explicit "avoid heavy client JS/interactive infra unless there's genuine need"
principle (no live playground, Cloudflare Web Analytics only, no cookie banner, etc.).

### Option A — RoughNotation directly

```tsx
// src/components/MarkCircle.tsx
import { useEffect, useRef } from 'react';
import { annotate } from 'rough-notation';

export function MarkCircle({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const annotation = annotate(el, {
      type: 'circle',
      color: 'var(--color-accent)',
      strokeWidth: 2,
      padding: [4, 6],
      animate: false, // issue #1: no reading-progress/motion gimmicks either
    });
    annotation.show();
    return () => annotation.remove();
  }, []);

  return <span ref={ref}>{children}</span>;
}
```

- **Bundle cost**: ~3.9 KB gzipped, measured directly (section 1.3) — genuinely small,
  well under what a single web font subset or a hero image usually costs this site.
- **SSR/hydration**: RoughNotation is fundamentally DOM-measurement-driven
  (`getBoundingClientRect()`, `ResizeObserver`) — there is **no server-side story**. On
  first SSR paint the plain `<span>` renders with no circle at all; the circle appears
  only after client hydration runs the `useEffect`. That's a visible "pop-in" of a decor
  element on every page load, plus a `ResizeObserver`/`resize` listener kept alive per
  annotated span for the life of the component (cleaned up on unmount here, but still a
  live DOM observer per instance while mounted). For 2-3 sparingly-used marks on one About
  page this is a small footprint, but it is a real client-side dependency + runtime cost
  the current CSS-only approach has zero of.
- **Verdict**: technically the best-looking, truest-to-source option; the tradeoff is
  entirely "is a few KB of client JS + an SSR pop-in acceptable for a decorative flourish,"
  which is exactly the kind of infra-for-its-own-sake issue #1 says to avoid unless there's
  genuine need.

### Option B — rough.js directly, hand-rolled circle

```tsx
// src/components/MarkCircle.tsx
import { useLayoutEffect, useRef } from 'react';
import rough from 'roughjs';

export function MarkCircle({ children }: { children: React.ReactNode }) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const span = spanRef.current;
    const svg = svgRef.current;
    if (!span || !svg) return;
    const { width, height } = span.getBoundingClientRect();
    svg.innerHTML = '';
    const rc = rough.svg(svg);
    const node = rc.ellipse(width / 2, height / 2, width + 12, height + 10, {
      roughness: 1.5,
      bowing: 1,
      stroke: 'var(--color-accent)',
      strokeWidth: 2,
    });
    svg.appendChild(node);
  }, [children]);

  return (
    <span ref={spanRef} style={{ position: 'relative' }}>
      {children}
      <svg
        ref={svgRef}
        style={{ position: 'absolute', inset: '-8px -6px', pointerEvents: 'none', overflow: 'visible' }}
      />
    </span>
  );
}
```

- **Bundle cost**: worse than Option A for less benefit — full `roughjs` SVG entry alone
  is ~8.9 KB gzipped (section 1.3) measured directly, and this hand-rolled version still
  has to reimplement RoughNotation's resize-observation and multi-pass tuning to get the
  same quality; that logic is exactly what `render.ts`/`rough-notation.ts` already provide.
- **SSR/hydration**: same fundamental issue as Option A (needs a real, laid-out DOM node),
  slightly worse ergonomics (roll your own resize handling), for a heavier dependency.
- **Verdict**: only makes sense if more annotation types/more control were needed than
  RoughNotation's fixed `circle`/`underline`/`box`/etc. vocabulary — not the case here
  (issue #1 wants exactly one circle-mark style, used sparingly). Strictly dominated by
  Option A for this site's needs.

### Option C — improved pure-CSS/SVG, randomized per-instance, no JS measurement

The honest answer from section 1/2: **no**, a static-per-instance path — even if its
control points are seeded per word at build time — cannot fully match rough.js, because
rough.js's core trick is generating geometry *for the measured box*, and CSS/build-time
generation has no access to the actual rendered pixel width of a specific word in the
reader's actual font-rendering environment (font hinting, subpixel differences,
zoom level, user font-size overrides all change the real box; a build-time PRNG seeded by
the word string can't see any of that).

That said, a **meaningfully better** CSS-only version is achievable if the goal is
narrowed from "matches rough.js" to "stops visibly crossing letters and looks
intentional":

1. **Stop non-uniform stretching.** Use `mask-size: auto 100%` (or a fixed height in `em`
   units) instead of `100% 100%`, and instead let the mask **tile or clip** rather than
   stretch — e.g. author 3-4 fixed-aspect-ratio circle variants (wide/oval, narrow/oval,
   near-round) and pick the closest aspect ratio to the actual word length via a
   Tailwind/CSS class chosen by content length (`className={word.length > 8 ? 'mark-circle-wide' : 'mark-circle-narrow'}`)
   — a coarse but deterministic, no-JS approximation of "fit to the box."
2. **Layer two masks** (two `<path>`s baked into one `data:` SVG, slightly offset/rotated
   relative to each other) to approximate rough.js's overlapping-double-stroke look — this
   is cheap (still one CSS rule) and directly mimics the visual signature identified in
   section 1.2, without adding JS.
3. **Randomize per instance via `nth-of-type`/inline custom properties**, not a build-time
   PRNG — e.g. 3-4 hand-drawn path variants as CSS custom properties, cycled with
   `:nth-of-type(3n)` or set inline per usage (`style={{ '--circle-variant': n }}`), so at
   least repeated marks on the same page don't look identical (addresses part of the "no
   per-instance randomization" gap without any runtime measurement).

This is a real, shippable middle ground, but it is fundamentally curve-fitting a fixed
asset to a *discrete* set of buckets (short/medium/long word), not the continuous,
measured fit rough.js gets essentially for free from the DOM. It will look noticeably
better than the current single-stretched-path version, but a sufficiently long/short
outlier word will still land in the "not quite right" middle of a bucket sometimes.

### Option D — pre-drawn sprite sheet, pseudo-random pick

Multiple hand-drawn circle PNG/SVG variants (e.g. 6-8, done once by whoever authors the
site's other hand-drawn assets), picked per-instance via a deterministic hash of the
wrapped text (so it's stable across re-renders/SSR, e.g. `variant = hashString(children) % 8`)
and using the same "stop stretching non-uniformly, pick nearest aspect bucket" logic as
Option C.

- **Pros**: zero new runtime dependency, no client JS beyond a one-time string hash (can
  even be computed at MDX/build time and baked into a class name, so it's truly
  static/SSR-perfect with no pop-in at all), meaningfully more variety than one fixed path
  (breaks the "identical shape every time" problem specifically), and asset cost is
  small (SVGs, not the PNGs — a handful of ~1-2KB inline data URIs).
- **Cons**: still bucketed-aspect-ratio, still can't measure the actual rendered box, so
  the same "crosses through letters on the exact outlier width" failure mode as Option C
  remains possible, just statistically rarer with more variants to choose from. Also
  requires an artist pass (drawing 6-8 convincing variants) rather than "install a
  library" — more one-time authoring effort, less ongoing dependency risk.
- **Verdict**: the best *pure-CSS-philosophy* option if the site wants zero client JS for
  this — better variety than Option C for roughly the same architecture, at the cost of
  needing several hand-drawn assets instead of one.

## 4. Recommendation

Given this is a 2-3-times-total decorative flourish (issue #1's own budget), on a
low-traffic personal blog whose stated principle is avoiding client JS/interactive infra
without genuine need, and SSR is already load-bearing for the rest of the site (content
pipeline, dehydration/hydration story per issue #1):

**Recommend Option C/D (CSS-only fix), not RoughNotation, despite RoughNotation's small
~3.9 KB gzip footprint being genuinely cheap in isolation.** The disqualifying factor
isn't bundle size — it's that RoughNotation's entire value proposition depends on runtime
`getBoundingClientRect()` measurement, which structurally means an SSR pop-in (the mark
is invisible until client hydration runs an effect) on a site that has SSR working as a
deliberate architectural choice. That's a worse regression on "feels considered and
polished" (a literal issue #1 user story, #9) than the current messy-but-present circle.
Concretely: stop the `mask-size: 100% 100%` non-uniform stretch (the actual root cause,
section 2), author 2-3 fixed-aspect-ratio variants with two overlapping paths each
(mimicking rough.js's double-stroke look per section 1.2/Option C item 2), and pick a
variant per instance via a stable class/prop rather than reusing one path everywhere. That
directly fixes the two things diagnosed as "bad" (cross-letter stretch, visual
repetition) with no new dependency, no SSR/hydration caveat, and effort proportional to a
detail used only 2-3 times sitewide.
