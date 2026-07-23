# koodalanne — Patterns

> Part of the Imagery layer (Part 7). Source of truth:
> [`design-system/patterns/patterns.css`](../design-system/patterns/patterns.css).
> Backgrounds and decorative graphics that build the "Miami after sunset"
> atmosphere. The rule holds: **one signature graphic per composition**, kept
> faint — atmosphere, not decoration.

---

## The recurring recipe

Every brand graphic stacks the same way so they feel like one family:

```
Midnight background
  ↓ diagonal pink lines        (.kd-diagonal)
  ↓ Miami grid horizon         (.kd-grid-horizon)
  ↓ thin cyan line             (.kd-horizon-line)
```

Use **one** layer as the hero of any given screen — never all at once.

---

## Utilities

| Class | Pattern | Use |
| --- | --- | --- |
| `.kd-grid` | Even Miami grid | Broad, faint backdrops. |
| `.kd-grid-horizon` | Grid dissolving upward | Hero backgrounds — the signature. |
| `.kd-diagonal` | Faint 45° pink lines | Section dividers, cover accents. |
| `.kd-scanline` | Subtle CRT scanlines | Code/terminal panels, imagery overlays. |
| `.kd-horizon-line` | Thin neon rule (fades at ends) | Under headings, between sections. |
| `.kd-vignette` | Radial night vignette | Adds depth to heroes / photos. |
| `.kd-ticks` | Pink corner ticks | Framing a featured card or quote. |
| `.kd-wash-sunset` / `-neon` / `-horizon` | Gradient washes | One per screen, low opacity. |

```html
<section class="kd-grid-horizon kd-vignette"> … hero … </section>
<hr class="kd-horizon-line" />
<figure class="kd-ticks"> … featured … </figure>
```

---

## Rules

- **Faint by default.** Grid lines ride on `--kd-grid-line` (~12% pink); don't
  raise opacity chasing visibility. If you notice it consciously, it's too strong.
- **One per screen.** A grid *or* a wash *or* a diagonal field — not a pile.
- **Derive, don't invent.** Patterns come only from the six motifs
  (grid · sunset · ocean · neon · concrete · pixels). No blobs, no random shapes.
- **Pair with restraint.** A pattern plus a single neon accent is a complete
  composition; add nothing else.
