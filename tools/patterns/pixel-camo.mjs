#!/usr/bin/env node
/* =========================================================================
   koodalanne — Pixel-camo pattern generator
   -------------------------------------------------------------------------
   Reproduces the digital "pixel camo" from the cycling kit
   (assets/clothing/cycling-kit.png) as a reusable, on-brand design asset:

     · black base with three ink greys (the camo body)
     · sparse pink + cyan accent clusters (brand primary / accent)
     · square cells only — classic blocky digital-camo look
     · fully seamless / tileable (wrapped value noise), so it repeats
       cleanly when used as a fill or texture

   Palette mirrors design-system/tokens/tokens.css.

   Outputs into assets/patterns/:
     · pixel-camo-tile.svg   — one seamless tile (source of truth)
     · pixel-camo-tile.png   — raster of the seamless tile
     · pixel-camo.svg        — large field (tile referenced via <pattern>)
     · pixel-camo.png        — large rasterised field

   Usage:  node tools/patterns/pixel-camo.mjs
   ========================================================================= */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const OUT = join(ROOT, "assets", "patterns");
mkdirSync(OUT, { recursive: true });

/* ---- palette (mirrors design-system/tokens/tokens.css) ------------------ */
// Only four inks: black (dominant) + two greys, plus the two brand hues.
const BLACK = "#0c0d12"; // ink900
const GRAY = ["#1b1d24", "#2b2e38", "#3b3f4b"]; // dark → mid → light (transitional)
const PINK = ["#e13796", "#a82a70", "#f27ec0"]; // main → darker → lighter (camo tones)
const CYAN = ["#0bd3d3", "#088a8a", "#5fe8e8"]; // main → darker → lighter

/* ---- tile geometry ------------------------------------------------------
   The base unit is a "pattern pixel": a 2×2 group of sub-pixels drawn as one
   solid square. Every colour decision snaps to this lattice, so the whole
   camo is built from symmetrical groups of four.                           */
const PCOLS = 80; // pattern pixels across the seamless tile
const PROWS = 80;
const SUB = 8; // sub-pixel size → pattern pixel = 2·SUB
const PPIX = SUB * 2;
const TILE_W = PCOLS * PPIX; // 1280
const TILE_H = PROWS * PPIX;
const SEED = 0x1e0c;

/* ---- seeded PRNG + tileable value noise --------------------------------- */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// A wrapped f×f lattice of random values → seamless when sampled on [0,1).
function makeLattice(f, rng) {
  const g = [];
  for (let y = 0; y < f; y++) {
    const row = [];
    for (let x = 0; x < f; x++) row.push(rng());
    g.push(row);
  }
  return g;
}
function sampleLattice(lat, f, u, v) {
  const x = u * f;
  const y = v * f;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const x0 = ((xi % f) + f) % f;
  const y0 = ((yi % f) + f) % f;
  const x1 = (x0 + 1) % f;
  const y1 = (y0 + 1) % f;
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const top = lerp(lat[y0][x0], lat[y0][x1], fx);
  const bot = lerp(lat[y1][x0], lat[y1][x1], fx);
  return lerp(top, bot, fy);
}
// fbm from several wrapped lattices; freqs must divide the tile → tileable.
function makeFbm(freqs, weights, rng) {
  const lats = freqs.map((f) => makeLattice(f, rng));
  const wsum = weights.reduce((a, b) => a + b, 0);
  return (u, v) => {
    let acc = 0;
    for (let i = 0; i < freqs.length; i++)
      acc += weights[i] * sampleLattice(lats[i], freqs[i], u, v);
    return acc / wsum;
  };
}

// Nearest-neighbour sample → flat, hard-edged rectangular cells (no blur).
function sampleBlocky(lat, f, u, v) {
  const x0 = ((Math.floor(u * f) % f) + f) % f;
  const y0 = ((Math.floor(v * f) % f) + f) % f;
  return lat[y0][x0];
}
// Blocky fbm: stacked rectangular grids → the "tetris block" digital-camo
// look (axis-aligned, stair-stepped edges) rather than organic splashes.
function makeBlocky(freqs, weights, rng) {
  const lats = freqs.map((f) => makeLattice(f, rng));
  const wsum = weights.reduce((a, b) => a + b, 0);
  return (u, v) => {
    let acc = 0;
    for (let i = 0; i < freqs.length; i++)
      acc += weights[i] * sampleBlocky(lats[i], freqs[i], u, v);
    return acc / wsum;
  };
}

// Anisotropic blocky fbm: each octave is [fx, fy]. Using fx < fy makes cells
// wider than tall → horizontally-stretched blobs.
function makeBlockyXY(pairs, weights, rng) {
  const lats = pairs.map(([fx, fy]) => {
    const g = [];
    for (let y = 0; y < fy; y++) {
      const row = [];
      for (let x = 0; x < fx; x++) row.push(rng());
      g.push(row);
    }
    return g;
  });
  const wsum = weights.reduce((a, b) => a + b, 0);
  return (u, v) => {
    let acc = 0;
    for (let i = 0; i < pairs.length; i++) {
      const [fx, fy] = pairs[i];
      const x0 = ((Math.floor(u * fx) % fx) + fx) % fx;
      const y0 = ((Math.floor(v * fy) % fy) + fy) % fy;
      acc += weights[i] * lats[i][y0][x0];
    }
    return acc / wsum;
  };
}

/* ---- build the pattern-pixel colour grid --------------------------------
   Digital-camo recipe: medium-scale blobs + a high-frequency jitter added
   before thresholding, which roughens every edge into blocky steps.        */
const rng = mulberry32(SEED);
// Blocky (nearest-sampled) noise → axis-aligned rectangular cells, i.e. the
// "tetris block" digital-camo look instead of organic splashes. The coarse
// [4] octave mixes big and small patches so blocks vary in size.
const bodyBlob = makeBlocky([4, 8, 16, 40], [0.3, 0.3, 0.26, 0.14], rng);
// Bigger, wider-than-tall horizontal blobs; two coarse scales spread them
// evenly across the tile, the fine octave + warp ripple their edges.
const accBlob = makeBlockyXY([[10, 20], [16, 40], [40, 80]], [0.42, 0.33, 0.25], rng);
const pick = makeBlocky([8, 16], [0.6, 0.4], rng); // pink-vs-cyan regions
const tone = makeBlockyXY([[10, 20], [20, 40]], [0.6, 0.4], rng); // gradual shading
const speck = makeBlocky([80], [1], rng); // rare lone 2×2 pixels
// Smooth domain warp → waves the grey borders so they don't read as squares.
const warpU = makeFbm([10, 20, 40], [0.5, 0.3, 0.2], rng);
const warpV = makeFbm([10, 20, 40], [0.5, 0.3, 0.2], rng);
const WARP = 0.06;
// Fine edge-dither: added before thresholding so no straight border runs more
// than ~4 pattern pixels — it only flips cells already near an edge.
const ditherB = makeBlocky([20, 40], [0.4, 0.6], rng);
const ditherA = makeBlocky([20, 40], [0.4, 0.6], rng);
const DITHER = 0.11;

const grid = new Array(PCOLS * PROWS);
for (let py = 0; py < PROWS; py++) {
  for (let px = 0; px < PCOLS; px++) {
    const u = (px + 0.5) / PCOLS;
    const v = (py + 0.5) / PROWS;

    // black dominant, grey fills the field in three dark transitional shades;
    // the warped sample breaks the grey blocks into irregular, non-square edges.
    const wu = u + WARP * (warpU(u, v) - 0.5) * 2;
    const wv = v + WARP * (warpV(u, v) - 0.5) * 2;
    const bv = bodyBlob(wu, wv) + DITHER * (ditherB(u, v) - 0.5) * 2;
    let color = BLACK;
    if (bv > 0.56) color = bv > 0.82 ? GRAY[2] : bv > 0.7 ? GRAY[1] : GRAY[0];

    // brand colours: bigger separated horizontal blocks + a few lone pixels.
    // dither ripple breaks straight edges (≤ ~4 pattern pixels per run).
    const av = accBlob(wu, wv) + DITHER * (ditherA(u, v) - 0.5) * 2;
    if (av > 0.76 || speck(u, v) > 0.997) {
      const set = pick(u, v) < 0.58 ? PINK : CYAN;
      const t = tone(u, v);
      color = t < 0.38 ? set[1] : t > 0.64 ? set[2] : set[0];
    }

    grid[py * PCOLS + px] = color;
  }
}

/* ---- emit the tile as SVG (pattern pixels grouped by colour) ------------ */
function tileBody() {
  const byColor = new Map();
  for (let py = 0; py < PROWS; py++) {
    for (let px = 0; px < PCOLS; px++) {
      const c = grid[py * PCOLS + px];
      let arr = byColor.get(c);
      if (!arr) byColor.set(c, (arr = []));
      arr.push(`M${px * PPIX} ${py * PPIX}h${PPIX}v${PPIX}h-${PPIX}z`);
    }
  }
  let out = "";
  for (const [c, paths] of byColor) out += `<path fill="${c}" d="${paths.join("")}"/>`;
  return out;
}

const TILE = tileBody();

function tileSvg() {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE_W} ${TILE_H}" width="${TILE_W}" height="${TILE_H}" shape-rendering="crispEdges" role="img" aria-label="koodalanne pixel-camo — seamless tile">` +
    `<rect width="${TILE_W}" height="${TILE_H}" fill="${BLACK}"/>` +
    TILE +
    `</svg>\n`
  );
}

function fieldSvg(w, h) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges" role="img" aria-label="koodalanne pixel-camo — field">` +
    `<defs><pattern id="camo" patternUnits="userSpaceOnUse" width="${TILE_W}" height="${TILE_H}">` +
    `<rect width="${TILE_W}" height="${TILE_H}" fill="${BLACK}"/>${TILE}` +
    `</pattern></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#camo)"/>` +
    `</svg>\n`
  );
}

/* ---- write files -------------------------------------------------------- */
const FIELD_W = 4096;
const FIELD_H = 4096;

const files = [
  ["pixel-camo-tile.svg", tileSvg(), TILE_W, TILE_H],
  ["pixel-camo.svg", fieldSvg(FIELD_W, FIELD_H), FIELD_W, FIELD_H],
];

let haveRsvg = true;
try {
  execFileSync("rsvg-convert", ["--version"], { stdio: "ignore" });
} catch {
  haveRsvg = false;
  console.warn("! rsvg-convert not found — writing SVG only (no PNG).");
}

const written = [];
for (const [name, svg, w, h] of files) {
  const svgPath = join(OUT, name);
  writeFileSync(svgPath, svg);
  written.push(name);
  if (haveRsvg) {
    const pngName = name.replace(/\.svg$/, ".png");
    execFileSync("rsvg-convert", ["-w", String(w), "-h", String(h), svgPath, "-o", join(OUT, pngName)]);
    written.push(pngName);
  }
}

console.log(`✓ Wrote ${written.length} files to assets/patterns/`);
for (const f of written) console.log("  " + f);
