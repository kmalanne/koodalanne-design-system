# koodalanne

**Independent Software Consultant · Boutique Software Engineering**

_The name is always written **koodalanne** — all lowercase, even the first letter._

> Modern engineering with neon soul.

<p align="center">
  <img src="design-system/mascot/bike-alt.svg" alt="koodalanne companion — a gravel bike drawn in neon strokes" width="180" height="180" />
</p>

<p align="center"><em>The Companion — one iconic gravel bike, always drawn the same, like a signature.</em></p>

This repository is the **koodalanne Brand Bible**, engineered like a software
design system rather than written as a static PDF. Design tokens are the single
source of truth; the website, proposals, slide decks, GitHub profile and every
other client touchpoint map back to the same values, so everything feels like one
world.

Design language: **Neon Precision** — _premium software consulting meets neon
nostalgia. If Apple designed Vice City._

---

## Structure

```
koodalanne/
├── README.md                          ← you are here (Brand Bible index)
├── brand/
│   ├── 01-identity.md                 ← mission, vision, values, voice, positioning
│   ├── 02-design-language.md          ← "Neon Precision" rules, color/type/motion, do's & don'ts
│   ├── 03-components.md               ← component specs, anatomy, states, usage rules
│   ├── 04-logo.md                     ← logo family, clear space, variants, favicon/OG wiring
│   ├── 05-motion.md                   ← motion principles, timing scale, interaction utilities
│   ├── 06-patterns.md                 ← background patterns, the recurring recipe, rules
│   ├── 07-engineering-doctrine.md     ← laws, invariants, smells, philosophy tests (reasoning layer)
│   └── 08-companion.md                ← the brand companion (the bike), variants & rules
└── design-system/
    ├── tokens/
    │   ├── tokens.css                 ← ★ SOURCE OF TRUTH (CSS custom properties)
    │   ├── tokens.json                ← Style Dictionary / Figma-compatible mirror
    │   └── tailwind.preset.js         ← Tailwind theme mapping
    ├── components/
    │   └── components.css              ← reusable UI components (kd-* classes, token-driven)
    ├── motion/
    │   └── motion.css                 ← hover/entrance/ambient motion utilities
    ├── patterns/
    │   └── patterns.css               ← grid, horizon, diagonal, scanline, ticks, washes
    ├── icons/
    │   ├── icons.svg                   ← stroke icon set (sprite of <symbol>s)
    │   └── icons.css                   ← .kd-icon helper
    ├── logo/
    │   └── *.svg                       ← pixel logo family (wordmark, monogram, icon, favicon, OG)
    ├── mascot/
    │   └── bike*.svg                   ← the companion (bike) — primary, ink, mono, tile + preview
    └── preview/
        └── index.html                 ← living style guide (open in a browser)
website/
├── index.html                         ← first production screen (landing page)
└── site.css                           ← page layout on top of the design system
website2/
├── index.html                         ← single-screen landing (one-viewport variant)
├── cv.html                            ← CV / experience page
├── cv.css                             ← CV page layout
└── site.css                           ← compact one-screen layout
assets/
├── proposal/index.html               ← proposal template (print-ready, light)
├── invoice/index.html                ← invoice / letterhead (print-ready, light)
├── slides/index.html                 ← scroll-snap slide deck (dark)
├── social/                           ← linkedin · x · github banners + social card (SVG)
├── wallpapers/                       ← desktop + mobile wallpapers (SVG)
├── vscode-theme/                     ← "Neon Precision" VS Code color theme (installable)
└── terminal/                         ← iTerm2 · Windows Terminal · Alacritty palettes
```

---

## The token model

Two layers, so brand values change in exactly one place:

1. **Primitives** (`--kd-*`) — raw brand values (e.g. `--kd-pink-300: #f890e7`).
   Never used directly in UI.
2. **Semantic** (`--color-*`, `--radius-*`, …) — meaning-based tokens that
   components consume (e.g. `--color-accent: var(--kd-pink-300)`).

Change a primitive → everything downstream updates. Swap `[data-theme="light"]`
for document/invoice contexts and the semantic layer re-points automatically.

---

## Using the tokens

### Plain CSS
```html
<link rel="stylesheet" href="design-system/tokens/tokens.css" />
```
```css
.cta { background: var(--color-accent); color: var(--color-text-on-accent); }
```

### Components
Load `tokens.css` first, then the component layer, and use the `kd-*` classes
(they work in plain HTML or as React `className`s):
```html
<link rel="stylesheet" href="design-system/tokens/tokens.css" />
<link rel="stylesheet" href="design-system/components/components.css" />

<button class="kd-btn kd-btn--primary">Start a project</button>
```
See [brand/03-components.md](brand/03-components.md) for the full catalogue.

### Motion & patterns
Add the motion and pattern layers for interactions and backgrounds (both
token-driven, both honour `prefers-reduced-motion` / "one per screen"):
```html
<link rel="stylesheet" href="design-system/motion/motion.css" />
<link rel="stylesheet" href="design-system/patterns/patterns.css" />

<section class="kd-grid-horizon kd-vignette">
  <article class="kd-card kd-lift">…</article>
</section>
```
Specs: [brand/05-motion.md](brand/05-motion.md) · [brand/06-patterns.md](brand/06-patterns.md).

### Tailwind
```js
// tailwind.config.js
module.exports = {
  presets: [require('./design-system/tokens/tailwind.preset.js')],
};
```
Ship `tokens.css` globally so the CSS-variable-backed utilities resolve
(`bg-bg`, `text-accent`, `shadow-glow-pink`, `bg-gradient-neon`, …).

### Fonts
- Display / logo: **Press Start 2P** (wordmark only)
- Everything else: **Space Grotesk**
- Code: **JetBrains Mono**

---

## Preview

Open [design-system/preview/index.html](design-system/preview/index.html) in a
browser to see the live palette, gradients, type scale, components, motion and
patterns. The first assembled product screen lives at
[website/index.html](website/index.html).

---

## Conformance — the Brand Linter

The brand isn't just documented, it's **enforceable**. `brandos` lints the pages
against the measurable invariants in the
[Engineering Doctrine](brand/07-engineering-doctrine.md) — one `<h1>`, headline
≤ 8 words, one primary CTA per view, no buzzwords, heading order, image alt text,
reduced-motion — and scores each page (AAA / AA / A / FAIL, threshold 90%).

```bash
npm run lint:brand                       # default page set
node tools/brandos/brandos.mjs website2/index.html   # any file(s)
```

Exits non-zero below AA, so it drops straight into CI.

---

## Roadmap (Brand Bible parts)

- [x] **Part 1 — Identity** · [brand/01-identity.md](brand/01-identity.md)
- [x] **Part 2 — Design Language** · [brand/02-design-language.md](brand/02-design-language.md)
- [x] **Part 3 — Color system** · tokens.css / tokens.json
- [x] **Part 4 — Typography** · tokens + preview
- [x] **Part 5 — Components** · [brand/03-components.md](brand/03-components.md) · [design-system/components/components.css](design-system/components/components.css) — buttons, badges, cards, nav, forms, tables, timeline, code
- [x] **Part 6 — Motion** · [brand/05-motion.md](brand/05-motion.md) · [design-system/motion/motion.css](design-system/motion/motion.css) — hover, entrance, ambient + reduced-motion
- [x] **Part 7 — Imagery (logo system)** · [brand/04-logo.md](brand/04-logo.md) · [design-system/logo/](design-system/logo/) — Press Start 2P wordmark, monogram, app icon, favicon, OG card
- [x] **Part 7 — Imagery (patterns)** · [brand/06-patterns.md](brand/06-patterns.md) · [design-system/patterns/patterns.css](design-system/patterns/patterns.css) — grid, horizon, diagonal, scanline, ticks, washes
- [x] **Part 7 — Imagery (icons)** · [design-system/icons/icons.svg](design-system/icons/icons.svg) — 21 stroke icons (sprite) + `.kd-icon` helper
- [x] **Part 8 — Assets** · [website](website/index.html) · [proposal](assets/proposal/index.html) · [invoice](assets/invoice/index.html) · [slides](assets/slides/index.html) · [social banners](assets/social/) · [wallpapers](assets/wallpapers/) · [VS Code theme](assets/vscode-theme/) · [terminal themes](assets/terminal/)
- [x] **Doctrine & conformance** · [brand/07-engineering-doctrine.md](brand/07-engineering-doctrine.md) · [tools/brandos/brandos.mjs](tools/brandos/brandos.mjs) — reasoning layer + enforceable linter (`npm run lint:brand`)
- [x] **Companion** · [brand/08-companion.md](brand/08-companion.md) · [design-system/mascot/](design-system/mascot/) — the bike: primary, light-surface, one-color & app-icon variants

Every asset maps back to the landing screen and the same tokens — website,
proposal, invoice, deck, social, wallpapers, editor and terminal all feel like
one world. The Brand Bible is complete; future work is content, not system.
