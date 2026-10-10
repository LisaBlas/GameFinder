import React from 'react';

// The table always has at least this many sockets: the rack shows them empty,
// and the results grid keeps any that its cards don't fill.
export const RACK_SIZE = 8;

const FLOOR_TILE = 1024; // matches the floor's background-size in results-relic.css

const frac = (n: number) => n - Math.floor(n);

/** Each socket is its own piece of the floor stone: a different patch of the
 *  tile, a slightly different tone, and a faint sheen at its own angle, as if
 *  cut from different parts of one block. The stone is fine and even, so the
 *  offset alone barely shows. Values follow low-discrepancy sequences, so
 *  neighbours always differ. Keyed by grid position: the sockets belong to the
 *  table, not to the cards that land in them. */
export const socketFloorStyle = (index: number) => ({
  '--floor-x': `${Math.round(frac(0.5 + 0.7548776662 * index) * FLOOR_TILE)}px`,
  '--floor-y': `${Math.round(frac(0.5 + 0.5698402910 * index) * FLOOR_TILE)}px`,
  '--floor-shade': (frac(0.7 + 0.6180339887 * index) * 0.3).toFixed(3),
  '--floor-sheen': (0.004 + frac(0.3 + 0.4142135624 * index) * 0.012).toFixed(3),
  '--floor-angle': `${Math.round(frac(0.15 + 0.3819660113 * index) * 360)}deg`,
}) as React.CSSProperties;

/** Empty card sockets carved into the table, shown before any results exist.
 *  Mirrors the results layout exactly (an empty summary row, then the grid),
 *  so when results arrive the cards land in these sockets instead of the
 *  sockets jumping down. Decorative. */
const SocketRack: React.FC = () => (
  <div className="socket-rack" aria-hidden>
    <div className="results-summary results-summary--placeholder" />
    <div className="grid grid-cols-1 widescreen:grid-cols-2 gap-7">
      {Array.from({ length: RACK_SIZE }, (_, i) => (
        <div key={i} className="card-socket-empty" style={socketFloorStyle(i)} />
      ))}
    </div>
  </div>
);

export default SocketRack;
