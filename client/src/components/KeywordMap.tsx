import React, { useEffect, useMemo, useState } from 'react';
import { useFilters } from '../context/FilterContext';
import {
  buildKeywordMap,
  titleCase,
  truncateLabel,
  MAP_WIDTH,
  MAP_HEIGHT,
  type CooccurrenceData,
  type MapNode,
} from '../lib/keywordMap';

const CATEGORY = 'Keywords';

// The co-occurrence file is ~1.8 MB: load it once, on first use, not at module load.
let dataPromise: Promise<CooccurrenceData> | null = null;
const loadCooccurrence = () =>
  (dataPromise ??= import('../assets/keyword_cooccurrence.json').then(m => m.default as unknown as CooccurrenceData));

const CHAR_W = 6.2;
const labelWidth = (label: string) => label.length * CHAR_W + 14;

/**
 * Related-keyword map: the latest selected keyword in the middle, its closest
 * co-occurring keywords around it, and their own related keywords dimmed on an
 * outer ring. Clicking a node adds it as a filter, which re-centres the map
 * (the centre is always the most recently added include keyword).
 */
export const KeywordMap: React.FC = () => {
  const { selectedFilters, addFilter } = useFilters();
  const [data, setData] = useState<CooccurrenceData | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const center = useMemo(
    () => [...selectedFilters].reverse().find(f => f.category === CATEGORY && f.mode !== 'exclude'),
    [selectedFilters],
  );

  useEffect(() => {
    if (center && !data) loadCooccurrence().then(setData).catch(() => {});
  }, [center, data]);

  const centerId = center ? Number(center.id) : null;
  const nodes = useMemo(
    () => (data && center && centerId !== null ? buildKeywordMap(centerId, center.name, data) : []),
    [data, center, centerId],
  );

  if (nodes.length < 2) return null;

  const selectedIds = new Set(selectedFilters.filter(f => f.category === CATEGORY).map(f => Number(f.id)));
  const byId = new Map(nodes.map(n => [n.id, n]));

  const select = (node: MapNode) => {
    if (node.level === 0 || selectedIds.has(node.id)) return;
    addFilter({ id: node.id, name: titleCase(node.name), category: CATEGORY, mode: 'include' });
  };

  // A level-2 node is lit when it, or its level-1 parent, is hovered.
  const isLit = (node: MapNode) =>
    node.level < 2 || hoveredId === node.id || hoveredId === node.parentId;

  return (
    <div className="keyword-map hidden lg:block rounded-lg border border-border p-3">
      <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Related keywords</p>
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="h-auto w-full" role="group" aria-label="Related keywords map">
        {nodes.filter(n => n.parentId !== undefined).map(n => {
          const parent = byId.get(n.parentId!)!;
          const lit = isLit(n);
          return (
            <line
              key={`e-${n.id}`}
              x1={parent.x}
              y1={parent.y}
              x2={n.x}
              y2={n.y}
              className="stroke-primary"
              strokeWidth={n.level === 1 ? 1 + n.weight * 2.5 : 1}
              strokeOpacity={n.level === 1 ? 0.35 + n.weight * 0.4 : lit ? 0.5 : 0.15}
              style={{ transition: 'stroke-opacity 150ms' }}
            />
          );
        })}
        {nodes.map(n => {
          const label = truncateLabel(titleCase(n.name));
          const w = labelWidth(label);
          const selected = n.level === 0 || selectedIds.has(n.id);
          const clickable = !selected;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x} ${n.y})`}
              opacity={isLit(n) ? 1 : 0.4}
              style={{ transition: 'opacity 150ms', cursor: clickable ? 'pointer' : 'default' }}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              aria-label={clickable ? `Add keyword ${titleCase(n.name)}` : undefined}
              onClick={() => select(n)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  select(n);
                }
              }}
              onMouseEnter={() => setHoveredId(n.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(n.id)}
              onBlur={() => setHoveredId(null)}
            >
              <rect
                x={-w / 2}
                y={-11}
                width={w}
                height={22}
                rx={11}
                className={selected ? 'fill-primary stroke-primary' : 'fill-card stroke-primary'}
                strokeOpacity={selected ? 1 : 0.5}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={n.level === 0 ? 13 : 12}
                fontWeight={n.level === 0 ? 600 : 400}
                className={selected ? 'fill-primary-foreground' : 'fill-foreground'}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default KeywordMap;
