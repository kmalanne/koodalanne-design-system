#!/usr/bin/env bash
#
# build-standalone.sh
# -------------------------------------------------------------------------
# Assembles a self-contained, deployable copy of the "website-final" site into
# the ./standalone directory. The contents of ./standalone can be dropped
# into any static host (or another repository) and will work on their own —
# no references outside the folder.
#
# It copies the parts that change most often (website-final pages + the design
# system tokens/components/motion/patterns and the referenced logo/mascot
# assets) and rewrites the "../design-system/" paths to "design-system/"
# so the folder works as a web root.
#
# Re-run this script whenever website-final or the design system changes.
# -------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$ROOT/website-final"
DS="$ROOT/design-system"
OUT="$ROOT/standalone"

# Files copied from website-final/ (site pages, styles, images, crawl files).
WEBSITE_FILES=(
  index.html
  cv.html
  site.css
  cv.css
  portrait.jpg
  robots.txt
  sitemap.xml
)

# Design-system files the site actually references.
DS_FILES=(
  tokens/tokens.css
  components/components.css
  motion/motion.css
  patterns/patterns.css
  logo/favicon.svg
  logo/icon.svg
  logo/wordmark.svg
  logo/wordmark-ink.svg
  logo/og-image.png
  mascot/bike-alt.svg
)

echo "→ Rebuilding standalone site at: $OUT"

# Copy a file, minifying it first when it is a stylesheet.
# The minifier is conservative: it strips comments and collapses whitespace,
# but preserves single spaces between tokens so value expressions such as
# `calc(100% - 10px)` and shorthand lists keep their meaning.
copy_asset() {
  local src="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  if [[ "$src" == *.css ]]; then
    perl -0777 -pe '
      s{/\*.*?\*/}{}gs;         # strip /* comments */
      s/\s+/ /g;                # collapse all whitespace to single spaces
      s/\s*([{}:;,>~])\s*/$1/g; # trim space around structural characters
      s/;}/}/g;                 # drop the last semicolon in a block
      s/^\s+//; s/\s+$//;       # trim file ends
    ' "$src" > "$dest"
  else
    cp "$src" "$dest"
  fi
}

# Inline the render-blocking stylesheets into a page's <head> as a single
# <style> block, removing the individual <link rel="stylesheet"> tags. This
# takes the same-origin CSS off the critical request path so first paint no
# longer waits on extra round-trips (improves FCP/LCP). The font <link>s start
# with `href` (not `rel`) and are deliberately left untouched so they keep
# loading asynchronously. Pass the minified CSS files in cascade order.
inline_css() {
  local html="$1"; shift
  KD_STYLE="<style>$(cat "$@")</style>" perl -0777 -i -pe '
    s{(?:[ \t]*<link rel="stylesheet"[^>]*>\s*)+}{$ENV{KD_STYLE} . "\n"}e;
  ' "$html"
}

# 1. Clean output (keep the folder itself if it is tracked).
rm -rf "$OUT"
mkdir -p "$OUT/design-system"

# 2. Copy website-final files.
for f in "${WEBSITE_FILES[@]}"; do
  if [[ ! -f "$SRC/$f" ]]; then
    echo "  ! missing website-final/$f" >&2
    exit 1
  fi
  copy_asset "$SRC/$f" "$OUT/$f"
  echo "  + $f"
done

# 3. Copy design-system files.
for f in "${DS_FILES[@]}"; do
  if [[ ! -f "$DS/$f" ]]; then
    echo "  ! missing design-system/$f" >&2
    exit 1
  fi
  copy_asset "$DS/$f" "$OUT/design-system/$f"
  echo "  + design-system/$f"
done

# 4. Rewrite "../design-system/" -> "design-system/" in the copied HTML so
#    the standalone folder works as a web root. cv.html also links the footer
#    mascot bike to the hidden "Rider Mode" site, which lives at /ride/.
#    (perl -i is portable across macOS/BSD and GNU/Linux, unlike `sed -i`.)
for f in index.html cv.html; do
  perl -pi -e 's{\.\./design-system/}{design-system/}g; s{\.\./website-alternative/}{ride/}g' "$OUT/$f"
done

# 5. Inline the design-system + page stylesheets into each page so no CSS is
#    render-blocking on first load.
DS_CSS=(
  "$OUT/design-system/tokens/tokens.css"
  "$OUT/design-system/components/components.css"
  "$OUT/design-system/motion/motion.css"
  "$OUT/design-system/patterns/patterns.css"
)
inline_css "$OUT/index.html" "${DS_CSS[@]}" "$OUT/site.css"
inline_css "$OUT/cv.html" "${DS_CSS[@]}" "$OUT/cv.css"
echo "  ~ inlined CSS into index.html and cv.html"

# 6. Alternative "Rider's Dispatches" site → $OUT/ride (the easter egg).
#    Reached only from the CV footer bike. Kept out of search via per-page
#    noindex + a nofollow entry link + no sitemap entry. The heavy galleries
#    (wallpapers, sprite sheets) are served from GitHub Pages, so only the
#    inline scene images the ride pages embed are bundled here.
ALT="$ROOT/website-alternative"
RIDE="$OUT/ride"
echo "→ Bundling the hidden Rider Mode site at: $RIDE"
mkdir -p "$RIDE/notes"

# 6a. Pages, script and photo, copied verbatim.
for f in index.html 404.html rider.js portrait.jpg; do
  if [[ ! -f "$ALT/$f" ]]; then echo "  ! missing website-alternative/$f" >&2; exit 1; fi
  cp "$ALT/$f" "$RIDE/$f"
done
for f in "$ALT"/notes/*.html; do
  cp "$f" "$RIDE/notes/$(basename "$f")"
done
echo "  + ride/ pages + notes"

# 6b. Scene images the ride pages embed (galleries stay on GitHub Pages).
mkdir -p "$OUT/assets/sprite-sheets/scenes"
cp "$ROOT"/assets/sprite-sheets/scenes/*.png "$OUT/assets/sprite-sheets/scenes/"
echo "  + assets/sprite-sheets/scenes ($(ls "$ROOT"/assets/sprite-sheets/scenes/*.png | wc -l | tr -d ' ') images)"

# 6c. Minify the page stylesheet (used only as an inlining source below).
copy_asset "$ALT/site.css" "$RIDE/site.css"

# 6d. website-final now sits at the web root, one level up from /ride/.
for f in "$RIDE/index.html" "$RIDE/404.html"; do
  perl -pi -e 's{\.\./website-final/}{../}g' "$f"
done

# 6e. Inline tokens + page CSS into every ride page so nothing is render-blocking.
for f in "$RIDE/index.html" "$RIDE/404.html" "$RIDE"/notes/*.html; do
  inline_css "$f" "$OUT/design-system/tokens/tokens.css" "$RIDE/site.css"
done
rm -f "$RIDE/site.css"
echo "  ~ inlined CSS into ride pages"

echo "✓ Standalone build complete."
echo "  Deploy the CONTENTS of $OUT as your web root."
