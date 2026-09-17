#!/usr/bin/env python3
"""Compose the hv-light jersey and the camo bib side by side, kit-mosaic style."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "assets/merch/cycling-kit"

BG = (0, 0, 0)
GARMENT_H = 760
PAIR_GAP = 32
MARGIN = 80

PIECES = [
    DIR / "jersey/jersey-hv-light.png",
    DIR / "jersey/jersey-hv-light-back.png",
    DIR / "bib/bib-hv-light-camo-waist-down.png",
]
DST = DIR / "kit-hv-light-camo.png"


def scaled(path, h):
    im = Image.open(path).convert("RGB")
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def main():
    garments = [scaled(p, GARMENT_H) for p in PIECES]
    width = sum(g.width for g in garments) + PAIR_GAP * (len(garments) - 1)
    canvas = Image.new("RGB", (MARGIN * 2 + width, MARGIN * 2 + GARMENT_H), BG)

    x = MARGIN
    for g in garments:
        canvas.paste(g, (x, MARGIN))
        x += g.width + PAIR_GAP

    canvas.save(DST)
    print("wrote", DST.relative_to(ROOT), canvas.size)


if __name__ == "__main__":
    main()
