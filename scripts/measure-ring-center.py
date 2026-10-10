"""Measure how far a Wayfinder layer's art sits from its canvas centre.

The browser rotates each layer about the canvas centre, so any offset shows up
as a wobble. Two independent estimates, which should agree:

  rim fit     sub-pixel 50%-alpha crossings of the hole's rim along 1440 rays,
              least-squares circle fit with outlier (ornament) rejection.
  rotation    centre p minimising |layer - rotate(layer, deg, about p)| inside a
              radial band, i.e. exactly what the animation does.

Offsets are in pixels at the file's own resolution (+x right, +y down).

    python scripts/measure-ring-center.py client/src/assets/ui/wayfinder/arcane/wayfinder-arcane-inner.webp
"""

from __future__ import annotations

import argparse
import math

import numpy as np
from PIL import Image


def bilinear(img: np.ndarray, x: float, y: float) -> float:
    x0, y0 = int(x), int(y)
    fx, fy = x - x0, y - y0
    return (
        img[y0, x0] * (1 - fx) * (1 - fy)
        + img[y0, x0 + 1] * fx * (1 - fy)
        + img[y0 + 1, x0] * (1 - fx) * fy
        + img[y0 + 1, x0 + 1] * fx * fy
    )


def fit_circle(points: np.ndarray) -> tuple[float, float, float, np.ndarray]:
    x, y = points[:, 0], points[:, 1]
    solution = np.linalg.lstsq(np.c_[x, y, np.ones_like(x)], x * x + y * y, rcond=None)[0]
    cx, cy = solution[0] / 2, solution[1] / 2
    r = math.sqrt(solution[2] + cx * cx + cy * cy)
    return cx, cy, r, np.hypot(x - cx, y - cy) - r


def rim_fit(alpha: np.ndarray, r_from: float, r_to: float) -> tuple[float, float, float, float]:
    c = alpha.shape[0] / 2
    points = []
    for k in range(1440):
        theta = 2 * math.pi * k / 1440
        dx, dy = math.cos(theta), math.sin(theta)
        prev = None
        for r in np.arange(r_from, r_to, 0.25):
            a = bilinear(alpha, c + dx * r, c + dy * r)
            if prev is not None and prev < 0.5 <= a:
                rr = r - 0.25 * (a - 0.5) / (a - prev)
                points.append((c + dx * rr, c + dy * rr))
                break
            prev = a
    points_arr = np.array(points)
    cx, cy, r, residual = fit_circle(points_arr)
    for _ in range(3):
        points_arr = points_arr[np.abs(residual) < 2 * np.median(np.abs(residual)) + 0.5]
        cx, cy, r, residual = fit_circle(points_arr)
    return cx, cy, r, float(np.sqrt((residual ** 2).mean()))


def rotation_centre(image: Image.Image, degrees: float, band: tuple[float, float]) -> tuple[float, float, float, float]:
    size = image.width
    c = size / 2
    pixels = np.asarray(image, dtype=np.float64)
    yy, xx = np.mgrid[0:size, 0:size]
    radius = np.hypot(xx - c, yy - c)
    mask = (radius > band[0]) & (radius < band[1])

    def cost(px: float, py: float) -> float:
        rotated = image.rotate(degrees, resample=Image.BICUBIC, center=(px, py))
        return float(np.abs(np.asarray(rotated, dtype=np.float64) - pixels)[mask].mean())

    best = (cost(c, c), c, c)
    at_centre = best[0]
    step = 4.0
    while step >= 0.125:
        improved = True
        while improved:
            improved = False
            for dx, dy in ((step, 0), (-step, 0), (0, step), (0, -step)):
                value = cost(best[1] + dx, best[2] + dy)
                if value < best[0]:
                    best = (value, best[1] + dx, best[2] + dy)
                    improved = True
        step /= 2
    return best[1], best[2], best[0], at_centre


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("layer")
    parser.add_argument("--rim", nargs=2, type=float, default=(0.15, 0.37), metavar=("FROM", "TO"),
                        help="radius range to search for the hole rim, as fractions of width")
    parser.add_argument("--band", nargs=2, type=float, default=(0.21, 0.32), metavar=("FROM", "TO"),
                        help="radius band compared by the rotation test, as fractions of width")
    parser.add_argument("--angles", nargs="+", type=float, default=(60, 120, 180),
                        help="rotation test angles; use the ring's symmetry (180 always works)")
    args = parser.parse_args()

    image = Image.open(args.layer).convert("RGBA")
    size = image.width
    c = size / 2
    alpha = np.asarray(image, dtype=np.float64)[..., 3] / 255

    cx, cy, r, rms = rim_fit(alpha, args.rim[0] * size, args.rim[1] * size)
    print(f"rim fit     offset ({cx - c:+.2f}, {cy - c:+.2f}) px   r={r:.1f}  rms={rms:.2f}px")
    band = (args.band[0] * size, args.band[1] * size)
    for degrees in args.angles:
        px, py, best, at_centre = rotation_centre(image, degrees, band)
        print(f"rotate {degrees:>3g}  offset ({px - c:+.2f}, {py - c:+.2f}) px   mismatch {best:.1f} (vs {at_centre:.1f} at canvas centre)")


if __name__ == "__main__":
    main()
