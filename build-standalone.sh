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
  logo/og-image.png
  mascot/bike-alt.svg
)

echo "→ Rebuilding standalone site at: $OUT"

# 1. Clean output (keep the folder itself if it is tracked).
rm -rf "$OUT"
mkdir -p "$OUT/design-system"

# 2. Copy website-final files.
for f in "${WEBSITE_FILES[@]}"; do
  if [[ ! -f "$SRC/$f" ]]; then
    echo "  ! missing website-final/$f" >&2
    exit 1
  fi
  mkdir -p "$OUT/$(dirname "$f")"
  cp "$SRC/$f" "$OUT/$f"
  echo "  + $f"
done

# 3. Copy design-system files.
for f in "${DS_FILES[@]}"; do
  if [[ ! -f "$DS/$f" ]]; then
    echo "  ! missing design-system/$f" >&2
    exit 1
  fi
  mkdir -p "$OUT/design-system/$(dirname "$f")"
  cp "$DS/$f" "$OUT/design-system/$f"
  echo "  + design-system/$f"
done

# 4. Rewrite "../design-system/" -> "design-system/" in the copied HTML so
#    the standalone folder works as a web root. (perl -i is portable across
#    macOS/BSD and GNU/Linux, unlike `sed -i`.)
for f in index.html cv.html; do
  perl -pi -e 's{\.\./design-system/}{design-system/}g' "$OUT/$f"
done

echo "✓ Standalone build complete."
echo "  Deploy the CONTENTS of $OUT as your web root."
