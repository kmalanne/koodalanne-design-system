# koodalanne — Logo System

> Part 6 of the Brand Bible (realizes the **logo family** of Part 7 — Imagery).
> All marks live in [`design-system/logo/`](../design-system/logo/) as
> **font-independent SVG** — the actual Press Start 2P letterforms outlined to
> vector paths, so the identity is pixel-accurate yet never depends on a font
> file being installed.

---

## The family

| Asset | File | Use |
| --- | --- | --- |
| Wordmark | `wordmark.svg` | Primary logo. Sites, docs, headers. |
| Monogram | `monogram.svg` | The `k`. Avatars, tight spaces, watermark. |
| App icon | `icon.svg` | The `k` on an ink tile (cyan hairline). GitHub, app, social avatar. |
| Favicon | `favicon.svg` | The `k` on an ink tile, tuned for tiny sizes. |
| Open Graph | `og-image.svg` | 1200×630 link-preview card. Export to PNG for platforms that require raster. |

One-color variants ship for the wordmark and monogram:
`*-white.svg` (on photography / dark) and `*-ink.svg` (on light surfaces).
The default files are **Vice Pink** (`--kd-pink-300`).

---

## Non-negotiable rules

1. **Always lowercase.** The wordmark is `koodalanne` — never `Koodalanne` or
   `KOODALANNE`, including the first letter. The marks are drawn this way; never
   re-typeset the name in another case or font.
2. **One color per placement.** Pink on dark, white on photography, ink on light.
   No two-tone wordmarks.
3. **Pixels stay sharp.** Never round corners, add drop shadows, outlines,
   bevels, or gradients to the wordmark or monogram. (Neon glow is a screen-only
   treatment for the hero, not baked into the asset.)
4. **Never stretch or rotate.** Scale uniformly only.

---

## Clear space & minimum sizes

- **Clear space:** keep a margin equal to the height of the `k` (one cap height)
  clear on all sides. Nothing — text, edges, other logos — enters that zone.
- **Minimum sizes:** wordmark ≥ **120px** wide; monogram / favicon ≥ **16px**.
  Below 120px wide, switch from the wordmark to the monogram or app icon.

---

## Color pairings

| Background | Asset |
| --- | --- |
| Ink / midnight (`--color-bg`) | `wordmark.svg` (pink) or `-white` |
| Photography / busy dark | `wordmark-white.svg` |
| Light surface / invoice (`[data-theme="light"]`) | `wordmark-ink.svg` |

Pink on midnight is the signature. Avoid pink on light backgrounds (fails
contrast) — use the ink variant there.

---

## Favicon & Open Graph wiring

```html
<!-- in <head> -->
<link rel="icon" href="/design-system/logo/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/design-system/logo/icon.svg" />
<meta property="og:image" content="/design-system/logo/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

Modern browsers use the SVG favicon directly. For a raster fallback / OG image,
export to PNG (any SVG rasterizer), e.g.:

```bash
# ImageMagick / rsvg-convert / resvg — pick one you have installed
rsvg-convert -w 1200 -h 630 og-image.svg -o og-image.png
rsvg-convert -w 180  -h 180  icon.svg     -o apple-touch-icon.png
```

---

## Misuse (don't)

- ❌ Capitalize the name or set it in Space Grotesk / any non-pixel font.
- ❌ Recolor outside the palette, or use two colors in one mark.
- ❌ Add glow, shadow, outline, or gradient to the asset file.
- ❌ Rotate, skew, condense, or stretch.
- ❌ Place the pink wordmark on a light or low-contrast background.
- ❌ Crowd the clear space or sit the mark on a busy image without the tile.
