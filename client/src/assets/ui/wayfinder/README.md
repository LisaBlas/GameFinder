# Wayfinder asset packs

Each variant uses the same 1024×1024 transparent canvas and contains:

- `*-master.webp` — assembled reference/fallback.
- `*-outer.webp` — structural frame.
- `*-mechanism.webp` — middle mechanism ring.
- `*-inner.webp` — inner dial.
- `*-sockets.webp` — six stationary jewel mounts.

Variants:

- `restrained/` — low-intensity explorer/cartographer instrument.
- `arcane/` — medium-intensity teal clockwork instrument; active desktop skin.
- `legendary/` — high-intensity obsidian celestial relic.

All layers share an exact center and can be stacked with `position: absolute;
inset: 0`. Keep sockets synchronized with the outer frame; the mechanism and
inner dial can counter-rotate independently.

Full-resolution sources live in `design/sources/`. Regenerate layer packs with
`scripts/split-wayfinder.py`; choose radial cuts that fall in each master's
natural transparent gaps.

The active Arcane mechanism is intentionally extracted from
`design/sources/wayfinder-arcane-gemless-v3.png`, not the assembled master. It
has continuous metalwork with no socket fragments, so it can rotate beneath
the stationary outer frame and jewel layer. Use `--only mechanism` when
regenerating it to preserve the other four Arcane files.
