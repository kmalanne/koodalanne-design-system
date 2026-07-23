# koodalanne — Components

> Part 5 of the Brand Bible. The primitives from Parts 3–4 (color, type, space,
> motion) assembled into a reusable component library. Source of truth:
> [`design-system/components/components.css`](../design-system/components/components.css).
> Every class consumes **semantic tokens only** — change a token in `tokens.css`
> and every component updates. Classes are prefixed `kd-` and work in plain HTML
> or as React `className`s.

---

## Principles (inherited from "Neon Precision")

- **Restraint** — neon is seasoning. One glow, one accent per composition.
- **Sharp by default** — controls use `--radius-control` (6px), cards
  `--radius-card` (12px); pixel motifs stay at `0`.
- **Hairlines, not boxes** — 1px `--color-border` separates; 2px is the icon/CTA stroke.
- **Motion guides, never distracts** — lifts are ≤ 4px, transitions use
  `--kd-ease-out` and collapse to `0ms` under `prefers-reduced-motion`.
- **Accessibility** — every interactive element ships a visible focus ring
  (`--focus-ring`, cyan on midnight). Body text stays on `--color-text` (AA).

---

## Buttons — `.kd-btn`

| Variant | Class | Use |
| --- | --- | --- |
| Primary | `.kd-btn--primary` | The one action that matters on a screen. Pink fill, pink glow + 1px lift on hover. |
| Secondary | `.kd-btn--secondary` | Supporting action. Cyan-lined ghost, cyan glow on hover. |
| Quiet | `.kd-btn--quiet` | Tertiary / inline. Text only, pink on hover. |

Sizes: `.kd-btn--sm` · (default) · `.kd-btn--lg`. Icon-only: `.kd-btn--icon`
(square). States: `:hover`, `:focus-visible` (focus ring), `:disabled`
(`aria-disabled` honoured, 0.45 opacity).

**Rule:** never two primary buttons in the same view — that's two signals.

```html
<button class="kd-btn kd-btn--primary">Start a project</button>
<button class="kd-btn kd-btn--secondary">View work</button>
<button class="kd-btn kd-btn--quiet">Read more</button>
```

---

## Badges — `.kd-badge`

Mono, uppercase, hairline outline. Default is cyan. Variants: `--pink`,
`--solid` (pink fill), and signal states `--success` `--warning` `--danger`
`--info`. Add `.kd-badge__dot` for an "available" status pill.

```html
<span class="kd-badge"><span class="kd-badge__dot"></span>Available</span>
<span class="kd-badge kd-badge--pink">React</span>
```

---

## Cards — `.kd-card`

Surface + hairline border + card shadow. Structure: `.kd-card__title` /
`.kd-card__body`. Add `.kd-card--interactive` for clickable cards — 4px lift,
pink border + glow on hover (the only place glow reaches full strength).

```html
<article class="kd-card kd-card--interactive">
  <h3 class="kd-card__title">Architecture</h3>
  <p class="kd-card__body">From business goals to a system that scales.</p>
</article>
```

---

## Navigation — `.kd-nav`

Space-between bar with a hairline underline. `.kd-nav__brand` renders the
wordmark in Press Start 2P (**always lowercase** `koodalanne`).
`.kd-nav__link` draws a cyan hairline in on hover; mark the current page with
`aria-current="page"`.

---

## Forms — `.kd-field` / `.kd-input` / `.kd-textarea` / `.kd-select`

Vertical `.kd-field` (label · control · hint). Controls sit on `--color-bg`
with a strong hairline; focus swaps to a cyan border + focus ring. Error state:
add `--error` to the control and `.kd-field__hint--error` to the hint.

```html
<div class="kd-field">
  <label class="kd-label" for="email">Work email</label>
  <input id="email" class="kd-input" type="email" placeholder="you@company.com" />
  <span class="kd-field__hint">I reply within one business day.</span>
</div>
```

---

## Tables — `.kd-table`

Mono uppercase header, hairline row dividers, surface tint on row hover. Left
aligned by default; keep tables borderless on the outside — let whitespace frame them.

---

## Timeline — `.kd-timeline`

Vertical list with a hairline rail and pink marker dots (the one glow in the
component). Each `.kd-timeline__item` holds `.kd-timeline__time` (cyan mono),
`.kd-timeline__title`, `.kd-timeline__body`. Ideal for experience / process /
"how I work".

---

## Code — `.kd-code` / `.kd-code-inline`

Block: near-black (`--kd-ink-900`) with a 3px pink left rule. Highlight spans:
`.kd-code__c` (pink · keyword/selector), `.kd-code__s` (cyan · value/string),
`.kd-code__m` (subtle · comment). Inline: `.kd-code-inline`.

---

## Signature graphic — `.kd-neon-line`

The thin neon gradient rule (`--kd-gradient-neon`) is the recurring brand recipe:
one short hairline under a heading or hero. Pair it with the `k` monogram or
wordmark from [Part 6 — Logo System](04-logo.md). One signal per composition.

---

## Composition checklist

Before shipping any screen built from these components:

- [ ] Exactly **one** primary signal (one primary button / one glow / one gradient).
- [ ] The wordmark, if present, is lowercase `koodalanne`.
- [ ] All interactive elements have a visible focus state.
- [ ] Motion respects `prefers-reduced-motion`.
- [ ] Colors come from `--color-*`, never raw hex or `--kd-*` primitives.
