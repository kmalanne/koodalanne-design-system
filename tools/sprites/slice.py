#!/usr/bin/env python3
"""Slice sheet-3 into clean, tightly-cropped scene PNGs.

A uniform grid crop leaves thin "bleed" strips from neighbouring scenes near
the cell edges. To remove them we treat each cell's alpha as a mask, find its
connected components, keep the largest one (the scene / subject) plus any other
component that sits close to it (props like a toolbox or bottle), and drop the
rest (disconnected bleed strips). The result is cropped to that merged bbox.
"""
import os
from PIL import Image

BASE = os.path.abspath(os.path.dirname(__file__))
SHEETS_DIR = os.path.join(BASE, "..", "..", "assets", "sprite-sheets")
OUT = os.path.join(SHEETS_DIR, "scenes")

COLS, ROWS = 5, 4
INSET = 2
ALPHA = 30          # mask threshold
MIN_AREA = 400      # discard specks
MERGE = 14          # px: components within this of the main blob are kept

# Each sheet is a 5×4 grid of scenes with a wordmark strip below the last row.
SHEETS = [
    {
        "file": "sprite-sheet-3.png",
        "top": 6, "bottom": 952,
        "names": {
            (0, 0): "desk-day", (0, 1): "stand-bike", (0, 2): "couch", (0, 3): "sunset-beach", (0, 4): "fix-bike",
            (1, 0): "bench-city", (1, 1): "desktop-code", (1, 2): "whiteboard", (1, 3): "rain-walk", (1, 4): "desk-lamp",
            (2, 0): "cycle-dust", (2, 1): "campfire", (2, 2): "mountain-rock", (2, 3): "ferry", (2, 4): "bridge-dusk",
            (3, 0): "dual-monitor", (3, 1): "ground-laptop", (3, 2): "cafe", (3, 3): "gravel-path", (3, 4): "desk-night",
        },
    },
    {
        "file": "sprite-sheet-2.png",
        "top": 6, "bottom": 928,
        "names": {
            (0, 0): "deskside-plant", (0, 1): "beanbag-lamp", (0, 2): "architecture", (0, 3): "commute", (0, 4): "crossroads-bench",
            (1, 0): "sunset-bike", (1, 1): "desk-hanging-lamp", (1, 2): "chain-fix", (1, 3): "map-check", (1, 4): "night-city-desk",
            (2, 0): "train-window", (2, 1): "rug-laptop", (2, 2): "tent-campfire", (2, 3): "gravel-sign", (2, 4): "desk-daylight",
            (3, 0): "surfboard-beach", (3, 1): "guitar", (3, 2): "airport-lounge", (3, 3): "code-cave", (3, 4): "river-overlook",
        },
    },
]


def components(mask, w, h):
    """4-connected components via iterative flood fill."""
    seen = bytearray(w * h)
    comps = []
    for sy in range(h):
        base = sy * w
        for sx in range(w):
            idx = base + sx
            if not mask[idx] or seen[idx]:
                continue
            stack = [idx]
            seen[idx] = 1
            minx = maxx = sx
            miny = maxy = sy
            area = 0
            while stack:
                p = stack.pop()
                py, px = divmod(p, w)
                area += 1
                if px < minx: minx = px
                if px > maxx: maxx = px
                if py < miny: miny = py
                if py > maxy: maxy = py
                if px > 0 and mask[p - 1] and not seen[p - 1]:
                    seen[p - 1] = 1; stack.append(p - 1)
                if px < w - 1 and mask[p + 1] and not seen[p + 1]:
                    seen[p + 1] = 1; stack.append(p + 1)
                if py > 0 and mask[p - w] and not seen[p - w]:
                    seen[p - w] = 1; stack.append(p - w)
                if py < h - 1 and mask[p + w] and not seen[p + w]:
                    seen[p + w] = 1; stack.append(p + w)
            comps.append({"area": area, "box": (minx, miny, maxx + 1, maxy + 1)})
    return comps


def box_gap(a, b):
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    dx = max(bx0 - ax1, ax0 - bx1, 0)
    dy = max(by0 - ay1, ay0 - by1, 0)
    return max(dx, dy)


def union(a, b):
    return (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))


def trim_edge_bands(img):
    """Trim thin, sparse bands at the outer edges that are separated from the
    main mass by a real transparent gap (leftover bleed connected by a hair)."""
    w, h = img.size
    a = img.getchannel("A").load()
    GAP = 5            # consecutive near-empty lines that count as a real gap
    EMPTY = 0.02       # a line is "empty" below this coverage
    CORE = 0.12        # the dense body is above this coverage

    def cov_rows():
        return [sum(1 for x in range(w) if a[x, y] > ALPHA) / w for y in range(h)]

    def cov_cols():
        return [sum(1 for y in range(h) if a[x, y] > ALPHA) / h for x in range(w)]

    def bounds(cov):
        # densest core line, then walk outward until a real gap is crossed
        core = max(range(len(cov)), key=lambda i: cov[i])
        if cov[core] < CORE:
            return 0, len(cov)
        lo = core
        run = 0
        for i in range(core, -1, -1):
            run = run + 1 if cov[i] < EMPTY else 0
            if run < GAP:
                if cov[i] >= EMPTY:
                    lo = i
            else:
                break
        hi = core
        run = 0
        for i in range(core, len(cov)):
            run = run + 1 if cov[i] < EMPTY else 0
            if run < GAP:
                if cov[i] >= EMPTY:
                    hi = i
            else:
                break
        return lo, hi + 1

    y0, y1 = bounds(cov_rows())
    x0, x1 = bounds(cov_cols())
    if (x0, y0, x1, y1) != (0, 0, w, h):
        img = img.crop((x0, y0, x1, y1))
        bb = img.getbbox()
        if bb:
            img = img.crop(bb)
    return img


def slice_sheet(cfg):
    im = Image.open(os.path.join(SHEETS_DIR, cfg["file"])).convert("RGBA")
    W, H = im.size
    cw = W / COLS
    rh = (cfg["bottom"] - cfg["top"]) / ROWS

    for (r, c), name in cfg["names"].items():
        x0 = int(c * cw) + INSET
        y0 = int(cfg["top"] + r * rh) + INSET
        x1 = int((c + 1) * cw) - INSET
        y1 = int(cfg["top"] + (r + 1) * rh) - INSET
        cell = im.crop((x0, y0, x1, y1))
        w, h = cell.size
        alpha = cell.getchannel("A").tobytes()
        mask = bytes(1 if a > ALPHA else 0 for a in alpha)

        comps = [k for k in components(mask, w, h) if k["area"] >= MIN_AREA]
        if not comps:
            cell.save(os.path.join(OUT, name + ".png"))
            continue
        main_c = max(comps, key=lambda k: k["area"])
        box = main_c["box"]

        def is_prop(k):
            """A real prop (bottle, toolbox, plant) — not a thin bleed strip."""
            bx0, by0, bx1, by1 = k["box"]
            bw, bh = bx1 - bx0, by1 - by0
            if bw >= bh * 3:          # wide-and-flat = neighbour bleed strip
                return False
            return k["area"] >= 1500 and min(bw, bh) >= 18

        changed = True
        while changed:
            changed = False
            for k in comps:
                if k is main_c or k["box"] is None:
                    continue
                if is_prop(k) and box_gap(box, k["box"]) <= MERGE:
                    box = union(box, k["box"])
                    k["box"] = None
                    changed = True

        cropped = cell.crop(box)
        bb = cropped.getbbox()
        if bb:
            cropped = cropped.crop(bb)
        cropped = trim_edge_bands(cropped)
        cropped.save(os.path.join(OUT, name + ".png"))
        print(f"{name:18s} {cropped.size[0]}x{cropped.size[1]}")


def main():
    os.makedirs(OUT, exist_ok=True)
    for cfg in SHEETS:
        print(f"--- {cfg['file']} ---")
        slice_sheet(cfg)


if __name__ == "__main__":
    main()
