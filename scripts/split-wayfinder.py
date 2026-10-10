"""Split a transparent Wayfinder master into independently animated layers.

Every output keeps the same square canvas, so the browser can stack the pieces
without alignment metadata. Cuts should sit in the master's natural ring gaps.

Generated gems rarely sit on a perfect orbit, so `--detect-sockets` centres each
socket cut on its gem (found by colour near the nominal 30-degree bearings)
instead of on the fixed orbit. Generated inner rings can also be drawn off
centre, which makes them wobble as they turn: measure with
scripts/measure-ring-center.py and pass the offset as `--inner-center`. The
mechanism must use the same value so its cut matches the inner layer's.

`--spokes` lifts the six bars/arrowheads that line up with the sockets out of the
turning inner ring into a static spokes layer (drawn above the ring), and refills
the holes from further round the ring so nothing duplicates as it turns.

Arcane (outer/inner/sockets from the gem source, mechanism from the gemless one):

    python scripts/split-wayfinder.py --input design/sources/wayfinder-arcane-v3.png
        --out-dir client/src/assets/ui/wayfinder/arcane --name wayfinder-arcane
        --inner-cut 0.69 --outer-cut 0.80 --socket-distance 0.80 --socket-radius 0.098
        --detect-sockets --inner-center -0.3 -7.4 --spokes --neutral-gems
    python scripts/split-wayfinder.py --input design/sources/wayfinder-arcane-gemless-v3.png
        (same --out-dir, --name, cuts and --inner-center) --only mechanism
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SOCKET_BEARINGS = (-90, -30, 30, 90, 150, 210)
MASK_SUPERSAMPLE = 4
# Spoke outline in px at 1024, as (tangential, radial) from the inner-ring centre:
# the gold bar across the band, its chevron cap, and the dark arrowhead over the teeth.
SPOKE_POLYGON = ((-16, 198), (16, 198), (16, 296), (21, 296), (48, 360), (-48, 360), (-21, 296), (-16, 296))
# Spoke holes in the turning ring are refilled from this far round it, which lands
# on plain band and a run of teeth (between the spoke's dots and its neighbouring moons).
SPOKE_PATCH_OFFSET = 16


def circle_mask(size: int, radius: float, offset: tuple[float, float] = (0, 0)) -> Image.Image:
    # Supersampled so an off-centre (sub-pixel) cut is still antialiased.
    scale = MASK_SUPERSAMPLE
    mask = Image.new("L", (size * scale, size * scale), 0)
    cx = (size / 2 + offset[0]) * scale
    cy = (size / 2 + offset[1]) * scale
    r = radius * size / 2 * scale
    ImageDraw.Draw(mask).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def recentre(layer: Image.Image, offset: tuple[float, float]) -> Image.Image:
    """Shift art centred at canvas-centre + offset back onto the canvas centre."""
    if offset == (0, 0):
        return layer
    dx, dy = offset
    # Resample premultiplied so transparent edges don't pick up black fringes.
    shifted = layer.convert("RGBa").transform(
        layer.size, Image.Transform.AFFINE, (1, 0, dx, 0, 1, dy), resample=Image.Resampling.BICUBIC
    )
    return shifted.convert("RGBA")


def orbit_socket_centers(size: int, distance: float) -> list[tuple[float, float]]:
    center = size / 2
    orbit = distance * size / 2
    return [
        (center + math.cos(math.radians(d)) * orbit, center + math.sin(math.radians(d)) * orbit)
        for d in SOCKET_BEARINGS
    ]


def is_gem(red: int, green: int, blue: int, alpha: int) -> bool:
    return alpha > 200 and green > 110 and green > red * 1.8 and green > blue * 1.2


def detect_socket_centers(source: Image.Image, distance: float, radius: float) -> list[tuple[float, float]]:
    """Centre each socket on the gem pixels around its nominal orbit position."""
    size = source.width
    pixels = source.load()
    search = radius * size / 2 * 1.5
    gem_core = radius * size / 2 * 0.8
    centers = []
    for nominal_x, nominal_y in orbit_socket_centers(size, distance):
        points = [
            (x, y)
            for y in range(max(0, int(nominal_y - search)), min(size, int(nominal_y + search) + 1))
            for x in range(max(0, int(nominal_x - search)), min(size, int(nominal_x + search) + 1))
            if is_gem(*pixels[x, y])
        ]
        if not points:
            raise SystemExit(f"No gem found near ({nominal_x:.0f}, {nominal_y:.0f}); drop --detect-sockets")
        x, y = nominal_x, nominal_y
        # Re-centre on the dense gem core so stray teal enamel doesn't drag the cut.
        for _ in range(6):
            core = [p for p in points if math.hypot(p[0] - x, p[1] - y) < gem_core] or points
            x = sum(p[0] for p in core) / len(core)
            y = sum(p[1] for p in core) / len(core)
        centers.append((x + 0.5, y + 0.5))
    return centers


def neutralize_gems(layer: Image.Image, centers: list[tuple[float, float]], radius: float) -> Image.Image:
    """Recolour the green gems to a smoky grey stone, keeping their facet shading.

    Only non-brass pixels inside each bezel change (weighted so the rim blends), so
    the brass housing and the frame's teal enamel around it stay as drawn."""
    size = layer.width
    reach = radius * size / 2 * 0.76
    out = layer.copy()
    pixels = out.load()
    for cx, cy in centers:
        for y in range(max(0, int(cy - reach)), min(size, int(cy + reach) + 1)):
            for x in range(max(0, int(cx - reach)), min(size, int(cx + reach) + 1)):
                if math.hypot(x + 0.5 - cx, y + 0.5 - cy) > reach:
                    continue
                red, green, blue, alpha = pixels[x, y]
                # Brass is red-led; the stone (green or teal) is not.
                weight = min(1.0, max(0.0, (green + 10 - red) / 25))
                if weight == 0:
                    continue
                # Green carries most of a green gem's light; lift it back to a grey of similar value.
                grey = min(255.0, (0.3 * red + 0.59 * green + 0.11 * blue) * 1.2)
                tint = (grey * 1.0, grey * 0.98, grey * 0.95)
                pixels[x, y] = tuple(
                    round(c + (t - c) * weight) for c, t in zip((red, green, blue), tint)
                ) + (alpha,)
    return out


def socket_mask(size: int, centers: list[tuple[float, float]], radius: float) -> Image.Image:
    # Drawn supersampled, then downscaled, so the cut edge is antialiased.
    scale = MASK_SUPERSAMPLE
    mask = Image.new("L", (size * scale, size * scale), 0)
    draw = ImageDraw.Draw(mask)
    socket_radius = radius * size / 2 * scale
    for x, y in centers:
        x, y = x * scale, y * scale
        draw.ellipse(
            (x - socket_radius, y - socket_radius, x + socket_radius, y + socket_radius),
            fill=255,
        )
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def is_gold(red: int, green: int, blue: int, alpha: int) -> bool:
    return alpha > 200 and red > 120 and red > blue * 1.4


def detect_spoke_angles(inner: Image.Image) -> list[float]:
    """Find each gold spoke bar where it crosses the dark band, near its socket bearing."""
    size = inner.width
    pixels = inner.load()
    angles = []
    for bearing in SOCKET_BEARINGS:
        mids = []
        for radius in (260, 285):
            r = radius * size / 1024
            gold = []
            for step in range(-160, 161):
                a = bearing + step / 20
                x = size / 2 + r * math.cos(math.radians(a))
                y = size / 2 + r * math.sin(math.radians(a))
                if is_gold(*pixels[int(x), int(y)]):
                    gold.append(a)
            # The bar is the gold run closest to the nominal bearing.
            runs, run = [], []
            for a in gold:
                if run and a - run[-1] > 0.06:
                    runs.append(run)
                    run = []
                run.append(a)
            if run:
                runs.append(run)
            runs = [r_ for r_ in runs if r_[-1] - r_[0] > 1.5]
            if not runs:
                raise SystemExit(f"No spoke found near {bearing} deg; drop --spokes")
            best = min(runs, key=lambda r_: abs((r_[0] + r_[-1]) / 2 - bearing))
            mids.append((best[0] + best[-1]) / 2)
        angles.append(sum(mids) / len(mids))
    return angles


def spoke_mask(size: int, angles: list[float]) -> Image.Image:
    scale = MASK_SUPERSAMPLE
    unit = size / 1024 * scale
    center = size / 2 * scale
    mask = Image.new("L", (size * scale, size * scale), 0)
    draw = ImageDraw.Draw(mask)
    for angle in angles:
        ca, sa = math.cos(math.radians(angle)), math.sin(math.radians(angle))
        draw.polygon(
            [(center + (r * ca - t * sa) * unit, center + (r * sa + t * ca) * unit) for t, r in SPOKE_POLYGON],
            fill=255,
        )
    return mask.resize((size, size), Image.Resampling.LANCZOS)


def split_spokes(inner: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Lift the spokes out of the (recentred) inner ring so they can stay still.

    Returns (turning ring with the spoke holes refilled, static spokes layer)."""
    angles = detect_spoke_angles(inner)
    print("Spoke angles:", ", ".join(f"{a:.1f}" for a in angles))
    mask = spoke_mask(inner.width, angles)
    spokes = masked(inner, mask)
    # Refill from further round the ring, feathered so the seam blends while it turns.
    donor = inner.convert("RGBa").rotate(SPOKE_PATCH_OFFSET, resample=Image.Resampling.BICUBIC)
    patch = mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
    ring = Image.composite(donor, inner.convert("RGBa"), patch).convert("RGBA")
    return ring, spokes


def clean_generated_alpha(source: Image.Image) -> Image.Image:
    """Remove faint key-colour remnants and zero hidden RGB in transparent pixels."""
    clean = Image.new("RGBA", source.size)
    output = []
    for red, green, blue, alpha in source.get_flattened_data():
        key_remnant = (
            red > 150
            and red > green * 1.45
            and (blue > 65 or red > blue * 1.65)
        )
        if alpha < 12 or key_remnant:
            output.append((0, 0, 0, 0))
        else:
            output.append((red, green, blue, alpha))
    clean.putdata(output)
    return clean


def solidify(layer: Image.Image, soft: int = 100, solid: int = 200) -> Image.Image:
    """Make generated metal fully opaque: it comes out at ~180-250 alpha and the page
    shows through. Faint baked shadow (below `soft`) keeps its alpha; between `soft`
    and `solid` alpha ramps up to 255 so antialiased edges stay smooth."""
    def curve(alpha: int) -> int:
        if alpha <= soft:
            return alpha
        if alpha >= solid:
            return 255
        return round(soft + (alpha - soft) * (255 - soft) / (solid - soft))
    solid_layer = layer.copy()
    solid_layer.putalpha(layer.getchannel("A").point(curve))
    return solid_layer


def masked(source: Image.Image, mask: Image.Image) -> Image.Image:
    layer_alpha = ImageChops.multiply(source.getchannel("A"), mask)
    layer = Image.new("RGBA", source.size)
    layer.paste(source, (0, 0), layer_alpha)
    layer.putalpha(layer_alpha)
    return layer


def save_webp(image: Image.Image, path: Path) -> None:
    image.save(path, "WEBP", quality=90, method=6)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--name", required=True)
    parser.add_argument("--inner-cut", required=True, type=float)
    parser.add_argument("--outer-cut", required=True, type=float)
    parser.add_argument("--socket-distance", required=True, type=float)
    parser.add_argument("--socket-radius", required=True, type=float)
    parser.add_argument("--size", type=int, default=1024)
    parser.add_argument("--detect-sockets", action="store_true")
    parser.add_argument(
        "--inner-center", nargs=2, type=float, default=(0.0, 0.0), metavar=("DX", "DY"),
        help="inner ring art centre relative to canvas centre, px at --size "
             "(measure with scripts/measure-ring-center.py); the inner layer is cut "
             "around it and shifted back so it rotates in place",
    )
    parser.add_argument(
        "--spokes", action="store_true",
        help="lift the six spokes out of the inner ring into a static spokes layer",
    )
    parser.add_argument(
        "--neutral-gems", action="store_true",
        help="recolour the socket gems from green to a smoky grey stone",
    )
    parser.add_argument("--only", choices=("inner", "mechanism", "outer", "sockets", "spokes"))
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    source.thumbnail((args.size, args.size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (args.size, args.size))
    canvas.alpha_composite(source, ((args.size - source.width) // 2, (args.size - source.height) // 2))
    source = clean_generated_alpha(canvas)

    inner_center = (args.inner_center[0], args.inner_center[1])
    inner_disk = circle_mask(args.size, args.inner_cut, inner_center)
    outer_disk = circle_mask(args.size, args.outer_cut)
    if args.detect_sockets:
        centers = detect_socket_centers(source, args.socket_distance, args.socket_radius)
        print("Socket centres:", ", ".join(f"({x:.1f}, {y:.1f})" for x, y in centers))
    else:
        centers = orbit_socket_centers(args.size, args.socket_distance)
    sockets = socket_mask(args.size, centers, args.socket_radius)
    without_sockets = ImageChops.invert(sockets)

    masks = {
        "inner": inner_disk,
        "mechanism": ImageChops.subtract(outer_disk, inner_disk),
        "outer": ImageChops.multiply(ImageChops.invert(outer_disk), without_sockets),
        "sockets": sockets,
    }

    if args.only == "spokes" and not args.spokes:
        raise SystemExit("--only spokes needs --spokes")

    args.out_dir.mkdir(parents=True, exist_ok=True)
    layers: dict[str, Image.Image] = {}
    def layer(layer_name: str) -> Image.Image:
        if layer_name not in layers:
            if layer_name in ("inner", "spokes"):
                ring = solidify(recentre(masked(source, masks["inner"]), inner_center))
                if args.spokes:
                    layers["inner"], layers["spokes"] = split_spokes(ring)
                else:
                    layers["inner"] = ring
            else:
                layers[layer_name] = masked(source, masks[layer_name])
                if layer_name == "sockets" and args.neutral_gems:
                    layers[layer_name] = neutralize_gems(layers[layer_name], centers, args.socket_radius)
        return layers[layer_name]

    names = list(masks) + (["spokes"] if args.spokes else [])
    if args.only:
        save_webp(layer(args.only), args.out_dir / f"{args.name}-{args.only}.webp")
        print(f"Wrote {args.name}: {args.only}")
    else:
        save_webp(source, args.out_dir / f"{args.name}-master.webp")
        for layer_name in names:
            save_webp(layer(layer_name), args.out_dir / f"{args.name}-{layer_name}.webp")
        print(f"Wrote {args.name}: master + {', '.join(names)}")


if __name__ == "__main__":
    main()
