# koodalanne — Design Language: "Neon Precision"

> Part 2 of the Brand Bible. The single north-star phrase that guides every
> design decision: **Where premium software consulting meets neon nostalgia.**
> Think: _if Apple designed Vice City._

---

## The ten rules of Neon Precision

1. **Mostly black** — the midnight foundation (`--kd-ink-800`), never pure `#000`.
2. **Large whitespace** — premium comes from restraint and breathing room.
3. **Sharp typography** — confident scale, tight tracking on display sizes.
4. **Small neon accents** — pink and cyan are seasoning, not the meal.
5. **Pixel details** — sharp corners, 8-bit motifs used sparingly.
6. **Thin cyan lines** — 1–2px hairlines, grid horizons, dividers.
7. **Occasional sunset gradients** — one per screen, never on every element.
8. **Smooth animations** — subtle, slow, purposeful (see motion below).
9. **Premium photography** — dark, warm, night; never RGB gamer setups.
10. **One reference per screen** — like Apple uses one accent color.

---

## The single most important rule: restraint

> One subtle Vice City reference per screen. Not palm trees everywhere.

Someone who loves Vice City notices. Everyone else just thinks _"damn, this looks
cool."_

### What to avoid

- ❌ Palm trees / flamingos everywhere
- ❌ Purple gradients on everything
- ❌ 80s fonts everywhere (Press Start 2P is for the **logo only**)
- ❌ Vaporwave clichés · pixel explosions · outrun sunsets on every page

---

## Color usage

| Role | Token | Notes |
| --- | --- | --- |
| Base background | `--color-bg` (`ink-800`) | The canvas. |
| Surface / card | `--color-surface` (`ink-700`) | Raised content. |
| Primary accent | `--color-accent` (`pink-300`) | Headlines, key CTAs, links. |
| Secondary accent | `--color-accent-secondary` (`cyan-300`) | Hairlines, hovers, code. |
| Body text | `--color-text` (`grey-100`) | Never pure white on black. |
| Muted text | `--color-text-muted` (`grey-300`) | Secondary copy. |

**Gradients** (`--kd-gradient-sunset`, `--kd-gradient-neon`) are reserved for hero
moments and watermarks — one per screen, low opacity where possible.

**Accessibility:** body text targets WCAG AA (4.5:1). Neon pink/cyan on midnight
pass AA for large text; for small text on dark surfaces prefer `grey-100`.

---

## Typography

- **Display / logo:** `Press Start 2P` — the wordmark `koodalanne` (always lowercase) and rare accents only.
- **Everything else:** `Space Grotesk` — futuristic without being weird.
- **Code:** `JetBrains Mono` / `IBM Plex Mono`.

Pattern:

```
koodalanne                      ← Press Start 2P
Independent Software Consultant ← Space Grotesk
```

Use the modular scale in `tokens.css` (`--kd-text-*`). Tight tracking
(`--kd-tracking-tight`) on large display; wide tracking (`--kd-tracking-widest`)
for small uppercase labels.

---

## Motion language

Subtle only. Timing curves and durations live in `tokens.css`.

| Effect | Use | Token |
| --- | --- | --- |
| Cursor glow | Hover on interactive surfaces | `--kd-glow-pink` |
| Neon flicker | Rare accent, logo reveal | `--kd-duration-fast` |
| Slow gradient / grid drift | Ambient hero background | `--kd-duration-ambient` |
| Hairline draw-in | Section reveals | `--kd-ease-out` |

Respect `prefers-reduced-motion` — durations collapse to `0ms` automatically.

---

## Signature graphics — the recurring recipe

Every brand graphic follows the same stack so they feel like one family:

```
Black background
  ↓ diagonal pink lines
  ↓ Miami grid horizon  (var(--kd-grid-line), var(--kd-grid-size))
  ↓ thin cyan line
```

Recurring motifs: grid horizon · thin neon lines · pink corner ticks ·
terminal cursor. Use **one** per composition.

---

## Photography & imagery

Dark · warm · night. Office, coffee, MacBook, mechanical keyboard, neon light,
plants, concrete, glass. **Not** stock Unsplash, **not** RGB gamer setups.

Illustration: wireframe, gradient sunsets, pixel accents, thin neon lines.
No cartoons. Think Apple × Vice City.

---

## Logo system (spec)

One wordmark is not enough — build a family:

- **Primary:** `koodalanne` (Press Start 2P) — **always lowercase**, never `Koodalanne` or `KOODALANNE`, including the first letter.
- **Monogram:** `k`
- **Icon:** the `k` monogram on an ink tile (favicon, avatar, app icon)
- Variants: horizontal · stacked · outlined · filled · one-color · pink · white ·
  black · gradient · neon

Clear space = height of the `k`. Minimum digital size for the wordmark: 120px wide.

> **Built:** the family now ships as font-independent SVG in
> [`design-system/logo/`](../design-system/logo/). Full usage rules —
> clear space, minimum sizes, color pairings, favicon/OG wiring and misuse —
> live in [Part 6 — Logo System](04-logo.md).
