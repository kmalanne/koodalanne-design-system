#!/usr/bin/env python3
"""Drop the outer glow from a garment render, leaving a flat black background.

The garment is found by local texture energy (the camo print and seams are busy,
the studio glow is smooth), then the silhouette is closed into a solid shape and
everything outside it is faded to black.
"""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image
import scipy.ndimage as ndi

ROOT = Path(__file__).resolve().parents[2]

TEXTURE_WIN = 15   # window for the local std used to find printed fabric
TEXTURE_MIN = 6.0  # std above this counts as garment rather than smooth backdrop
EDGE_GROW = 3      # kept below the std window's inset, to cut the render's edge bloom


def disk(r):
    y, x = np.mgrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def silhouette(L):
    m1 = ndi.uniform_filter(L, TEXTURE_WIN)
    m2 = ndi.uniform_filter(L * L, TEXTURE_WIN)
    tex = np.sqrt(np.maximum(m2 - m1 * m1, 0)) > TEXTURE_MIN

    m = ndi.binary_fill_holes(ndi.binary_closing(tex, structure=disk(25)))
    lbl, n = ndi.label(m)
    sizes = ndi.sum(np.ones_like(lbl), lbl, range(1, n + 1))
    m = lbl == (1 + int(np.argmax(sizes)))
    m = ndi.binary_dilation(m, structure=disk(EDGE_GROW))
    return ndi.binary_fill_holes(ndi.binary_closing(m, structure=disk(20)))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("src", help="image to clean (relative to repo root)")
    ap.add_argument("--out", help="output path; defaults to overwriting src")
    args = ap.parse_args()

    src = ROOT / args.src
    dst = ROOT / (args.out or args.src)

    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    L = 0.299 * im[..., 0] + 0.587 * im[..., 1] + 0.114 * im[..., 2]

    mask = silhouette(L)
    alpha = ndi.gaussian_filter(mask.astype(np.float32), 1.5)
    out = im * np.clip(alpha, 0, 1)[..., None]

    Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8)).save(dst)
    print("wrote", dst.relative_to(ROOT))


if __name__ == "__main__":
    main()
