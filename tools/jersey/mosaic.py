#!/usr/bin/env python3
"""Compose the four colour variants into a 2x2 grid of jersey+bib combos."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]

VARIANTS = ["neon", "hv-light", "hv", "hv-deep"]  # reading order in the 2x2 grid
BG = (0, 0, 0)
GARMENT_H = 760      # shared garment height
PAIR_GAP = 32        # gap between jersey and bib within a combo
COMBO_GAP = 96       # gap between the two combos in a row/column
MARGIN = 80          # outer margin


def scaled(path, h):
    im = Image.open(path).convert("RGB")
    w = round(im.width * h / im.height)
    return im.resize((w, h), Image.LANCZOS)


def make_combo(variant):
    jersey = scaled(ROOT / f"assets/jersey/jersey-{variant}.png", GARMENT_H)
    bib = scaled(ROOT / f"assets/bib/bib-{variant}.png", GARMENT_H)
    w = jersey.width + PAIR_GAP + bib.width
    combo = Image.new("RGB", (w, GARMENT_H), BG)
    combo.paste(jersey, (0, 0))
    combo.paste(bib, (jersey.width + PAIR_GAP, 0))
    return combo


def main():
    combos = [make_combo(v) for v in VARIANTS]
    cell_w = max(c.width for c in combos)
    cell_h = GARMENT_H

    canvas_w = MARGIN * 2 + cell_w * 2 + COMBO_GAP
    canvas_h = MARGIN * 2 + cell_h * 2 + COMBO_GAP
    canvas = Image.new("RGB", (canvas_w, canvas_h), BG)

    for i, combo in enumerate(combos):
        row, col = divmod(i, 2)
        cell_x = MARGIN + col * (cell_w + COMBO_GAP)
        cell_y = MARGIN + row * (cell_h + COMBO_GAP)
        x = cell_x + (cell_w - combo.width) // 2  # centre combo in its cell
        canvas.paste(combo, (x, cell_y))

    dst = ROOT / "assets" / "kit-mosaic.png"
    canvas.save(dst)
    print("wrote", dst.relative_to(ROOT), canvas.size)


if __name__ == "__main__":
    main()
