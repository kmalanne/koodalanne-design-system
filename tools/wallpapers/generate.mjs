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
   Composition builder
   opts: { bg: 'grid' | 'diagonal' | 'both', withBike: bool, label }
   ======================================================================== */
function build(w, h, opts) {
  const portrait = h > w;
  const sw = w / 1920;
  const cx = w / 2;
  const parts = [];

  // flat ink base (no gradient)
  parts.push(`<rect width="${w}" height="${h}" fill="${C.ink800}"/>`);

  // pattern background
  if (opts.bg === "grid") parts.push(gridLayer(w, h, sw));
  else if (opts.bg === "diagonal") parts.push(diagonalLayer(w, h, sw));
  else if (opts.bg === "both") {
    parts.push(gridLayer(w, h, sw));
    parts.push(diagonalLayer(w, h, sw, 0.04));
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
      `<text x="${r(cx)}" y="${r(sy)}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="${r(sloganSize)}" letter-spacing="${r(sloganSize * 0.32)}" fill="${C.cyan}">MODERN ENGINEERING WITH NEON SOUL</text>`
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
  .thumb:hover .open,.thumb:focus-visible .open{opacity:1}
  figcaption{display:flex;align-items:center;justify-content:space-between;
    padding:10px 12px;font-family:var(--mono);font-size:.78rem}
  .dims{color:var(--grey);letter-spacing:.03em}
  .dl{display:flex;gap:8px}
  .dl a{color:var(--muted);text-decoration:none;border:1px solid var(--line);
    padding:3px 8px;letter-spacing:.05em;transition:color .15s,border-color .15s}
  .dl a:hover{color:var(--cyan);border-color:var(--cyan)}
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
