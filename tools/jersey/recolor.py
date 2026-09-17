#!/usr/bin/env python3
"""Recolor the pink/cyan regions of the base jersey (temp.png) into brand pairs.

Only the pink and cyan camo pixels are remapped; black/grey fabric, zipper and
shading are preserved by keeping each pixel's relative brightness (HSV value)
and specular desaturation, then re-anchoring the strong-colour median onto the
target hue/saturation/value.
"""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]

# (name, pink hex, cyan hex)
PAIRS = [
    ("jersey-neon",     "#f890e7", "#0bd3d3"),  # brand pink 300 / cyan 300
    ("jersey-hv-light", "#ff7ad4", "#5cffef"),  # pink-hv 200 / cyan-hv 200
    ("jersey-hv",       "#ff2ec4", "#00f0dc"),  # pink-hv 300 / cyan-hv 300
    ("jersey-hv-deep",  "#e21ba0", "#00c2b2"),  # pink-hv 400 / cyan-hv 400
]


def hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def rgb_to_hsv(rgb):  # rgb in 0..1, returns h,s,v each 0..1
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1)
    mn = rgb.min(-1)
    d = mx - mn
    s = np.where(mx > 0, d / np.where(mx == 0, 1, mx), 0)
    h = np.zeros_like(mx)
    nz = d > 1e-6
    rc = np.where(nz, (mx - r) / np.where(nz, d, 1), 0)
    gc = np.where(nz, (mx - g) / np.where(nz, d, 1), 0)
    bc = np.where(nz, (mx - b) / np.where(nz, d, 1), 0)
    h = np.where(mx == r, bc - gc, np.where(mx == g, 2 + rc - bc, 4 + gc - rc))
    h = (h / 6.0) % 1.0
    return h, s, mx


def hsv_to_rgb(h, s, v):
    i = np.floor(h * 6).astype(int)
    f = h * 6 - i
    p = v * (1 - s)
    q = v * (1 - f * s)
    t = v * (1 - (1 - f) * s)
    i = i % 6
    out = np.zeros(h.shape + (3,), np.float32)
    conds = [
        (i == 0, (v, t, p)),
        (i == 1, (q, v, p)),
        (i == 2, (p, v, t)),
        (i == 3, (p, q, v)),
        (i == 4, (t, p, v)),
        (i == 5, (v, p, q)),
    ]
    for cond, (rr, gg, bb) in conds:
        out[cond] = np.stack([rr, gg, bb], -1)[cond]
    return out


def strip_glow(rgb01, keep_below=0.0):
    """Neutralise the coloured background halo, keeping only bright saturated
    garment marks (cuffs/logos). Everything else is desaturated to its luma so
    the studio lighting gradient stays but the pink/cyan glow disappears.

    ``keep_below`` limits protection to the lower fraction of the frame, so a
    mid-frame halo that is photometrically identical to a cuff is still removed.
    """
    im = rgb01
    mx = im.max(-1)
    mn = im.min(-1)
    sat = (mx - mn) / np.clip(mx, 1e-6, None)
    colored = np.clip((sat - 0.35) / 0.15, 0, 1)
    protect = colored * np.clip((mx - 110 / 255) / (50 / 255), 0, 1)
    if keep_below > 0:
        h = im.shape[0]
        rows = np.arange(h)[:, None] / h
        region = np.clip((rows - (keep_below - 0.03)) / 0.03, 0, 1)
        protect = protect * region
    luma = 0.299 * im[..., 0] + 0.587 * im[..., 1] + 0.114 * im[..., 2]
    gray = np.repeat(luma[..., None], 3, -1)
    p = protect[..., None]
    return im * p + gray * (1 - p)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--src", default="temp.png", help="base image (relative to repo root)")
    ap.add_argument("--out", default="assets/jersey", help="output dir (relative to repo root)")
    ap.add_argument("--prefix", default="jersey", help="output filename prefix")
    ap.add_argument("--remove-glow", action="store_true", help="neutralise the coloured background halo")
    ap.add_argument("--glow-keep-below", type=float, default=0.0,
                    help="only protect coloured marks below this height fraction (0=whole frame)")
    args = ap.parse_args()

    src = ROOT / args.src
    out_dir = ROOT / args.out
    out_dir.mkdir(parents=True, exist_ok=True)
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    if args.remove_glow:
        # Strip the halo on the source while it is still dark/subtle, so the
        # vivid recolour cannot re-inflate it back above the protect threshold.
        im = strip_glow(im / 255.0, keep_below=args.glow_keep_below) * 255.0
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mx = im.max(-1)

    # Soft membership weights (mutually exclusive by sign of r-g).
    bright = np.clip(mx / 70.0, 0, 1)
    w_pink = np.clip((r - g) / 45.0, 0, 1) * np.clip((b - g) / 30.0, 0, 1) * bright
    w_cyan = np.clip((g - r) / 45.0, 0, 1) * np.clip((b - r) / 45.0, 0, 1) * bright

    hsv = rgb_to_hsv(im / 255.0)
    ph, ps, pv = hsv  # per-pixel hue, sat, value

    for name, pink_hex, cyan_hex in PAIRS:
        out = im.copy() / 255.0
        for weight, target in ((w_pink, pink_hex), (w_cyan, cyan_hex)):
            strong = weight > 0.6
            if not strong.any():
                continue
            ref_s = np.median(ps[strong])
            ref_v = np.median(pv[strong])
            th, ts, tv = rgb_to_hsv((hex_rgb(target) / 255.0)[None, None, :])
            th, ts, tv = float(th.ravel()[0]), float(ts.ravel()[0]), float(tv.ravel()[0])

            new_h = np.full_like(ph, th)
            new_s = np.clip(ts * (ps / max(ref_s, 1e-3)), 0, 1)
            new_v = np.clip(pv * (tv / max(ref_v, 1e-3)), 0, 1)
            recolored = hsv_to_rgb(new_h, new_s, new_v)

            w = weight[..., None]
            out = out * (1 - w) + recolored * w

        img = Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8))
        suffix = name.split("jersey", 1)[-1]
        dst = out_dir / f"{args.prefix}{suffix}.png"
        img.save(dst)
        print("wrote", dst.relative_to(ROOT))


if __name__ == "__main__":
    main()
