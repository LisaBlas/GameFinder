"""Build the Wayfinder's centre lens: three aligned square layers for .wayfinder-core.

  <name>-core-bezel.webp  the gold lip around the inner ring's opening, cut from
                          the inner layer so the lens frame matches the chassis
                          at any size (transparent hole)
  <name>-core-face.webp   a smoked-obsidian lens with a faint engraved star chart,
                          darkened towards the rim where it sits under the bezel
  <name>-core-rose.webp   an engraved compass rose (transparent). CSS spins it
                          while charting and locks its north point on the bearing

    python scripts/build-wayfinder-core.py
        --inner client/src/assets/ui/wayfinder/arcane/wayfinder-arcane-inner.webp
        --out-dir client/src/assets/ui/wayfinder/arcane --name wayfinder-arcane

The lip spans --lip-inner..--lip-outer as fractions of the inner layer's width
(measured from its radial alpha/brightness profile). CSS sizes the core to
2 * lip-outer of the chassis, so the bezel lands on the chassis lip on desktop.
"""

from __future__ import annotations

import argparse
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SIZE = 1024
SS = 4  # supersample for drawn line work


def radius_grid(size: int, cx: float = 0.5, cy: float = 0.5) -> np.ndarray:
    """Distance from (cx, cy) in units of the half-size (1.0 = image edge)."""
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32) + 0.5
    return np.hypot(xx / size - cx, yy / size - cy) * 2


def smoothstep(edge0: float, edge1: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)


def fbm(size: int, seed: int, octaves: int = 6) -> np.ndarray:
    """Smoky value noise in 0..1 from upsampled random grids."""
    rng = np.random.default_rng(seed)
    total = np.zeros((size, size), np.float32)
    amp, norm = 1.0, 0.0
    for octave in range(octaves):
        cells = 3 * 2 ** octave
        grid = Image.fromarray((rng.random((cells, cells)) * 255).astype(np.uint8))
        layer = np.asarray(grid.resize((size, size), Image.Resampling.BICUBIC), np.float32) / 255
        total += layer * amp
        norm += amp
        amp *= 0.55
    return total / norm


def build_bezel(inner_path: Path, lip_inner: float, lip_outer: float) -> Image.Image:
    inner = Image.open(inner_path).convert("RGBA")
    width = inner.width
    half = lip_outer * width
    centre = width / 2
    box = (round(centre - half), round(centre - half), round(centre + half), round(centre + half))
    crop = inner.crop(box).resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    r = radius_grid(SIZE)
    # Keep the lip only: fade out just past the outer groove, and drop anything
    # inside the opening (the source alpha already falls off there).
    keep = (1 - smoothstep(0.985, 1.0, r)) * smoothstep(lip_inner / lip_outer - 0.02, lip_inner / lip_outer, r)
    pixels = np.asarray(crop, np.float32)
    pixels[..., 3] *= keep
    return Image.fromarray(pixels.astype(np.uint8))


def engraving_mask(seed: int) -> Image.Image:
    """Hairline star chart: dial rings, ticks, bead circle, constellations."""
    big = SIZE * SS
    mask = Image.new("L", (big, big), 0)
    draw = ImageDraw.Draw(mask)
    c = big / 2
    R = big / 2

    def ring(radius: float, width: float) -> None:
        r = radius * R
        draw.ellipse((c - r, c - r, c + r, c + r), outline=255, width=round(width * SS))

    def polar(radius: float, degrees: float) -> tuple[float, float]:
        a = math.radians(degrees - 90)
        return c + math.cos(a) * radius * R, c + math.sin(a) * radius * R

    ring(0.86, 2.2)
    ring(0.80, 1.2)
    for step in range(72):
        degrees = step * 5
        outer = 0.86 if degrees % 30 == 0 else 0.835
        draw.line((polar(0.80, degrees), polar(outer, degrees)), fill=255, width=round((1.6 if degrees % 30 == 0 else 1.0) * SS))
    for step in range(36):
        x, y = polar(0.62, step * 10 + 5)
        dot = 2.2 * SS
        draw.ellipse((x - dot, y - dot, x + dot, y + dot), fill=255)

    rng = random.Random(seed)
    for _ in range(7):
        start_r, start_a = rng.uniform(0.38, 0.74), rng.uniform(0, 360)
        points = [(start_r, start_a)]
        for _ in range(rng.randint(2, 4)):
            r, a = points[-1]
            points.append((min(0.76, max(0.36, r + rng.uniform(-0.09, 0.09))), a + rng.uniform(-14, 14)))
        xy = [polar(r, a) for r, a in points]
        draw.line(xy, fill=150, width=round(0.9 * SS))
        for x, y in xy:
            dot = rng.uniform(2.0, 3.6) * SS
            draw.ellipse((x - dot, y - dot, x + dot, y + dot), fill=255)
    for _ in range(90):
        x, y = polar(rng.uniform(0.2, 0.78), rng.uniform(0, 360))
        dot = rng.uniform(0.6, 1.6) * SS
        draw.ellipse((x - dot, y - dot, x + dot, y + dot), fill=200)
    return mask.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def build_face(seed: int, lens_radius: float) -> Image.Image:
    r = radius_grid(SIZE)
    r_lit = radius_grid(SIZE, 0.5, 0.42)

    # Deep green-black glass, lifted a little where the light falls.
    centre = np.array([24, 34, 29], np.float32)
    mid = np.array([11, 17, 14], np.float32)
    edge = np.array([4, 7, 6], np.float32)
    t1 = smoothstep(0.0, 0.7, r_lit)[..., None]
    t2 = smoothstep(0.7, 1.0, r)[..., None]
    colour = centre * (1 - t1) + mid * t1
    colour = colour * (1 - t2) + edge * t2

    # Smoke: brightness swirls plus a verdigris cast like the ring's enamel.
    smoke = fbm(SIZE, seed)
    teal = fbm(SIZE, seed + 1, octaves=4)
    colour *= (0.8 + 0.45 * smoke)[..., None]
    colour += (smoothstep(0.55, 0.8, teal) * 10)[..., None] * np.array([0.2, 0.9, 0.75], np.float32)

    # Engraving: a dark groove with a lit lower-right wall (light from top-left)
    # and a trace of gold left in it. Calmer in the middle where the text sits.
    mask_img = engraving_mask(seed)
    groove = np.asarray(mask_img, np.float32) / 255
    shifted = np.asarray(ImageChops.offset(mask_img, 1, 1), np.float32) / 255
    lip = np.clip(shifted - groove, 0, 1)
    strength = (0.35 + 0.65 * smoothstep(0.35, 0.62, r))[..., None]
    colour *= 1 - 0.45 * groove[..., None] * strength
    colour += (groove[..., None] * strength) * np.array([194, 145, 67], np.float32) * 0.2
    colour += (lip[..., None] * strength) * np.array([150, 130, 95], np.float32) * 0.18

    # Recess: the rim falls into shadow, deepest at the top under the bezel.
    colour *= (1 - 0.55 * smoothstep(0.78, lens_radius, r))[..., None]
    colour *= (1 - 0.5 * smoothstep(0.86, lens_radius, radius_grid(SIZE, 0.5, 0.53)))[..., None]

    alpha = (1 - smoothstep(lens_radius - 0.004, lens_radius, r)) * 255
    rgba = np.dstack([np.clip(colour, 0, 255), alpha]).astype(np.uint8)
    return Image.fromarray(rgba)


def build_rose(seed: int) -> Image.Image:
    """Eight-point rose with split light/dark facets; north is the brightest point."""
    big = SIZE * SS
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    c = big / 2
    R = big / 2

    def polar(radius: float, degrees: float) -> tuple[float, float]:
        a = math.radians(degrees - 90)
        return c + math.cos(a) * radius * R, c + math.sin(a) * radius * R

    def point(degrees: float, length: float, width: float, light: tuple, dark: tuple) -> None:
        tip = polar(length, degrees)
        left = polar(width, degrees - 45)
        right = polar(width, degrees + 45)
        draw.polygon([(c, c), left, tip], fill=light)
        draw.polygon([(c, c), tip, right], fill=dark)
        draw.line([left, tip, right], fill=(40, 28, 12, 255), width=round(1.2 * SS))
        draw.line([(c, c), tip], fill=(60, 42, 18, 255), width=round(1.0 * SS))

    for degrees in (45, 135, 225, 315):
        point(degrees, 0.5, 0.11, (150, 112, 58, 255), (78, 55, 26, 255))
    for degrees in (90, 180, 270):
        point(degrees, 0.78, 0.15, (196, 152, 84, 255), (104, 74, 34, 255))
    point(0, 0.86, 0.15, (246, 214, 142, 255), (150, 106, 46, 255))

    ring = 0.3 * R
    draw.ellipse((c - ring, c - ring, c + ring, c + ring), outline=(170, 128, 64, 255), width=round(1.6 * SS))
    boss = 0.055 * R
    draw.ellipse((c - boss, c - boss, c + boss, c + boss), fill=(214, 172, 98, 255), outline=(52, 36, 14, 255), width=round(1.2 * SS))

    img = img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    # Brushed-metal grain so the facets don't read as flat vector fills.
    grain = fbm(SIZE, seed + 7, octaves=7)
    pixels = np.asarray(img, np.float32)
    pixels[..., :3] *= (0.82 + 0.36 * grain)[..., None]
    return Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--inner", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--lip-inner", type=float, default=0.2197)
    parser.add_argument("--lip-outer", type=float, default=0.2334)
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()

    lens_radius = args.lip_inner / args.lip_outer + 0.02  # tuck under the bezel
    outputs = {
        "core-bezel": build_bezel(args.inner, args.lip_inner, args.lip_outer),
        "core-face": build_face(args.seed, lens_radius),
        "core-rose": build_rose(args.seed),
    }
    args.out_dir.mkdir(parents=True, exist_ok=True)
    for suffix, image in outputs.items():
        path = args.out_dir / f"{args.name}-{suffix}.webp"
        image.save(path, "WEBP", quality=88, method=6)
        print(f"{path} ({path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
