"""Build an aligned Wayfinder layer pack from relit raster masters.

The relighting pass may change pixels enough to confuse the geometry detectors
in split-wayfinder.py. Production layer alpha masks are therefore reused as
the alignment contract while RGB comes from the relit masters.
"""

from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path

from PIL import Image


def load_split_helpers(script: Path):
    spec = importlib.util.spec_from_file_location("split_wayfinder", script)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {script}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fitted_source(path: Path, size: int, split) -> Image.Image:
    source = Image.open(path).convert("RGBA")
    source.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size))
    canvas.alpha_composite(source, ((size - source.width) // 2, (size - source.height) // 2))
    return split.clean_generated_alpha(canvas)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--master", required=True, type=Path)
    parser.add_argument("--gemless", required=True, type=Path)
    parser.add_argument("--mask-dir", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    parser.add_argument("--mask-name", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--size", type=int, default=1024)
    args = parser.parse_args()

    split = load_split_helpers(Path(__file__).with_name("split-wayfinder.py"))
    master = fitted_source(args.master, args.size, split)
    gemless = fitted_source(args.gemless, args.size, split)
    centers = split.detect_socket_centers(master, 0.80, 0.098)

    args.out_dir.mkdir(parents=True, exist_ok=True)
    split.save_webp(master, args.out_dir / f"{args.name}-master.webp")

    for layer_name in ("outer", "mechanism", "inner", "sockets", "spokes"):
        mask_path = args.mask_dir / f"{args.mask_name}-{layer_name}.webp"
        mask = Image.open(mask_path).convert("RGBA").getchannel("A")
        source = gemless if layer_name == "mechanism" else master
        layer = split.masked(source, mask)
        if layer_name == "sockets":
            layer = split.neutralize_gems(layer, centers, 0.098)
        split.save_webp(layer, args.out_dir / f"{args.name}-{layer_name}.webp")

    print(f"Wrote aligned relit pack: {args.name}")


if __name__ == "__main__":
    main()
