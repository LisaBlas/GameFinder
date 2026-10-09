"""Rebuild the relic frame rasters as non-stretching 9-slices.

The generated frame sources are square, with ornaments in the corners (and, on
the panel frame, a diamond mid-way along each side). Used directly as a
9-slice, the side ornaments and the grainy rail fill get stretched as the panel
grows. This script writes:

  * <name>-9slice.webp: corners keep the full ornament; edges are the source
    rail averaged along its length, so stretching them is lossless and clean.
  * panel-frame-diamond-{top,right,bottom,left}.webp: the side ornaments,
    placed at natural size by CSS instead of being stretched.

Assets are written at 2x the CSS size. Keep the CSS slice/width values in
client/src/styles/kmap-relic.css in sync with the constants printed below.

Usage: python scripts/build-relic-frames.py   (needs Pillow + numpy)
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RASTER = ROOT / "client/src/assets/ui/relic/raster"
SOURCES = ROOT / "design/sources/ui/relic/raster"  # high-res originals, not bundled
WORK = 1024  # source art is normalised to this size before measuring

# name, corner size (work px), CSS corner size (px), rows to average (skip mid ornaments)
FRAMES = [
    ("panel-frame", 288, 88, [(300, 440), (590, 724)]),
]
FEATHER = 40  # work px: corner crop fades into the averaged rail


def load(name):
    im = Image.open(SOURCES / f"{name}-source.png").convert("RGBA")
    a = np.asarray(im.resize((WORK, WORK), Image.LANCZOS)).astype(np.float64) / 255
    a[..., :3] *= a[..., 3:]  # premultiply so averaging doesn't fringe
    return a


def unpremultiply(a):
    out = a.copy()
    alpha = out[..., 3:]
    out[..., :3] = np.where(alpha > 1e-4, out[..., :3] / np.maximum(alpha, 1e-4), 0)
    return Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8), "RGBA")


def side_profiles(a, c, spans):
    """Mean cross-section of each rail, shape (c, 4), outer edge first."""
    rows = np.concatenate([np.arange(s, e) for s, e in spans])
    left = a[rows, :c].mean(0)
    right = a[rows, WORK - c:][:, ::-1].mean(0)
    top = a[:c, rows].mean(1)
    bottom = a[WORK - c:, rows][::-1].mean(1)
    return top, right, bottom, left


def build_9slice(a, c, spans):
    top, right, bottom, left = side_profiles(a, c, spans)
    mid = 16
    size = 2 * c + mid
    out = np.zeros((size, size, 4))

    # Uniform rails along the full length; corners are pasted over them.
    out[:c, :] = top[:, None]
    out[size - c:, :] = bottom[::-1][:, None]
    out[:, :c] = left[None, :]
    out[:, size - c:] = right[::-1][None, :]

    # Corners: source art, faded into the uniform rails over FEATHER px so the
    # grainy fill doesn't end on a hard seam. Towards the slice's inner x edge
    # the corner hands over to the top/bottom rail; towards its inner y edge,
    # to the left/right rail.
    ramp = np.clip((c - np.arange(c)) / FEATHER, 0, 1)  # 1 inside, 0 at slice edge
    for flip_y in (False, True):
        for flip_x in (False, True):
            ys = slice(WORK - c, WORK) if flip_y else slice(0, c)
            xs = slice(WORK - c, WORK) if flip_x else slice(0, c)
            oy = slice(size - c, size) if flip_y else slice(0, c)
            ox = slice(size - c, size) if flip_x else slice(0, c)
            w_y = (ramp[::-1] if flip_y else ramp)[:, None, None]
            w_x = (ramp[::-1] if flip_x else ramp)[None, :, None]
            h_rail = (bottom[::-1] if flip_y else top)[:, None, :]
            v_rail = (right[::-1] if flip_x else left)[None, :, :]
            out[oy, ox] = a[ys, xs] * w_x * w_y + h_rail * (1 - w_x) * w_y + v_rail * (1 - w_y)
    return out


def diamond(a, c, side):
    """Crop the mid-side ornament with feathered ends along the rail."""
    span, depth = 150, c  # work px along / across the rail
    lo, hi = WORK // 2 - span // 2, WORK // 2 + span // 2
    if side == "left":
        crop = a[lo:hi, :depth]
    elif side == "right":
        crop = a[lo:hi, WORK - depth:]
    elif side == "top":
        crop = a[:depth, lo:hi]
    else:
        crop = a[WORK - depth:, lo:hi]
    crop = crop.copy()
    f = np.clip(np.minimum(np.arange(span), span - 1 - np.arange(span)) / 24, 0, 1)
    if side in ("left", "right"):
        crop *= f[:, None, None]
    else:
        crop *= f[None, :, None]
    return crop


def save(arr, path, scale):
    im = unpremultiply(arr)
    w, h = im.size
    im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    im.save(path, "WEBP", quality=90, method=6)
    return im.size


def main():
    for name, c, css_corner, spans in FRAMES:
        a = load(name)
        scale = 2 * css_corner / c
        size = save(build_9slice(a, c, spans), RASTER / f"{name}-9slice.webp", scale)
        print(f"{name}-9slice.webp {size}: border-image-slice {round(c * scale)}, border-width {css_corner}px")
        if name == "panel-frame":
            for side in ("top", "right", "bottom", "left"):
                s = save(diamond(a, c, side), RASTER / f"panel-frame-diamond-{side}.webp", scale)
                print(f"  panel-frame-diamond-{side}.webp {s} -> {s[0] / 2}x{s[1] / 2}px")


if __name__ == "__main__":
    main()
