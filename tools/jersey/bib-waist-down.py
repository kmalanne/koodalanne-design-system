#!/usr/bin/env python3
"""Bib shorts with the jersey camo across the whole body from the waist down.

The solid neon leg cuffs and the two K logos are left untouched; every other
piece of shorts fabric below the waist seam takes the jersey's digital camo,
modulated by the garment's own shading so seams, folds and the crotch shadow
still read correctly.
"""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
import scipy.ndimage as ndi

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "assets/merch/cycling-kit"
JERSEY = DIR / "jersey/jersey-hv-light.png"
BIB = DIR / "bib/bib-hv-light.png"
DST = DIR / "bib/bib-hv-light-camo-waist-down.png"

# Two clean camo strips either side of the jersey zipper, below the chest K logo.
# Joined they cover the whole shorts in one piece, so nothing visibly repeats.
STRIP_A = (335, 480, 590, 1080)   # x0, y0, x1, y1 - left of the zipper
STRIP_B = (645, 480, 930, 1080)   # right of the zipper
WAIST = 768                   # seam where the mesh bib upper meets the lycra shorts
CUFF_SEARCH = 1315            # colour below this row belongs to the solid cuffs
DARK = 45                     # fabric is darker than the studio halo around it
RIM = 56                      # rim-lit silhouette edge, still garment not halo
SEED = (330, 700, 900, 1100)  # x0, x1, y0, y1 box that is certainly shorts fabric


def colored_pair(im):
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    bright = np.clip(im.max(-1) / 70.0, 0, 1)
    wp = np.clip((r - g) / 45.0, 0, 1) * np.clip((b - g) / 30.0, 0, 1) * bright
    wc = np.clip((g - r) / 45.0, 0, 1) * np.clip((b - r) / 45.0, 0, 1) * bright
    return wp, wc


def colored_weight(im):
    return np.maximum(*colored_pair(im))


def cuff_ceiling(colored, H, W):
    """Row index, per column, where the solid cuff starts (H if there is none)."""
    cuff = (colored > 0.3)
    cuff[:CUFF_SEARCH] = False
    top = np.full(W, H, np.int32)
    for x in range(W):
        ys = np.flatnonzero(cuff[:, x])
        if ys.size:
            top[x] = ys.min()
    # Smooth so a stray pixel cannot punch a notch into the ceiling.
    return ndi.minimum_filter1d(top, 9)


def build_mask(L, colored):
    H, W = L.shape
    yy, xx = np.mgrid[0:H, 0:W]
    top = cuff_ceiling(colored, H, W)
    below_cuff = yy >= top[None, :] - 3

    region = (L < DARK) & (yy >= WAIST) & ~below_cuff
    region = ndi.binary_closing(region, iterations=3)
    region = ndi.binary_fill_holes(region)

    # Keep only what is connected to the known shorts-fabric seed, which drops
    # the dark background strips running down the far left/right of the frame.
    lbl, n = ndi.label(region)
    x0, x1, y0, y1 = SEED
    seeds = np.unique(lbl[y0:y1, x0:x1])
    mask = np.isin(lbl, [s for s in seeds if s != 0])
    mask = ndi.binary_opening(mask, iterations=2)
    mask = ndi.binary_fill_holes(mask)

    # Reach out to the rim-lit silhouette edge, which is too bright for DARK.
    grow = ndi.binary_dilation(mask, iterations=5) & (L < RIM) & (yy >= WAIST) & ~below_cuff
    mask = mask | grow

    # Blur-and-threshold to regularise the serrated boundary the thresholds leave.
    soft = ndi.gaussian_filter(mask.astype(np.float32), 3.0)
    mask = soft > 0.5
    return ndi.binary_fill_holes(mask)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--debug", action="store_true", help="also write a mask overlay")
    args = ap.parse_args()

    bib = np.asarray(Image.open(BIB).convert("RGB")).astype(np.float32)
    jersey = np.asarray(Image.open(JERSEY).convert("RGB")).astype(np.float32)
    H, W, _ = bib.shape
    yy, xx = np.mgrid[0:H, 0:W]
    L = 0.299 * bib[..., 0] + 0.587 * bib[..., 1] + 0.114 * bib[..., 2]

    colored = colored_weight(bib)
    mask = build_mask(L, colored)

    if args.debug:
        ov = bib.copy()
        ov[..., 1] = np.where(mask, 255, ov[..., 1])
        Image.fromarray(ov.clip(0, 255).astype(np.uint8)).save("/tmp/diag_mask.png")

    # Shading: local mean brightness of the masked fabric, so the camo keeps the
    # garment's form. Unclamped at the low end, so the crotch shadow stays dark.
    # The neon K glyphs are excluded, or they would drag the local mean up and
    # burn a dark halo into the camo around each logo.
    m = (mask & (colored < 0.15)).astype(np.float32)
    num = ndi.gaussian_filter(L * m, 60)
    den = ndi.gaussian_filter(m, 60)
    base = np.where(den > 1e-3, num / (den + 1e-6), np.median(L[mask]))
    shade = np.clip(L / (base + 1e-6), 0.0, 1.7)

    ax0, ay0, ax1, ay1 = STRIP_A
    bx0, by0, bx1, by1 = STRIP_B
    camo = np.concatenate(
        [jersey[ay0:ay1, ax0:ax1], jersey[by0:by1, bx0:bx1]], axis=1
    )
    # Divide out the jersey's own lighting so only the pattern carries over.
    # Normalise on the mean, not the median: the sheet is mostly black fabric, so
    # its median sits far below the local mean and would dim the whole pattern.
    cl = 0.299 * camo[..., 0] + 0.587 * camo[..., 1] + 0.114 * camo[..., 2]
    camo = camo * (cl.mean() / (ndi.gaussian_filter(cl, 90) + 1e-6))[..., None]

    # Anchor the camo's pink and cyan onto the bib's own solid cuff colours, so
    # the pattern and the cuffs read as the same ink.
    cuff = bib[1330:1450]
    cwp, cwc = colored_pair(cuff)
    jwp, jwc = colored_pair(camo)
    gain = np.ones_like(camo)
    for cw_, jw_ in ((cwp, jwp), (cwc, jwc)):
        target = np.median(cuff[cw_ > 0.6], axis=0)
        have = np.median(camo[jw_ > 0.6], axis=0)
        gain += np.clip(jw_, 0, 1)[..., None] * (target / np.maximum(have, 1.0) - 1.0)
    camo = camo * gain

    ch, cw, _ = camo.shape
    ys, xs = np.where(mask)
    patt = camo[(yy - ys.min()) % ch, (xx - xs.min()) % cw] * shade[..., None]

    alpha = np.asarray(
        Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.4))
    ).astype(np.float32) / 255.0
    # Hard-keep the K glyphs and the cuff colour.
    keep = ndi.binary_dilation(colored > 0.25, iterations=3)
    alpha = np.clip(alpha, 0, 1) * (1 - keep)

    a = alpha[..., None]
    out = bib * (1 - a) + patt * a
    Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8)).save(DST)
    print("wrote", DST.relative_to(ROOT))


if __name__ == "__main__":
    main()
