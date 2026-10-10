"""Cut the Wayfinder's centre gem out of a generated chassis source.

Writes two aligned square images:
  <name>-core-socket.webp  the top socket's housing, its stone desaturated
  <name>-core-stone.webp   the stone alone in greyscale, which CSS tints to the
                           discovered rarity (mix-blend-mode: color keeps facets)

    python scripts/build-wayfinder-core-gem.py --input design/sources/wayfinder-arcane-v3.png
        --out-dir client/src/assets/ui/wayfinder/arcane --name wayfinder-arcane
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageOps

SUPERSAMPLE = 4


def is_gem(red: int, green: int, blue: int, alpha: int) -> bool:
    return alpha > 200 and green > 70 and green > red * 1.5 and green > blue * 1.1


def gem_circle(source: Image.Image, near: tuple[float, float], search: float) -> tuple[float, float, float]:
    """Centre and radius from the green area's extent, not its centroid: the
    stone's pale top highlight would otherwise pull the centre upward."""
    pixels = source.load()
    x0, y0 = near
    points = [
        (x, y)
        for y in range(int(y0 - search), int(y0 + search) + 1)
        for x in range(int(x0 - search), int(x0 + search) + 1)
        if is_gem(*pixels[x, y])
    ]
    xs = sorted(p[0] for p in points)
    ys = sorted(p[1] for p in points)
    trim = len(points) // 200  # ignore stray enamel pixels
    left, right = xs[trim], xs[-1 - trim] + 1
    top, bottom = ys[trim], ys[-1 - trim] + 1
    return (left + right) / 2, (top + bottom) / 2, (right - left + bottom - top) / 4


def gold_free(crop: Image.Image) -> Image.Image:
    """Alpha that drops the housing's gold prongs where they overlap the stone."""
    mask = Image.new("L", crop.size)
    mask.putdata([
        0 if red > blue * 1.35 and red >= green * 0.92 and red > 70 else 255
        for red, green, blue, _ in crop.get_flattened_data()
    ])
    return mask


def disc(size: int, centre: tuple[float, float], radius: float) -> Image.Image:
    mask = Image.new("L", (size * SUPERSAMPLE, size * SUPERSAMPLE), 0)
    cx, cy, r = centre[0] * SUPERSAMPLE, centre[1] * SUPERSAMPLE, radius * SUPERSAMPLE
    ImageDraw.Draw(mask).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--name", required=True)
    # Fractions of the source width; defaults fit the Arcane top socket.
    parser.add_argument("--socket-distance", type=float, default=0.79)
    parser.add_argument("--socket-radius", type=float, default=0.098)
    parser.add_argument("--stone-grow", type=float, default=0.009)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    width = source.width
    half = width / 2
    socket_r = args.socket_radius * half
    gem_x, gem_y, stone_r = gem_circle(source, (half, half - args.socket_distance * half), socket_r * 0.85)
    centre = (gem_x, gem_y)
    # The stone's shadowed edge falls outside the bright green extent; the gold
    # mask keeps the wider cut off the prongs and bezel.
    stone_r += args.stone_grow * half

    # Square crop around the gem, on whole pixels so both outputs stay aligned.
    box_half = math.ceil(socket_r) + 2
    left, top = round(centre[0]) - box_half, round(centre[1]) - box_half
    crop = source.crop((left, top, left + 2 * box_half, top + 2 * box_half))
    size = crop.width
    local = (centre[0] - left, centre[1] - top)

    stone_mask = ImageChops.multiply(disc(size, local, stone_r), gold_free(crop))
    grey = ImageOps.autocontrast(crop.convert("L"), cutoff=1)
    grey_rgba = Image.merge("RGBA", (grey, grey, grey, crop.getchannel("A")))

    stone = grey_rgba.copy()
    stone.putalpha(ImageChops.multiply(crop.getchannel("A"), stone_mask))

    socket = crop.copy()
    socket.paste(grey_rgba, (0, 0), ImageChops.multiply(disc(size, local, stone_r + 1.5), gold_free(crop)))
    socket.putalpha(ImageChops.multiply(socket.getchannel("A"), disc(size, local, socket_r)))

    args.out_dir.mkdir(parents=True, exist_ok=True)
    socket.save(args.out_dir / f"{args.name}-core-socket.webp", "WEBP", quality=92, method=6)
    stone.save(args.out_dir / f"{args.name}-core-stone.webp", "WEBP", quality=92, method=6)
    print(f"Wrote {args.name} core gem: {size}px, stone r={stone_r:.1f} at ({gem_x:.1f}, {gem_y:.1f})")


if __name__ == "__main__":
    main()
