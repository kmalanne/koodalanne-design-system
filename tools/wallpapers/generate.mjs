#!/usr/bin/env node
/* =========================================================================
   koodalanne — Wallpaper generator
   -------------------------------------------------------------------------
   "Neon Precision" wallpapers built the way the current ones are:
     · flat midnight-ink background (no gradients)
     · Miami grid / diagonal line patterns from patterns.css
     · the pink koodalanne wordmark, centred
     · optional gravel-bike mascot + slogan

   Reuses the real logo / mascot vector paths so the art stays on-brand.
   Outputs SVG (source of truth) + PNG (rasterised via rsvg-convert) into
   assets/wallpapers/.

   Usage:  node tools/wallpapers/generate.mjs
   ========================================================================= */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const OUT = join(ROOT, "assets", "wallpapers");
mkdirSync(OUT, { recursive: true });

/* ---- palette (mirrors design-system/tokens/tokens.css) ------------------ */
const C = {
  ink800: "#111218", // ★ base background — flat, no gradient
  pink: "#f890e7", // ★ brand primary
  cyan: "#0bd3d3", // ★ brand accent
  grey100: "#ececee",
};

/* ---- brand vector paths (copied from design-system/logo + mascot) -------- */
const MONO_PATH =
  "M0 125V1000H250V500H500V625H625V750H875V625H750V500H625V375H750V250H875V125H625V250H500V375H250V125Z";

// koodalanne wordmark — 10 glyphs, pitch 1000, box 9875 x 875 (after flip).
const WORD_INNER =
  '<path transform="translate(0,0)" d="M0 125V1000H250V500H500V625H625V750H875V625H750V500H625V375H750V250H875V125H625V250H500V375H250V125Z"/>' +
  '<path transform="translate(1000,0)" d="M125 125V250H0V625H125V750H750V625H875V250H750V125ZM250 250H625V625H250Z"/>' +
  '<path transform="translate(2000,0)" d="M125 125V250H0V625H125V750H750V625H875V250H750V125ZM250 250H625V625H250Z"/>' +
  '<path transform="translate(3000,0)" d="M125 125V250H0V625H125V750H625V1000H875V125ZM250 250H625V625H250Z"/>' +
  '<path transform="translate(4000,0)" d="M125 125V250H0V375H125V500H625V625H125V750H750V625H875V125ZM250 250H625V375H250Z"/>' +
  '<path transform="translate(5000,0)" d="M125 125V250H375V875H250V1000H625V250H875V125Z"/>' +
  '<path transform="translate(6000,0)" d="M125 125V250H0V375H125V500H625V625H125V750H750V625H875V125ZM250 250H625V375H250Z"/>' +
  '<path transform="translate(7000,0)" d="M0 125V750H750V625H875V125H625V625H250V125Z"/>' +
  '<path transform="translate(8000,0)" d="M0 125V750H750V625H875V125H625V625H250V125Z"/>' +
  '<path transform="translate(9000,0)" d="M125 125V250H0V625H125V750H750V625H875V375H250V250H750V125ZM250 500H625V625H250Z"/>';

const WORD_W = 9875;
const WORD_H = 875;

/* gravel-bike mascot — alt accents (design-system/mascot/bike-alt.svg),
   96 x 96 local box: pink saddle/handlebar, cyan hubs. */
const BIKE_BODY =
  '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
  `<circle cx="26" cy="63" r="14" stroke="${C.grey100}" stroke-width="3"/>` +
  `<circle cx="70" cy="63" r="14" stroke="${C.grey100}" stroke-width="3"/>` +
  `<path d="M26 63 L46 63 L39 43 L57 41 L46 63 M39 43 L26 63 M57 41 L70 63 M39 43 L35 32 M57 41 L58 38" stroke="${C.grey100}" stroke-width="3"/>` +
  `<path d="M29 32 L42 31" stroke="${C.pink}" stroke-width="3"/>` +
  `<path d="M58 38 L63 36 C69 35 69 42 63 42" stroke="${C.pink}" stroke-width="3"/>` +
  `<circle cx="26" cy="63" r="2.5" fill="${C.cyan}"/>` +
  `<circle cx="70" cy="63" r="2.5" fill="${C.cyan}"/>` +
  "</g>";

/* ---- helpers ------------------------------------------------------------ */
const r = (n) => Math.round(n * 100) / 100;

// place the wordmark: top-left at (x,y), rendered `width` px wide, pink.
function wordmark(x, y, width, fill = C.pink) {
  const s = width / WORD_W;
  return `<g transform="translate(${r(x)},${r(y)}) scale(${r(s)})" fill="${fill}"><g transform="translate(0,1000) scale(1,-1)">${WORD_INNER}</g></g>`;
}

// the "k" monogram — square glyph, 875 units wide in its own box.
const MONO_BOX = 875;

// place the monogram: top-left at (x,y), rendered `size` px square.
function monogram(x, y, size, fill = C.pink) {
  const s = size / MONO_BOX;
  return (
    `<g transform="translate(${r(x)},${r(y)}) scale(${r(s)})" fill="${fill}">` +
    `<g transform="translate(0,1000) scale(1,-1)"><path d="${MONO_PATH}"/></g></g>`
  );
}

// flat Miami grid (uniform, from .kd-grid) — pink hairlines on ink.
function gridLayer(w, h, sw) {
  const gs = 44 * sw;
  const lines = [];
  for (let x = gs; x < w; x += gs) lines.push(`<line x1="${r(x)}" y1="0" x2="${r(x)}" y2="${h}"/>`);
  for (let y = gs; y < h; y += gs) lines.push(`<line x1="0" y1="${r(y)}" x2="${w}" y2="${r(y)}"/>`);
  return `<g stroke="${C.pink}" stroke-width="${r(Math.max(1, sw))}" opacity="0.07">${lines.join("")}</g>`;
}

// flat diagonal field (from .kd-diagonal) — 45° pink hairlines.
function diagonalLayer(w, h, sw, opacity = 0.07) {
  const step = 22 * sw;
  const lines = [];
  for (let x = -h; x < w; x += step) {
    lines.push(`<line x1="${r(x)}" y1="0" x2="${r(x + h)}" y2="${h}"/>`);
  }
  return `<g stroke="${C.pink}" stroke-width="${r(Math.max(1, sw))}" opacity="${opacity}">${lines.join("")}</g>`;
}

// pink pixel corner ticks (from .kd-ticks) — top-left + bottom-right.
function cornerTicks(w, h, sw) {
  const m = 54 * sw;
  const L = 34 * sw;
  const t = 3 * sw;
  const line = (x1, y1, x2, y2) =>
    `<line x1="${r(x1)}" y1="${r(y1)}" x2="${r(x2)}" y2="${r(y2)}" stroke="${C.pink}" stroke-width="${r(t)}" stroke-linecap="square"/>`;
  return (
    `<g opacity="0.85">` +
    line(m, m, m + L, m) + line(m, m, m, m + L) +
    line(w - m, h - m, w - m - L, h - m) + line(w - m, h - m, w - m, h - m - L) +
    `</g>`
  );
}

function svgDoc(w, h, body, label) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="koodalanne wallpaper — ${label}">` +
    body +
    `</svg>\n`
  );
}

/* ========================================================================
   Special-occasion livery — "Sunset"
   Deliberately off-brand: sunset sky, gradient-filled monogram with a deep
   purple keyline, gold top edges and palm silhouettes inside the glyph.
   ======================================================================== */

// monogram path in y-down coords (875 x 875), no flip transform needed.
const MONO_PATH_YDOWN =
  "M0 875V0H250V500H500V375H625V250H875V375H750V500H625V625H750V750H875V875H625V750H500V625H250V875Z";

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (n) => Math.round(n * 10) / 10;
const quadPt = (a, b, c, t) => ({
  x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * b.x + t * t * c.x,
  y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * b.y + t * t * c.y,
});
const quadTan = (a, b, c, t) => {
  const x = 2 * (1 - t) * (b.x - a.x) + 2 * t * (c.x - b.x);
  const y = 2 * (1 - t) * (b.y - a.y) + 2 * t * (c.y - b.y);
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};
// consistent winding so overlapping subpaths union under nonzero fill.
const poly = (pts) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  if (a < 0) pts = [...pts].reverse();
  return "M" + pts.map((p) => `${f1(p.x)} ${f1(p.y)}`).join("L") + "Z";
};

// tapered stroke along a quadratic curve, as a filled polygon.
function taper(a, b, c, w0, w1, n = 20) {
  const L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = quadPt(a, b, c, t);
    const T = quadTan(a, b, c, t);
    const w = (w0 + (w1 - w0) * t) / 2;
    L.push({ x: p.x - T.y * w, y: p.y + T.x * w });
    R.push({ x: p.x + T.y * w, y: p.y - T.x * w });
  }
  return poly([...L, ...R.reverse()]);
}

// procedural palm silhouette: tapered trunk + feathery fronds.
function palm(crown, base, L, rng) {
  const d = [];
  const bend = { x: (crown.x + base.x) / 2 + (base.x - crown.x) * 0.4 + L * 0.12, y: (crown.y + base.y) / 2 };
  d.push(taper(crown, bend, base, L * 0.06, L * 0.11));

  for (const deg of [-176, -152, -128, -104, -80, -56, -32, -8, 14, 194]) {
    const a = (deg * Math.PI) / 180;
    const len = L * (0.75 + 0.35 * rng());
    const dir = { x: Math.cos(a), y: Math.sin(a) };
    const end = { x: crown.x + dir.x * len, y: crown.y + dir.y * len + len * 0.38 };
    const ctl = { x: crown.x + dir.x * len * 0.55, y: crown.y + dir.y * len * 0.55 - len * 0.18 };
    d.push(taper(crown, ctl, end, len * 0.03, len * 0.004, 12));

    for (let t = 0.1; t < 0.98; t += 0.05) {
      const p = quadPt(crown, ctl, end, t);
      const T = quadTan(crown, ctl, end, t);
      const ll = (len * 0.3 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + len * 0.03) * (0.85 + 0.3 * rng());
      for (const side of [1, -1]) {
        let vx = -T.y * side + T.x * 0.9;
        let vy = T.x * side + T.y * 0.9 + 0.35;
        const vl = Math.hypot(vx, vy);
        vx /= vl; vy /= vl;
        const h = len * 0.03;
        d.push(poly([
          { x: p.x - T.x * h, y: p.y - T.y * h },
          { x: p.x + T.x * h, y: p.y + T.y * h },
          { x: p.x + vx * ll, y: p.y + vy * ll },
        ]));
      }
    }
  }
  return d.join("");
}

function sunsetClouds(w, h, sw) {
  const rng = mulberry32(7);
  const tints = ["#ffe2c4", "#ffcfb2", "#f8b6c6", "#f3a4c0"];
  const out = [];
  for (let i = 0; i < 26; i++) {
    const cy = h * (0.3 + 0.68 * Math.sqrt(rng()));
    out.push(
      `<ellipse cx="${r(w * rng())}" cy="${r(cy)}" rx="${r(w * (0.12 + 0.3 * rng()))}" ry="${r(h * (0.006 + 0.018 * rng()))}" ` +
        `fill="${tints[i % tints.length]}" opacity="${r(0.22 + 0.3 * rng())}"/>`
    );
  }
  return (
    `<filter id="f-cloud" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="${r(26 * sw)}"/></filter>` +
    `<g filter="url(#f-cloud)">${out.join("")}</g>`
  );
}

function livery(w, h, label) {
  const portrait = h > w;
  const sw = w / 1920;
  const size = portrait ? w * 0.66 : Math.min(w, h) * 0.6;
  const x = (w - size) / 2;
  const y = (h - size) / 2;
  const s = size / MONO_BOX;
  const K = MONO_PATH_YDOWN;
  const rng = mulberry32(42);

  const palms =
    palm({ x: 125, y: 190 }, { x: 70, y: 920 }, 300, rng) +
    palm({ x: 700, y: 330 }, { x: 760, y: 920 }, 320, rng) +
    palm({ x: 380, y: 560 }, { x: 420, y: 920 }, 210, rng);

  const defs =
    `<defs>` +
    `<linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#6c78b2"/><stop offset="0.35" stop-color="#ad7fb2"/>` +
    `<stop offset="0.62" stop-color="#ea9a9e"/><stop offset="0.82" stop-color="#f6ac86"/><stop offset="1" stop-color="#f9b679"/></linearGradient>` +
    `<radialGradient id="g-sky-blue" cx="0.95" cy="0" r="0.7"><stop offset="0" stop-color="#4e95c8" stop-opacity="0.85"/><stop offset="1" stop-color="#4e95c8" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="g-sky-violet" cx="0" cy="0.1" r="0.6"><stop offset="0" stop-color="#7a5fa6" stop-opacity="0.55"/><stop offset="1" stop-color="#7a5fa6" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="g-fill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="875">` +
    `<stop offset="0" stop-color="#3f5fe4"/><stop offset="0.28" stop-color="#9840d6"/><stop offset="0.52" stop-color="#ff3fb4"/>` +
    `<stop offset="0.78" stop-color="#f27e9c"/><stop offset="1" stop-color="#efa34f"/></linearGradient>` +
    `<linearGradient id="g-palm" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="875">` +
    `<stop offset="0" stop-color="#2c2a9c" stop-opacity="0.7"/><stop offset="0.5" stop-color="#9a2c9e" stop-opacity="0.45"/>` +
    `<stop offset="1" stop-color="#e2627a" stop-opacity="0.4"/></linearGradient>` +
    `<clipPath id="clip-k"><path d="${K}"/></clipPath>` +
    `<mask id="m-top" maskUnits="userSpaceOnUse" x="-50" y="-50" width="975" height="975"><path d="${K}" fill="#fff"/><path d="${K}" fill="#000" transform="translate(0,16)"/></mask>` +
    `<mask id="m-left" maskUnits="userSpaceOnUse" x="-50" y="-50" width="975" height="975"><path d="${K}" fill="#fff"/><path d="${K}" fill="#000" transform="translate(14,0)"/></mask>` +
    `<filter id="f-shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>` +
    `</defs>`;

  const gull = (gx, gy, k) =>
    `<path transform="translate(${r(gx)},${r(gy)}) scale(${r(k)})" d="M-10 0Q-5 -6 0 0Q5 -6 10 0"/>`;
  const gs = size / 260;
  const bx = x - size * 0.2;
  const by = y + size * 0.78;
  const birds =
    `<g fill="none" stroke="#6b4b8e" stroke-width="1.6" stroke-linecap="round" opacity="0.85">` +
    gull(bx, by, gs) + gull(bx + 16 * gs, by + 4 * gs, gs * 0.8) + gull(bx + 6 * gs, by + 14 * gs, gs * 1.1) +
    `</g>`;

  const glyph =
    `<g transform="translate(${r(x)},${r(y)}) scale(${r(s * 1000) / 1000})">` +
    `<path d="${K}" fill="#2a0838" stroke="#2a0838" stroke-width="56" stroke-linejoin="miter" opacity="0.55" transform="translate(14,20)" filter="url(#f-shadow)"/>` +
    `<path d="${K}" fill="#5a0f70" stroke="#5a0f70" stroke-width="56" stroke-linejoin="miter"/>` +
    `<path d="${K}" fill="url(#g-fill)"/>` +
    `<g clip-path="url(#clip-k)"><path d="${palms}" fill="url(#g-palm)"/></g>` +
    `<rect x="-10" y="-10" width="895" height="895" fill="#e478e6" opacity="0.6" mask="url(#m-left)"/>` +
    // gold only on the upper edges (stem top + arm staircase)
    `<rect x="-10" y="-10" width="895" height="410" fill="#ffbf3a" mask="url(#m-top)"/>` +
    `</g>`;

  const body =
    defs +
    `<rect width="${w}" height="${h}" fill="url(#g-sky)"/>` +
    `<rect width="${w}" height="${h}" fill="url(#g-sky-blue)"/>` +
    `<rect width="${w}" height="${h}" fill="url(#g-sky-violet)"/>` +
    sunsetClouds(w, h, sw) +
    birds +
    glyph;
  return svgDoc(w, h, body, label);
}

/* ========================================================================
   Composition builder
   opts: { bg: 'grid' | 'diagonal' | 'both', withBike: bool, label }
   ======================================================================== */
function build(w, h, opts) {
  const portrait = h > w;
  const sw = w / 1920;
  const cx = w / 2;
  const parts = [];

  if (opts.mode === "livery") return livery(w, h, opts.label);

  // flat ink base (no gradient)
  parts.push(`<rect width="${w}" height="${h}" fill="${C.ink800}"/>`);

  // pattern background
  if (opts.bg === "grid") parts.push(gridLayer(w, h, sw));
  else if (opts.bg === "diagonal") parts.push(diagonalLayer(w, h, sw));
  else if (opts.bg === "both") {
    parts.push(gridLayer(w, h, sw));
    parts.push(diagonalLayer(w, h, sw, 0.04));
  }

  // monogram compositions short-circuit the stacked wordmark layout
  if (opts.mode === "monogram") {
    const size = portrait ? w * 0.62 : Math.min(w, h) * 0.58;
    parts.push(monogram(cx - size / 2, (h - size) / 2, size, opts.monoFill));
    parts.push(cornerTicks(w, h, sw));
    return svgDoc(w, h, parts.join(""), opts.label);
  }

  // wordmark geometry
  const wWidth = portrait ? w * 0.78 : w * 0.5;
  const wHeight = (wWidth * WORD_H) / WORD_W;

  // optional stacked elements: [bike] · wordmark · [rule + slogan]
  const bikeW = portrait ? w * 0.3 : w * 0.13;
  const bikeScale = bikeW / 96;
  const bikeH = opts.withBike ? 96 * bikeScale : 0;
  const gapBikeWord = wHeight * 1.0;

  const sloganSize = portrait ? w * 0.03 : w * 0.0135;
  const gapWordRule = wHeight * 0.7;
  const gapRuleSlogan = wHeight * 0.55;
  const ruleH = 3 * sw;

  const bikeBlock = opts.withBike ? bikeH + gapBikeWord : 0;
  const sloganBlock = opts.withSlogan ? gapWordRule + ruleH + gapRuleSlogan + sloganSize : 0;
  const total = bikeBlock + wHeight + sloganBlock;
  const top = (h - total) / 2;

  // bike (centred, above the wordmark)
  if (opts.withBike) {
    parts.push(`<g transform="translate(${r(cx - bikeW / 2)},${r(top)}) scale(${r(bikeScale)})">${BIKE_BODY}</g>`);
  }

  // wordmark
  const wy = top + bikeBlock;
  parts.push(wordmark(cx - wWidth / 2, wy, wWidth));

  // flat cyan rule + slogan
  if (opts.withSlogan) {
    const ruleW = wWidth * 0.16;
    const ry = wy + wHeight + gapWordRule;
    parts.push(`<rect x="${r(cx - ruleW / 2)}" y="${r(ry)}" width="${r(ruleW)}" height="${r(ruleH)}" fill="${C.cyan}"/>`);
    const sy = ry + ruleH + gapRuleSlogan + sloganSize;
    parts.push(
      `<text x="${r(cx)}" y="${r(sy)}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="${r(sloganSize)}" letter-spacing="${r(sloganSize * 0.32)}" fill="${C.cyan}">MOVE SOFTWARE FORWARD</text>`
    );
  }

  // subtle pink corner ticks
  parts.push(cornerTicks(w, h, sw));

  return svgDoc(w, h, parts.join(""), opts.label);
}

/* ---- render matrix ------------------------------------------------------ */
const SIZES = [
  { suffix: "1920x1080", w: 1920, h: 1080 },
  { suffix: "1800x1169", w: 1800, h: 1169 },
  { suffix: "3840x2160", w: 3840, h: 2160 },
  { suffix: "mobile-1290x2796", w: 1290, h: 2796 },
];

const VARIANTS = [
  { name: "grid", title: "Grid", desc: "Pink wordmark on the Miami grid.", opts: { bg: "grid", withBike: false, label: "grid" } },
  { name: "grid-slogan", title: "Grid + slogan", desc: "Pink wordmark and slogan on the Miami grid.", opts: { bg: "grid", withBike: false, withSlogan: true, label: "grid + slogan" } },
  { name: "diagonal", title: "Diagonal", desc: "Pink wordmark on the diagonal line field.", opts: { bg: "diagonal", withBike: false, label: "diagonal" } },
  { name: "diagonal-slogan", title: "Diagonal + slogan", desc: "Pink wordmark and slogan on the diagonal line field.", opts: { bg: "diagonal", withBike: false, withSlogan: true, label: "diagonal + slogan" } },
  { name: "bike", title: "Bike + slogan", desc: "Gravel-bike mascot, wordmark and slogan.", opts: { bg: "grid", withBike: true, withSlogan: true, label: "bike + slogan" } },
  { name: "bike-plain", title: "Bike", desc: "Gravel-bike mascot and wordmark, no slogan.", opts: { bg: "grid", withBike: true, withSlogan: false, label: "bike" } },
  { name: "monogram-pink", title: "Monogram — pink", desc: "Oversized pink monogram on the Miami grid.", opts: { bg: "grid", mode: "monogram", monoFill: C.pink, label: "pink monogram" } },
  { name: "monogram-cyan", title: "Monogram — cyan", desc: "Oversized cyan monogram on the Miami grid.", opts: { bg: "grid", mode: "monogram", monoFill: C.cyan, label: "cyan monogram" } },
  { name: "livery-sunset", title: "Livery — Sunset", desc: "Special-occasion livery (off-brand by design): sunset-gradient monogram with palm silhouettes.", opts: { mode: "livery", label: "sunset livery" } },
];

// The original glow wallpapers (hand-authored, not regenerated here).
const CLASSIC = {
  title: "Classic",
  desc: "The original sunset-glow wallpapers.",
  sizes: [
    { suffix: "1920x1080", w: 1920, h: 1080 },
    { suffix: "3840x2160", w: 3840, h: 2160 },
    { suffix: "mobile-1290x2796", w: 1290, h: 2796 },
  ].map((s) => ({ ...s, stem: `wallpaper-${s.suffix}` })),
};

let haveRsvg = true;
try {
  execFileSync("rsvg-convert", ["--version"], { stdio: "ignore" });
} catch {
  haveRsvg = false;
  console.warn("! rsvg-convert not found — writing SVG only (no PNG).");
}

const written = [];
const groups = [];
for (const v of VARIANTS) {
  const group = { title: v.title, desc: v.desc, sizes: [] };
  for (const s of SIZES) {
    const svg = build(s.w, s.h, v.opts);
    const stem = `wallpaper-${v.name}-${s.suffix}`;
    const svgPath = join(OUT, `${stem}.svg`);
    writeFileSync(svgPath, svg);
    written.push(`${stem}.svg`);
    if (haveRsvg) {
      const pngPath = join(OUT, `${stem}.png`);
      execFileSync("rsvg-convert", ["-w", String(s.w), "-h", String(s.h), svgPath, "-o", pngPath]);
      written.push(`${stem}.png`);
    }
    group.sizes.push({ ...s, stem });
  }
  groups.push(group);
}
groups.push(CLASSIC);

// --- gallery page --------------------------------------------------------
writeFileSync(join(OUT, "index.html"), gallery(groups));
written.push("index.html");

console.log(`✓ Wrote ${written.length} files to assets/wallpapers/`);
for (const f of written) console.log("  " + f);

/* ========================================================================
   Gallery page — self-contained, on-brand thumbnail grid.
   ======================================================================== */
function gallery(groups) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const total = groups.reduce((n, g) => n + g.sizes.length, 0);

  const card = (it) => {
    const dims = it.suffix.replace(/^mobile-/, "").replace("x", "×");
    const kind = it.h > it.w ? "mobile" : "desktop";
    return (
      `<figure class="card ${kind}">` +
      `<a class="thumb" href="${it.stem}.png" target="_blank" rel="noopener" style="aspect-ratio:${it.w}/${it.h}">` +
      `<img loading="lazy" src="${it.stem}.png" alt="${esc(dims)} wallpaper" width="${it.w}" height="${it.h}"/>` +
      `<span class="open">Open full size ↗</span>` +
      `</a>` +
      `<figcaption><span class="dims">${dims}</span>` +
      `<span class="dl"><a href="${it.stem}.png" download>PNG</a><a href="${it.stem}.svg" download>SVG</a></span>` +
      `</figcaption></figure>`
    );
  };

  const section = (g) => {
    const desktop = g.sizes.filter((s) => s.w >= s.h);
    const mobile = g.sizes.filter((s) => s.h > s.w);
    let inner = `<header class="sec"><h2>${esc(g.title)}</h2><p>${esc(g.desc)}</p></header>`;
    if (desktop.length) {
      if (mobile.length) inner += `<h3 class="subhead">Desktop</h3>`;
      inner += `<div class="grid">${desktop.map(card).join("")}</div>`;
    }
    if (mobile.length) {
      inner += `<h3 class="subhead">Mobile</h3><div class="grid mobile">${mobile.map(card).join("")}</div>`;
    }
    return `<section>${inner}</section>`;
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>koodalanne — wallpapers</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  :root{
    --ink:#111218; --ink-700:#181a23; --ink-600:#20222e; --line:#2a2d3a;
    --pink:#f890e7; --cyan:#0bd3d3; --grey:#ececee; --muted:#9494a0;
    --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,monospace;
    --sans:"Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  }
  *{box-sizing:border-box}
  body{
    margin:0;background:var(--ink);color:var(--grey);font-family:var(--sans);
    background-image:linear-gradient(rgba(248,144,231,.05) 1px,transparent 1px),
      linear-gradient(90deg,rgba(248,144,231,.05) 1px,transparent 1px);
    background-size:44px 44px;
  }
  header.top{padding:56px 24px 8px;max-width:1200px;margin:0 auto;text-align:center}
  header.top h1{font-family:var(--sans);font-weight:700;font-size:clamp(1.6rem,4vw,2.6rem);
    margin:0;letter-spacing:-.01em}
  header.top h1 b{color:var(--pink)}
  header.top p{color:var(--muted);margin:.5rem 0 0;font-size:.95rem}
  main{max-width:1200px;margin:0 auto;padding:24px}
  section{margin:40px 0}
  header.sec{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;
    border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:20px}
  header.sec h2{margin:0;font-size:1.25rem}
  header.sec h2::before{content:"";display:inline-block;width:10px;height:10px;
    margin-right:10px;background:var(--pink)}
  header.sec p{margin:0;color:var(--muted);font-size:.9rem}
  .grid{display:grid;gap:20px;align-items:start;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
  .grid.mobile{grid-template-columns:repeat(auto-fill,minmax(180px,220px))}
  .subhead{font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;
    color:var(--muted);margin:22px 0 12px}
  .card{margin:0;background:var(--ink-700);border:1px solid var(--line)}
  .thumb{position:relative;display:block;overflow:hidden;background:#0c0d12}
  .thumb img{display:block;width:100%;height:100%;object-fit:cover}
  .thumb .open{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    font-family:var(--mono);font-size:.8rem;letter-spacing:.04em;color:var(--cyan);
    background:rgba(12,13,18,.55);opacity:0;transition:opacity .18s ease}
  .thumb:focus-visible .open{opacity:1}
  @media (hover:hover){.thumb:hover .open{opacity:1}}
  figcaption{display:flex;align-items:center;justify-content:space-between;
    padding:10px 12px;font-family:var(--mono);font-size:.78rem}
  .dims{color:var(--grey);letter-spacing:.03em}
  .dl{display:flex;gap:8px}
  .dl a{color:var(--muted);text-decoration:none;border:1px solid var(--line);
    padding:6px 10px;letter-spacing:.05em;transition:color .15s,border-color .15s}
  .dl a:active{color:var(--cyan);border-color:var(--cyan)}
  @media (hover:hover){.dl a:hover{color:var(--cyan);border-color:var(--cyan)}}
  footer{max-width:1200px;margin:0 auto;padding:24px;color:var(--muted);
    font-family:var(--mono);font-size:.72rem;text-align:center}
</style>
</head>
<body>
<header class="top">
  <h1>wallpapers</h1>
  <p>${total} downloads · click a thumbnail to open full size, or grab PNG / SVG.</p>
</header>
<main>
${groups.map(section).join("\n")}
</main>
<footer>Neon Precision · generated by tools/wallpapers/generate.mjs</footer>
</body>
</html>
`;
}
