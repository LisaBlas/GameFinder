import React, { useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import { Maximize2, Minus, Plus } from 'lucide-react';
import { BADGE_ROOM, badgeRoom, nodeLabel, titleCase, type LabelNode, type MapNode } from '../lib/keywordMap';
import { nearestInDirection, pillHeight, type Direction, type Size } from '../lib/keywordMapLayout';
import { TIMING, type SceneEdge, type TransitionPlan } from '../lib/keywordMapMotion';
import { useMapCamera, ZOOM_MAX, ZOOM_MIN } from '../hooks/useMapCamera';
import { formatCount, useSearchCount } from '../lib/searchCount';
import { useMapLink } from '../lib/mapLink';
import { getRarity } from '../lib/discoveryCards';
import type { SearchPayload } from '../../../shared/searchKey';

export type KeywordMode = 'include' | 'exclude';
/** How a keyword was toggled, for funnel analytics. */
export type ToggleMethod = 'badge' | 'double_click' | 'keyboard' | 'context_menu' | 'alt_click' | 'inspector';

/** Physical but not bouncy: nodes should feel weighty, not elastic. */
const POSITION_SPRING = { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 } as const;
const ARROWS: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

interface Props {
  nodes: MapNode[];
  plan: TransitionPlan;
  viewport: Size;
  widthOf: (n: LabelNode) => number;
  reduceMotion: boolean;
  /** Changes with the centre and refresh round: replays the pulse, resets user zoom. */
  sceneKey: string;
  variant: 'desktop' | 'mobile';
  modeOf: (id: number) => KeywordMode | null;
  onExplore: (node: MapNode) => void;
  /** Toggle a keyword's mode in the search (same mode again removes it). */
  onToggle: (node: MapNode, mode: KeywordMode, method: ToggleMethod) => void;
  /** Hover/focus moved (null: left the map's nodes). */
  onHoverNode?: (node: MapNode | null) => void;
  /** Search to count while a node is hovered (null: no preview for it). */
  previewPayload?: (node: MapNode) => SearchPayload | null;
  /** Rare-but-strong pairings with the centre: id → shared games at crawl time. */
  discoveries?: ReadonlyMap<number, number>;
  /** Fits-my-search mode: results if this keyword were added (undefined = unknown). */
  fitCountOf?: (id: number) => number | undefined;
  /** Fits mode: caption every visible keyword with its count (Explore only colours by rarity). */
  showFitTags?: boolean;
  /** Persistent caption under a category/subcategory node, e.g. "65 keywords". */
  tagFor?: (node: MapNode) => string | undefined;
  /** Mobile swipe: show the next set of neighbours, rotating in the swipe direction. */
  onSwipe?: (dir: 1 | -1) => void;
}

/**
 * The map viewport: one long-lived SVG whose nodes and edges keep their
 * identity across layouts (see docs/MAP_FEATURE.md), under a camera that
 * frames the scene automatically and can be zoomed/panned.
 */
export const KeywordMapScene: React.FC<Props> = ({
  nodes,
  plan,
  viewport,
  widthOf,
  reduceMotion,
  sceneKey,
  variant,
  modeOf,
  onExplore,
  onToggle,
  onSwipe,
  onHoverNode,
  previewPayload,
  discoveries,
  fitCountOf,
  showFitTags = false,
  tagFor,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const cameraRef = useRef<SVGGElement>(null);
  const nodeEls = useRef(new Map<number, SVGGElement>());
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [focusId, setFocusId] = useState<number | null>(null);
  // Per instance (desktop and mobile maps can both be mounted); colons break url(#…).
  const uid = useId().replace(/:/g, '');
  const glowId = `kmap-glow-${uid}`;
  const helpId = `kmap-help-${uid}`;

  const byId = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const centerNode = nodes[0];
  // Roving tabindex: one tab stop for the whole map, arrows move between nodes.
  const tabStopId = focusId !== null && byId.has(focusId) ? focusId : centerNode.id;

  // Identity framing: the layout already fits the viewport and keeps clear of the overlays
  // (toolbar, info card) in viewport coordinates; auto pan/zoom would move pills under them.
  // User zoom/pan still applies on top.
  const frame = useMemo(() => ({ focus: { x: viewport.width / 2, y: viewport.height / 2 }, scale: 1 }), [viewport]);
  const camera = useMapCamera(svgRef, cameraRef, { viewport, frame, reduceMotion, resetKey: sceneKey, onSwipe });

  // Results ↔ map: a hovered/expanded game card lights its keywords here.
  const link = useMapLink();
  const linkClass = (id: number) =>
    link.card?.matchedIds.has(id) ? 'is-cause' : link.card?.keywordIds.has(id) ? 'is-echo' : null;

  // A level-2 node is lit when it, or its level-1 parent, is hovered/focused, or a card points at it.
  const isLit = (node: MapNode) =>
    node.level < 2 || hoveredId === node.id || hoveredId === node.parentId || linkClass(node.id) !== null;

  const hover = (node: MapNode | null) => {
    setHoveredId(node?.id ?? null);
    onHoverNode?.(node);
  };

  // Result-count preview for the hovered keyword, after a short hover-intent delay.
  const hovered = hoveredId !== null ? byId.get(hoveredId) : undefined;
  // Fits mode already knows every count: no request, and the persistent tag shows it.
  const hoverKnown = hovered && fitCountOf ? fitCountOf(hovered.id) : undefined;
  const hoverCount = useSearchCount(hovered && previewPayload && hoverKnown === undefined ? previewPayload(hovered) : null, 350);

  // Active path: centre → (parent →) hovered node, drawn outward with flowing energy.
  const activePath = useMemo(() => {
    if (!hovered || hovered.level === 0) return [];
    const chain: MapNode[] = [hovered];
    for (let p = hovered.parentId !== undefined ? byId.get(hovered.parentId) : undefined; p; p = p.parentId !== undefined ? byId.get(p.parentId) : undefined) {
      chain.unshift(p);
    }
    return chain.slice(1).map((c, i) => ({ from: chain[i], to: c }));
  }, [hovered, byId]);

  // Transition sparks: a restrained burst from the new centre, only while the scene changes.
  const sparks = useMemo(
    () =>
      reduceMotion || plan.direction === 'jump'
        ? []
        : Array.from({ length: 10 }, (_, i) => {
            const a = ((i * 137.5 + (sceneKey.length % 7) * 11) * Math.PI) / 180; // golden-angle spread, deterministic
            const d = 46 + ((i * 29) % 40);
            return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, delay: 0.18 + (i % 4) * 0.04 };
          }),
    [sceneKey, reduceMotion, plan.direction],
  );

  // Position springs, opacity tweens; reduced motion repositions instantly.
  const move = (delay: number): Transition => (reduceMotion ? { duration: 0 } : { ...POSITION_SPRING, delay });
  const fade = (delay: number): Transition => ({ duration: reduceMotion ? 0.15 : 0.22, delay: reduceMotion ? 0 : delay });
  const delayOf = (id: number) => plan.nodes.get(id)?.delay ?? 0;

  const focusNode = (id: number) => nodeEls.current.get(id)?.focus();

  const onKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    const dir = ARROWS[e.key];
    if (dir) {
      e.preventDefault();
      const from = byId.get(tabStopId) ?? centerNode;
      const next = nearestInDirection(from, nodes, dir);
      if (next) focusNode(next.id);
      return;
    }
    if (e.key === '+' || e.key === '=') camera.zoomBy(1.2);
    else if (e.key === '-' || e.key === '_') camera.zoomBy(1 / 1.2);
    else if (e.key === '0') camera.reset();
    else return;
    e.preventDefault();
  };

  const renderBadge = (node: MapNode, w: number, mode: KeywordMode | null, lit: boolean) => {
    const cx = w / 2 - BADGE_ROOM / 2 - 4;
    const label = mode ? `Remove ${titleCase(node.name)}` : `Add ${titleCase(node.name)} to search`;
    return (
      <g
        className="kmap-badge"
        transform={`translate(${cx} 0)`}
        opacity={mode || lit || variant === 'mobile' ? 1 : 0}
        aria-hidden="true"
        onClick={e => {
          e.stopPropagation();
          onToggle(node, mode ?? 'include', 'badge');
        }}
        onDoubleClick={e => e.stopPropagation()}
      >
        <title>{label}</title>
        {/* Larger invisible hit area, especially for thumbs. */}
        <circle className="kmap-badge-hit" r={variant === 'mobile' ? 15 : 10} />
        <circle r={7} />
        {mode === 'include' ? (
          <polyline points="-3,0 -1,2.5 3,-2.5" />
        ) : mode === 'exclude' ? (
          <line x1={-3} y1={0} x2={3} y2={0} />
        ) : (
          <>
            <line x1={-3} y1={0} x2={3} y2={0} />
            <line x1={0} y1={-3} x2={0} y2={3} />
          </>
        )}
      </g>
    );
  };

  const renderCenterActions = (node: MapNode, w: number, mode: KeywordMode | null) => {
    const x = w / 2 + 13;
    const action = (kind: KeywordMode, cy: number, symbol: 'plus' | 'minus') => (
      <g
        className={`kmap-center-action kmap-center-action--${kind}${mode === kind ? ' is-active' : ''}`}
        transform={`translate(${x} ${cy})`}
        role="button"
        tabIndex={0}
        aria-label={`${kind === 'include' ? 'Include' : 'Exclude'} ${titleCase(node.name)}`}
        aria-pressed={mode === kind}
        onClick={e => {
          e.stopPropagation();
          onToggle(node, kind, 'inspector');
        }}
        onDoubleClick={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          e.stopPropagation();
          onToggle(node, kind, 'keyboard');
        }}
      >
        <title>{`${kind === 'include' ? 'Include' : 'Exclude'} ${titleCase(node.name)}`}</title>
        <circle className="kmap-center-action-hit" r={11} />
        <circle className="kmap-center-action-bg" r={8} />
        <line x1={-3.5} y1={0} x2={3.5} y2={0} />
        {symbol === 'plus' && <line x1={0} y1={-3.5} x2={0} y2={3.5} />}
      </g>
    );
    return <g className="kmap-center-actions">{action('include', -9, 'plus')}{action('exclude', 9, 'minus')}</g>;
  };

  const renderEdge = (e: SceneEdge) => {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) return null;
    const child = b.level === e.level ? b : a;
    const motionInfo = plan.edgeMotion.get(e.key);
    const delay = motionInfo?.delay ?? 0;
    const end = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
    // Two selected keywords linked directly: brighten the link between them.
    const bothIncluded = modeOf(a.id) === 'include' && modeOf(b.id) === 'include';
    return (
      <motion.line
        key={e.key}
        className={`kmap-edge${bothIncluded ? ' is-linked' : ''}`}
        strokeWidth={e.level === 1 ? 1 + e.weight * 2.5 : 1}
        strokeOpacity={bothIncluded ? 0.9 : e.level === 1 ? 0.3 + e.weight * 0.4 : isLit(child) ? 0.5 : 0.12}
        initial={motionInfo?.entering ? { ...end, pathLength: reduceMotion ? 1 : 0, opacity: 0 } : false}
        animate={{ ...end, pathLength: 1, opacity: 1 }}
        transition={{
          x1: move(delayOf(e.from)),
          y1: move(delayOf(e.from)),
          x2: move(delayOf(e.to)),
          y2: move(delayOf(e.to)),
          pathLength: reduceMotion ? { duration: 0 } : { duration: 0.34, delay, ease: 'easeOut' },
          opacity: fade(delay),
        }}
        variants={{
          exit: {
            ...(reduceMotion ? {} : { pathLength: 0 }),
            opacity: 0,
            transition: { duration: reduceMotion ? 0.15 : 0.3, delay: reduceMotion ? 0 : TIMING.exitDelay, ease: 'easeIn' },
          },
        }}
        exit="exit"
      />
    );
  };

  const renderNode = (n: MapNode) => {
    const label = nodeLabel(n);
    const w = widthOf(n);
    const h = pillHeight(n);
    const isCenter = n.level === 0;
    const isVirtual = n.id < 0; // category/subcategory node, not a keyword
    const mode = isVirtual ? null : modeOf(n.id);
    const lit = isLit(n);
    // Rarity if added to the search (same tiers as result counts); 0 results → dimmed.
    const ifAdded = !isCenter && !isVirtual && !mode && fitCountOf ? fitCountOf(n.id) : undefined;
    const rarity = ifAdded !== undefined ? getRarity(ifAdded) : null;
    const dead = ifAdded === 0;
    const classes = [
      'kmap-node',
      isCenter ? 'kmap-node--center' : 'kmap-node--explorable',
      isVirtual && 'kmap-node--virtual',
      isVirtual && !isCenter && 'kmap-node--group',
      mode && `is-${mode}`,
      linkClass(n.id),
      discoveries?.has(n.id) && 'is-discovery',
      rarity && rarity !== 'common' && `is-rarity-${rarity}`,
      dead && 'is-dead',
    ].filter(Boolean).join(' ');
    const rareGames = discoveries?.get(n.id);
    const showCount = n.id === hoveredId && !isCenter && hoverCount.status === 'ready';
    // Fits mode: every visible keyword carries its count (outer ring only when lit, to stay calm).
    const fitCount = showFitTags && (n.level === 1 || lit) ? ifAdded : undefined;
    const groupTag = !isCenter && isVirtual ? tagFor?.(n) : undefined;
    const from = plan.nodes.get(n.id)?.from;
    const delay = delayOf(n.id);
    const name = isVirtual ? n.name : titleCase(n.name);
    const ariaLabel = isCenter
      ? `${name}, centre${mode ? `, ${mode}d` : ''}`
      : isVirtual
        ? `${name}${groupTag ? `, ${groupTag}` : ''}. Enter to open`
        : `${name}${mode ? `, ${mode}d` : ''}${ifAdded !== undefined ? `, ${formatCount(ifAdded, false)} if added` : ''}. Enter to explore, A to add, X to exclude`;

    return (
      <motion.g
        key={n.id}
        initial={from && (reduceMotion ? { x: n.x, y: n.y, opacity: 0, scale: 1 } : { x: from.x, y: from.y, opacity: 0, scale: 0.6 })}
        animate={{ x: n.x, y: n.y, opacity: 1, scale: 1 }}
        transition={{ x: move(delay), y: move(delay), scale: move(delay), opacity: fade(delay) }}
        // Exit targets depend on the scene that replaces this one, so they come from
        // AnimatePresence's `custom` (the current plan), not this node's stale props.
        variants={{
          exit: (p: TransitionPlan) => {
            const to = (!reduceMotion && p.exits.get(n.id)) || { x: n.x, y: n.y };
            return {
              x: to.x,
              y: to.y,
              opacity: 0,
              scale: reduceMotion ? 1 : 0.7,
              transition: reduceMotion ? { duration: 0.15 } : { duration: TIMING.exit, delay: TIMING.exitDelay, ease: [0.4, 0, 0.6, 1] },
            };
          },
        }}
        exit="exit"
      >
        {/* Opaque backing outside the dimmed group: lit-state opacity fades the pill, never reveals edges. */}
        <motion.rect
          className="kmap-node-backdrop"
          initial={false}
          animate={{ attrX: -w / 2, attrY: -h / 2, width: w, height: h, rx: h / 2 }}
          transition={move(delay)}
          aria-hidden="true"
        />
        <g
          ref={el => {
            if (el) nodeEls.current.set(n.id, el);
            else nodeEls.current.delete(n.id);
          }}
          className={classes}
          style={{ opacity: (lit ? 1 : 0.4) * (dead ? 0.45 : 1) }}
          data-node-id={n.id}
          role="button"
          aria-disabled={isCenter || undefined}
          tabIndex={n.id === tabStopId ? 0 : -1}
          aria-label={ariaLabel}
          onClick={e => {
            if (e.altKey && !isVirtual) onToggle(n, 'exclude', 'alt_click');
            else onExplore(n);
          }}
          onDoubleClick={e => {
            // First click already travelled here; the double-click also includes it.
            e.stopPropagation();
            if (!isVirtual && mode !== 'include') onToggle(n, 'include', 'double_click');
          }}
          onContextMenu={e => {
            if (isVirtual) return;
            e.preventDefault();
            onToggle(n, 'exclude', 'context_menu');
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onExplore(n);
            } else if (!isVirtual && (e.key === 'a' || e.key === 'A')) {
              e.preventDefault();
              onToggle(n, 'include', 'keyboard');
            } else if (!isVirtual && (e.key === 'x' || e.key === 'X')) {
              e.preventDefault();
              onToggle(n, 'exclude', 'keyboard');
            }
          }}
          onMouseEnter={() => hover(n)}
          onMouseLeave={() => hover(null)}
          onFocus={() => {
            hover(n);
            setFocusId(n.id);
          }}
          onBlur={() => hover(null)}
        >
          {!isCenter && <title>{`${isVirtual ? 'Open' : 'Explore'} ${name}${rareGames ? ` — rare pairing: ${rareGames} games share both` : ''}`}</title>}
          {/* Pill shape morphs when a neighbour becomes the centre. */}
          <motion.rect
            initial={false}
            animate={{ attrX: -w / 2, attrY: -h / 2, width: w, height: h, rx: h / 2 }}
            transition={move(delay)}
          />
          <text
            x={-badgeRoom(n) / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={isCenter ? 13 : 12}
            fontWeight={isCenter ? 600 : 400}
          >
            {label}
          </text>
          {!isCenter && !isVirtual && renderBadge(n, w, mode, lit)}
          {isCenter && !isVirtual && renderCenterActions(n, w, mode)}
          {groupTag && (
            <text className="kmap-count-tag kmap-group-tag" y={h / 2 + 10} textAnchor="middle" dominantBaseline="central" aria-hidden="true">
              {groupTag}
            </text>
          )}
          {rareGames !== undefined && (
            // Discovery mark: a four-point star on the pill's top-left corner.
            <path
              className="kmap-discovery-mark"
              transform={`translate(${-w / 2 + 3} ${-h / 2 + 1})`}
              d="M0 -4.5 L1.2 -1.2 L4.5 0 L1.2 1.2 L0 4.5 L-1.2 1.2 L-4.5 0 L-1.2 -1.2 Z"
              aria-hidden="true"
            />
          )}
          {fitCount !== undefined && !showCount && (
            <text className="kmap-count-tag kmap-fit-tag" y={h / 2 + 10} textAnchor="middle" dominantBaseline="central" aria-hidden="true">
              {formatCount(fitCount, false)}
            </text>
          )}
          {showCount && hoverCount.status === 'ready' && (
            <text
              className={`kmap-count-tag${hoverCount.count === 0 ? ' is-zero' : ''}`}
              y={h / 2 + 11}
              textAnchor="middle"
              dominantBaseline="central"
              aria-hidden="true"
            >
              {hoverCount.count === 0 ? 'no games if added' : `→ ${formatCount(hoverCount.count, hoverCount.capped)}`}
            </text>
          )}
        </g>
      </motion.g>
    );
  };

  return (
    <div className={`kmap-viewport-inner kmap-viewport-inner--${variant}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        width={viewport.width}
        height={viewport.height}
        className={`kmap-svg${camera.zoom > 1 ? ' is-zoomed' : ''}`}
        role="group"
        aria-label={`Keyword map centred on ${titleCase(centerNode.name)}`}
        aria-describedby={helpId}
        data-transition={plan.direction}
        onKeyDown={onKeyDown}
        {...camera.handlers}
      >
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0%" style={{ stopColor: 'var(--c-emerald)', stopOpacity: 0.14 }} />
            <stop offset="100%" style={{ stopColor: 'var(--c-emerald)', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        {/* Transparent hit layer so drags/double-clicks register on empty space. */}
        <rect className="kmap-bg" width={viewport.width} height={viewport.height} />
        <g ref={cameraRef}>
          <circle className="kmap-glow" cx={centerNode.x} cy={centerNode.y} r={140} fill={`url(#${glowId})`} />
          {!reduceMotion && (
            <motion.circle
              key={`pulse-${sceneKey}`}
              className="kmap-pulse"
              cx={centerNode.x}
              cy={centerNode.y}
              initial={{ r: 16, opacity: 0.5 }}
              animate={{ r: 80, opacity: 0 }}
              transition={{ duration: 0.75, delay: TIMING.focusMove + 0.12, ease: 'easeOut' }}
            />
          )}
          <g>
            <AnimatePresence custom={plan}>{plan.edges.map(renderEdge)}</AnimatePresence>
          </g>
          <g className="kmap-energy-layer" aria-hidden="true">
            {activePath.map(({ from, to }) => (
              <line key={`${from.id}>${to.id}`} className="kmap-energy" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
            ))}
          </g>
          {sparks.length > 0 && (
            <g key={`sparks-${sceneKey}`} aria-hidden="true">
              {sparks.map((sp, i) => (
                <motion.circle
                  key={i}
                  className="kmap-spark"
                  cx={centerNode.x}
                  cy={centerNode.y}
                  r={1.6}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{ x: sp.dx, y: sp.dy, opacity: [0, 0.9, 0] }}
                  transition={{ duration: 0.7, delay: sp.delay, ease: 'easeOut' }}
                />
              ))}
            </g>
          )}
          <g>
            <AnimatePresence custom={plan}>{nodes.map(renderNode)}</AnimatePresence>
          </g>
        </g>
      </svg>
      {variant === 'desktop' && (
        <div className="kmap-controls" role="group" aria-label="Map zoom">
          <button type="button" className="kmap-control" onClick={() => camera.zoomBy(1.25)} disabled={camera.zoom >= ZOOM_MAX} aria-label="Zoom in">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="kmap-control" onClick={() => camera.zoomBy(0.8)} disabled={camera.zoom <= ZOOM_MIN} aria-label="Zoom out">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="kmap-control" onClick={camera.reset} disabled={camera.zoom === 1} aria-label="Reset view">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <p id={helpId} className="sr-only">
        Arrow keys move between keywords. Enter explores, A adds, X excludes, Escape goes back, plus and minus zoom.
      </p>
      <p className="sr-only" aria-live="polite">
        {`${titleCase(centerNode.name)}: ${nodes.length - 1} related keywords`}
      </p>
    </div>
  );
};
