# koodalanne — Motion

> Part 6 of the Brand Bible. Source of truth:
> [`design-system/motion/motion.css`](../design-system/motion/motion.css)
> (timing primitives live in `tokens.css`). The rule from "Neon Precision":
> **movement guides, never distracts.** Everything glides — nothing bounces,
> spins or elastics.

---

## Principles

- **Slow and subtle.** Nothing calls attention to the motion itself.
- **One thing moves at a time.** Like one accent per screen.
- **Glow is reserved.** Full-strength pink glow appears only on a deliberate
  hover (lift), never idle.
- **Always escapable.** Every animation collapses under
  `prefers-reduced-motion` — no exceptions.

---

## Timing scale (from `tokens.css`)

| Token | Value | Use |
| --- | --- | --- |
| `--kd-duration-instant` | 80ms | Micro-feedback (press). |
| `--kd-duration-fast` | 160ms | Small transforms, quick hovers. |
| `--kd-duration-normal` | 240ms | Standard hover / color / shadow. |
| `--kd-duration-slow` | 420ms | Entrances, hairline draw-in, flicker. |
| `--kd-duration-ambient` | 8s | Grid / gradient drift. |

Easing: `--kd-ease-out` (entrances & hovers), `--kd-ease-standard`
(functional), `--kd-ease-in-out` (looping pulses).

---

## Utilities

| Class | Effect | Use |
| --- | --- | --- |
| `.kd-lift` | 4px rise + pink glow on hover | Cards, tiles, clickable surfaces. |
| `.kd-hover-glow` / `--cyan` | Glow on hover, no move | Buttons, inputs, icons. |
| `.kd-underline` | Cyan hairline draws in from left | Links, nav items. |
| `.kd-reveal` | Fade + 12px rise on load | Section / hero entrances. |
| `.kd-stagger` | Sequences children's reveals (80ms steps) | Lists, capability grids. |
| `.kd-draw` | Hairline scales in from left | Dividers, section rules. |
| `.kd-flicker` | One neon flicker on hover | Logo / rare accents only. |
| `.kd-pulse` | Slow pink glow pulse | "Available" status, live dots. |
| `.kd-drift` | Ambient grid/gradient drift | Hero backgrounds (pair with `.kd-grid`). |
| `.kd-cursor` | Blinking terminal caret | Terminal motifs, hero copy. |

```html
<article class="kd-card kd-lift">…</article>
<a class="kd-underline" href="#">Capabilities</a>
<h1>Software they can trust<span class="kd-cursor"></span></h1>
```

---

## Do / don't

- ✅ One moving element per view; glow only on hover.
- ✅ Keep blur ≤ the token glow (24px) — no heavier halos.
- ❌ No bounce, spin, elastic, parallax, or auto-playing carousels.
- ❌ No motion on body text or during reading.
- ❌ Never override the reduced-motion guard.
