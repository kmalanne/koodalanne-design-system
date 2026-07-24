#!/usr/bin/env node
/* =========================================================================
   brandos — the koodalanne Brand Linter
   -------------------------------------------------------------------------
   Turns the Brand Doctrine into enforceable checks. Zero dependencies.
   Usage:
     node tools/brandos/brandos.mjs [file.html ...]
     node tools/brandos/brandos.mjs            # lints the default page set
   Exit code 0 if every file passes (>= 90, "AA"), 1 otherwise.
   ========================================================================= */

import { readFileSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";

const ROOT = resolve(new URL("../..", import.meta.url).pathname);

const DEFAULT_FILES = [
  "website2/index.html",
  "website2/cv.html",
  "website/index.html",
];

// Words that signal marketing noise instead of evidence (Copy Smells).
const BUZZWORDS = [
  "leverage", "synergy", "disrupt", "disruptive", "cutting-edge", "bleeding-edge",
  "world-class", "best-in-class", "seamless", "innovative", "revolutionary",
  "game-changer", "game changer", "paradigm", "turnkey", "passionate",
  "ninja", "rockstar", "guru", "thought leader", "next-gen", "next generation",
  "supercharge", "unlock your", "empowering", "holistic",
];

// ---- tiny HTML helpers (regex-based; good enough for our own static pages) --
const stripBlocks = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");

const visibleText = (html) =>
  stripBlocks(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&mdash;|&ndash;/g, "-")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const textOf = (frag) =>
  frag
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;/g, "’").replace(/&mdash;/g, "—").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const wordCount = (s) => (s.match(/[A-Za-z0-9'’-]+/g) || []).length;

// ---- checks: each returns { weight, pass, detail } ------------------------
function checkLangAndTitle(html) {
  const lang = /<html[^>]*\blang=/i.test(html);
  const title = /<title>[^<]+<\/title>/i.test(html);
  const meta = /<meta[^>]+name=["']description["'][^>]*>/i.test(html);
  return [
    { id: "html-lang", weight: 5, pass: lang, detail: lang ? "lang set" : "missing <html lang>" },
    { id: "title", weight: 5, pass: title, detail: title ? "title present" : "missing <title>" },
    { id: "meta-description", weight: 10, pass: meta, detail: meta ? "present" : "missing meta description" },
  ];
}

function checkH1(html) {
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => textOf(m[1]));
  const one = h1s.length === 1;
  const words = one ? wordCount(h1s[0]) : 0;
  return [
    { id: "single-h1", weight: 10, pass: one, detail: `${h1s.length} <h1> found` },
    {
      id: "headline-length", weight: 15, pass: one && words <= 8,
      detail: one ? `headline is ${words} words (max 8): “${h1s[0]}”` : "no single headline to measure",
    },
  ];
}

function checkHeadingOrder(html) {
  const levels = [...html.matchAll(/<h([1-6])[^>]*>/gi)].map((m) => Number(m[1]));
  let ok = true, offender = null, prev = 0;
  for (const l of levels) {
    if (prev && l > prev + 1) { ok = false; offender = `h${prev} → h${l}`; break; }
    prev = l;
  }
  return [{ id: "heading-order", weight: 10, pass: ok, detail: ok ? "no skipped levels" : `skipped: ${offender}` }];
}

function checkPrimaryCta(html) {
  const n = (html.match(/kd-btn--primary/g) || []).length;
  return [{ id: "single-primary-cta", weight: 15, pass: n <= 1, detail: `${n} primary CTA(s) (max 1)` }];
}

function checkImgAlt(html) {
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const missing = imgs.filter((t) => !/\balt=/.test(t));
  return [{ id: "img-alt", weight: 10, pass: missing.length === 0, detail: `${missing.length}/${imgs.length} <img> missing alt` }];
}

function checkBuzzwords(html) {
  const text = " " + visibleText(html).toLowerCase() + " ";
  const hits = BUZZWORDS.filter((w) => text.includes(" " + w + " ") || text.includes(" " + w + ".") || text.includes(" " + w + ","));
  return [{ id: "buzzwords", weight: 20, pass: hits.length === 0, detail: hits.length ? `found: ${hits.join(", ")}` : "none" }];
}

function advisoryPassive(html) {
  const text = visibleText(html);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const passive = (text.match(/\b(is|are|was|were|been|be|being)\s+\w+(ed|en)\b/gi) || []).length;
  const pct = Math.round((passive / sentences) * 100);
  return { passive, sentences, pct };
}

const CHECKS = [checkLangAndTitle, checkH1, checkHeadingOrder, checkPrimaryCta, checkImgAlt, checkBuzzwords];

function lintFile(absPath) {
  const html = readFileSync(absPath, "utf8");
  const results = CHECKS.flatMap((fn) => fn(html));
  const total = results.reduce((a, r) => a + r.weight, 0);
  const earned = results.reduce((a, r) => a + (r.pass ? r.weight : 0), 0);
  const score = Math.round((earned / total) * 1000) / 10;
  const level = score >= 95 ? "AAA" : score >= 90 ? "AA" : score >= 80 ? "A" : "FAIL";
  return { results, score, level, advisory: advisoryPassive(html) };
}

// ---- global (repo-wide) checks -------------------------------------------
function globalChecks() {
  const motion = resolve(ROOT, "design-system/motion/motion.css");
  const reduced = existsSync(motion) && /prefers-reduced-motion/.test(readFileSync(motion, "utf8"));
  return [{ id: "reduced-motion", pass: reduced, detail: reduced ? "motion.css honours prefers-reduced-motion" : "no reduced-motion guard" }];
}

// ---- run ------------------------------------------------------------------
const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const files = (args.length ? args : DEFAULT_FILES).map((f) => resolve(ROOT, f)).filter(existsSync);

const C = { g: "\x1b[32m", r: "\x1b[31m", y: "\x1b[33m", d: "\x1b[2m", b: "\x1b[1m", x: "\x1b[0m" };
const mark = (p) => (p ? `${C.g}✓${C.x}` : `${C.r}✗${C.x}`);

console.log(`\n${C.b}brandos — koodalanne Brand Linter${C.x}\n`);

let worst = 100;
for (const abs of files) {
  const rel = relative(ROOT, abs);
  const { results, score, level, advisory } = lintFile(abs);
  worst = Math.min(worst, score);
  const badge = level === "FAIL" ? C.r : level === "A" ? C.y : C.g;
  console.log(`${C.b}${rel}${C.x}  ${badge}${score}% · ${level}${C.x}`);
  for (const r of results) console.log(`  ${mark(r.pass)} ${r.id.padEnd(18)} ${C.d}${r.detail}${C.x}`);
  console.log(`  ${C.d}· passive voice ~${advisory.pct}% (${advisory.passive}/${advisory.sentences} sentences, advisory)${C.x}\n`);
}

console.log(`${C.b}Global${C.x}`);
let globalPass = true;
for (const g of globalChecks()) { globalPass = globalPass && g.pass; console.log(`  ${mark(g.pass)} ${g.id.padEnd(18)} ${C.d}${g.detail}${C.x}`); }

const ok = worst >= 90 && globalPass;
console.log(`\n${C.b}Overall${C.x} ${ok ? C.g + "PASS" : C.r + "REVIEW"}${C.x} ${C.d}(lowest page ${worst}%, threshold 90% / AA)${C.x}\n`);
process.exit(ok ? 0 : 1);
