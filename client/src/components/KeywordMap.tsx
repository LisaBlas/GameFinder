import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Ban, ChevronLeft, ChevronRight, Plus, RefreshCw, X } from 'lucide-react';
import { useFilters, type Filter } from '../context/FilterContext';
import {
  DESKTOP_SHAPE,
  buildCategoryFallbackData,
  titleCase,
  nameKey,
  selectKeywordGraph,
  VIRTUAL_CENTER_ID,
  type GraphShape,
  type MapNode,
  type MapSeed,
} from '../lib/keywordMap';
import { layoutKeywordMap, type LayoutOptions, type Size } from '../lib/keywordMapLayout';
import { measuredNodeWidth } from '../lib/measureLabel';
import {
  MAIN_CATEGORIES,
  MAIN_CATEGORY_META,
  findKeywordHome,
  getAllKeywordsForSubcategory,
  getAvailableSubcategories,
  getCategoryDescription,
  getKeywordCountForSubcategory,
  getSubcategoryDescription,
  getSubcategoryIconComponent,
  type MainCategory,
} from '../lib/keywordTaxonomy';
import { planTransition, snapshotScene, type MapNavState, type SceneSnapshot } from '../lib/keywordMapMotion';
import { useMapHistory } from '../hooks/useMapHistory';
import { KeywordMapScene, type KeywordMode, type ToggleMethod } from './KeywordMapScene';
import { ensureLists, prefetchLists, useKeywordGraph } from '../lib/keywordGraphStore';
import { buildSearchPayload, withKeyword } from '../lib/searchPayload';
import { craftStrength, formatCount, peekCount, useSearchCount } from '../lib/searchCount';
import { setMapKeyword } from '../lib/mapLink';
import { markMapSourced, track } from '../lib/funnel';

const CATEGORY = 'Keywords';

type Kw = { id: number; name: string };
const EMPTY_SHOWN: ReadonlySet<string> = new Set();

export interface MapLocation {
  category: MainCategory | null;
  subcategory: string | null;
  /** Keywords explored from the subcategory centre; the last one is the map centre. */
  trail: Kw[];
}

const ROOT: MapLocation = { category: null, subcategory: null, trail: [] };

/** One level up: drop the last explored keyword, then the subcategory, then the category. */
const parentLocation = (loc: MapLocation): MapLocation =>
  loc.trail.length > 0
    ? { ...loc, trail: loc.trail.slice(0, -1) }
    : loc.subcategory
      ? { ...loc, subcategory: null }
      : ROOT;

const VARIANTS: Record<'desktop' | 'mobile', { shape: GraphShape; layout: Partial<LayoutOptions> }> = {
  desktop: { shape: DESKTOP_SHAPE, layout: {} },
  // Thumb-sized: fewer, bigger targets on the diagonals (a portrait screen has no room
  // beside the centre pill), centre slightly above the midpoint.
  mobile: {
    shape: { level1Count: 4, level2PerParent: 1 },
    layout: { centerY: 0.44, slotOffsetDeg: 45, ringWidth: { inner: 0.27, outer: 0.4 } },
  },
};

interface Props {
  variant?: 'desktop' | 'mobile';
  initialLocation?: MapLocation;
  /** Mobile only: leave map mode. */
  onClose?: () => void;
}

/**
 * Keyword explorer: 3 category doors → subcategory grid → keyword map.
 *
 * In the map, clicking a node re-centres on it (explore); adding to the search
 * is explicit — the badge inside each pill, double-click, or Include/Exclude
 * for the centred keyword. Refresh swaps in keywords not yet shown for this
 * centre (both rings), then starts over once the pool is used up.
 *
 * Every navigation is a browser-history entry, so Back retraces the journey.
 * Keywords added from elsewhere (search bar, game-card tags, shared URLs)
 * re-centre the map on them (replacing the current entry).
 */
export const KeywordMap: React.FC<Props> = ({ variant = 'desktop', initialLocation, onClose }) => {
  const { selectedFilters, addFilter, removeFilter, requireDeveloper, requireRating } = useFilters();
  const { shape, layout } = VARIANTS[variant];
  const { location, navigate, depthRef } = useMapHistory<MapLocation>(variant, initialLocation ?? ROOT);
  const { category, subcategory, trail } = location;
  /** Keyword names already shown for the current centre, so refresh only brings new ones. */
  const [shown, setShown] = useState<{
    key: string;
    names: ReadonlySet<string>; // every name shown since the last start-over
    last: ReadonlySet<string>; // names on the previous map
    round: number;
    spin: 1 | -1;
  }>({ key: '', names: EMPTY_SHOWN, last: EMPTY_SHOWN, round: 0, spin: 1 });

  const step: 'categories' | 'subcategories' | 'map' =
    trail.length > 0 || subcategory ? 'map' : category ? 'subcategories' : 'categories';

  // Funnel: entering the map (from a door, a deep link, or a keyword added elsewhere).
  const wasMapRef = useRef(false);
  useEffect(() => {
    if (step === 'map' && !wasMapRef.current) track('map_open', { variant, start: trail.length > 0 ? 'keyword' : 'subcategory' });
    wasMapRef.current = step === 'map';
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── selection state ────────────────────────────────────────────────
  const keywordFilters = useMemo(
    () => new Map(selectedFilters.filter(f => f.category === CATEGORY).map(f => [Number(f.id), f] as const)),
    [selectedFilters],
  );
  const modeOf = useCallback(
    (id: number): KeywordMode | null => {
      const f = keywordFilters.get(id);
      return f ? (f.mode === 'exclude' ? 'exclude' : 'include') : null;
    },
    [keywordFilters],
  );

  /** Ids this component just included, so the follow-latest effect doesn't re-centre on them. */
  const addedHereRef = useRef(new Set<number>());

  const asFilter = (kw: Kw): Filter => keywordFilters.get(kw.id) ?? { id: kw.id, name: titleCase(kw.name), category: CATEGORY };
  const payloadOpts = { requireDeveloper, requireRating };
  /** The search as it would be with `kw` included (null: nothing to count). */
  const previewWith = (kw: Kw) => buildSearchPayload(withKeyword(selectedFilters, asFilter(kw), 'include'), payloadOpts);

  const setMode = (kw: Kw, mode: KeywordMode, method: ToggleMethod = 'inspector') => {
    const existing: Filter | undefined = keywordFilters.get(kw.id);
    const removing = Boolean(existing && modeOf(kw.id) === mode);
    const preview = !removing && mode === 'include' ? previewWith(kw) : null;
    const known = preview ? peekCount(preview) : undefined;
    track('map_keyword_toggle', {
      keyword: titleCase(kw.name),
      mode,
      action: removing ? 'remove' : 'add',
      method,
      variant,
      zero_result: known ? known.count === 0 : undefined,
    });
    if (removing) {
      removeFilter(existing!.id, CATEGORY);
      return;
    }
    if (mode === 'include') {
      addedHereRef.current.add(kw.id);
      markMapSourced(kw.id);
    }
    addFilter({ id: existing?.id ?? kw.id, name: existing?.name ?? titleCase(kw.name), category: CATEGORY, mode });
  };

  // ── follow keywords added outside the map ─────────────────────────
  const includes = selectedFilters.filter(f => f.category === CATEGORY && f.mode !== 'exclude');
  const includeKey = includes.map(f => Number(f.id)).join(',');
  // A map opened at a given place (mobile) shouldn't immediately jump to an older pick.
  const prevIncludeRef = useRef(new Set<number>(initialLocation ? includes.map(f => Number(f.id)) : []));

  useEffect(() => {
    const prev = prevIncludeRef.current;
    prevIncludeRef.current = new Set(includes.map(f => Number(f.id)));

    const latest = includes.filter(f => !prev.has(Number(f.id))).pop();
    if (!latest) return;
    const id = Number(latest.id);
    if (addedHereRef.current.delete(id)) return;

    const home = findKeywordHome(id);
    navigate(
      { category: home?.category ?? category, subcategory: home?.subcategory ?? null, trail: [{ id, name: latest.name }] },
      { replace: true },
    );
  }, [includeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── navigation ────────────────────────────────────────────────────
  const goBack = () => {
    if (step === 'categories') onClose?.();
    else if (depthRef.current > 0) window.history.back();
    else navigate(parentLocation(location), { replace: true });
  };

  const exploreNode = (node: MapNode) => {
    if (node.level === 0) return;
    track('map_explore', { keyword: titleCase(node.name), depth: trail.length + 1, variant });
    navigate({ ...location, trail: [...trail, { id: node.id, name: node.name }] });
  };

  // ── map data ──────────────────────────────────────────────────────
  const centerKw = trail[trail.length - 1] ?? null;
  const center: Kw | null = useMemo(
    () => centerKw ?? (subcategory ? { id: VIRTUAL_CENTER_ID, name: subcategory } : null),
    [centerKw, subcategory],
  );
  const centerKey = center ? `${subcategory ?? ''}:${center.id}` : '';
  const current = shown.key === centerKey;
  const seen = current ? shown.names : EMPTY_SHOWN;
  const last = current ? shown.last : EMPTY_SHOWN;
  const round = current ? shown.round : 0;
  const spin = current ? shown.spin : 1;

  // ── graph slices ──────────────────────────────────────────────────
  // Lists arrive from /api/keyword-graph; a keyword centre needs its own list and
  // each neighbour's (depth 2), a subcategory centre needs its keywords' lists.
  const loadedLists = useKeywordGraph();
  const subcategoryPool = useMemo(
    () => (subcategory ? getAllKeywordsForSubcategory(subcategory).map(k => ({ id: k.id, name: k.name })) : []),
    [subcategory],
  );
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    const ids = centerKw ? [centerKw.id] : subcategoryPool.map(k => k.id);
    if (ids.length === 0) return;
    setLoadError(false);
    ensureLists(ids, centerKw ? 2 : 1).catch(() => setLoadError(true));
  }, [centerKw?.id, subcategoryPool]); // eslint-disable-line react-hooks/exhaustive-deps
  const ready = centerKw
    ? centerKw.id in loadedLists && loadedLists[centerKw.id].every(n => n.id in loadedLists)
    : subcategoryPool.every(k => k.id in loadedLists);
  const data = ready ? loadedLists : null;

  const fallbackSubcategory = centerKw ? findKeywordHome(centerKw.id)?.subcategory : undefined;
  const fallbackKeywords = useMemo(
    () => (fallbackSubcategory ? getAllKeywordsForSubcategory(fallbackSubcategory).map(k => ({ id: k.id, name: k.name })) : []),
    [fallbackSubcategory],
  );
  const isCategoryFallback = Boolean(centerKw && data && !data[centerKw.id]?.length && fallbackKeywords.length > 1);
  const graphData = useMemo(
    () => (isCategoryFallback ? buildCategoryFallbackData(fallbackKeywords) : data),
    [isCategoryFallback, fallbackKeywords, data],
  );
  const pool: MapSeed[] = useMemo(() => {
    if (centerKw) return isCategoryFallback ? fallbackKeywords : data?.[centerKw.id] ?? [];
    return subcategoryPool;
  }, [centerKw, subcategoryPool, data, isCategoryFallback, fallbackKeywords]);
  const graph = useMemo(
    () => (graphData && center ? selectKeywordGraph(center, pool, graphData, { inner: seen, outer: last }, shape) : []),
    [graphData, center, pool, seen, last, shape],
  );

  // ── viewport ──────────────────────────────────────────────────────
  // Map coordinates are CSS pixels of the measured viewport, so text never scales.
  const [viewport, setViewport] = useState<Size | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const viewportRef = useCallback((el: HTMLDivElement | null) => {
    resizeObserver.current?.disconnect();
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setViewport(v => (v && v.width === width && v.height === height ? v : { width, height }));
    });
    ro.observe(el);
    resizeObserver.current = ro;
  }, []);
  const usable = viewport !== null && viewport.width > 120 && viewport.height > 120;

  // ── layout + transition plan ──────────────────────────────────────
  // Both read the scene last committed to screen; the ref only advances after commit.
  const sceneRef = useRef<SceneSnapshot | null>(null);
  const nodes = useMemo(
    () =>
      usable && graph.length > 1
        ? layoutKeywordMap(graph, { ...layout, viewport: viewport!, widthOf: measuredNodeWidth, previous: sceneRef.current?.nodes })
        : [],
    [graph, viewport, usable, layout],
  );

  const reduceMotion = useReducedMotion() ?? false;
  const nav: MapNavState = useMemo(
    () => ({ path: [subcategory ?? '', ...trail.map(k => k.id)], round, spin }),
    [subcategory, trail, round, spin],
  );
  const plan = useMemo(() => planTransition(sceneRef.current, nav, nodes), [nav, nodes]);
  useEffect(() => {
    sceneRef.current = nodes.length >= 2 ? snapshotScene(nav, nodes, plan.edges) : null;
  }, [nav, nodes, plan]);

  // Exploring a visible neighbour should be instant: warm its slice while idle.
  useEffect(() => {
    const next = nodes.filter(n => n.level === 1).map(n => n.id);
    if (next.length) prefetchLists(next, 2);
  }, [nodes]);

  const onHoverNode = useCallback((node: MapNode | null) => {
    setMapKeyword(node && node.id !== VIRTUAL_CENTER_ID ? node.id : null);
    if (node && node.level === 2) prefetchLists([node.id], 2);
  }, []);
  useEffect(() => () => setMapKeyword(null), []);

  /** Hover preview: the search with this keyword added (nothing for ones already in it). */
  const previewPayload = (node: MapNode) =>
    node.level === 0 || node.id === VIRTUAL_CENTER_ID || modeOf(node.id) ? null : previewWith(node);

  // Inspector: what the search looks like with the centred keyword (added, if it isn't yet).
  const centerMode = centerKw ? modeOf(centerKw.id) : null;
  const inspectorPayload = centerKw
    ? centerMode
      ? buildSearchPayload(selectedFilters, payloadOpts)
      : previewWith(centerKw)
    : null;
  const inspectorCount = useSearchCount(inspectorPayload, 150);
  const hasOtherIncludes = selectedFilters.some(f => f.mode !== 'exclude' && !(f.category === CATEGORY && centerKw && Number(f.id) === centerKw.id));

  const onMap = useMemo(() => new Set(graph.filter(n => n.level > 0).map(n => nameKey(n.name))), [graph]);
  const shownNow = useMemo(() => new Set(Array.from(seen).concat(Array.from(onMap))), [seen, onMap]);
  const remaining = pool.filter(n => !shownNow.has(nameKey(n.name))).length;
  const canRefresh = pool.length > shape.level1Count;

  const refresh = (dir: 1 | -1 = 1) => {
    if (!canRefresh) return;
    setShown(
      remaining > 0
        ? { key: centerKey, names: shownNow, last: onMap, round: round + 1, spin: dir }
        : { key: centerKey, names: EMPTY_SHOWN, last: onMap, round: round + 1, spin: dir }, // pool used up: start over
    );
  };

  // Long journeys overflow the breadcrumb: keep the current keyword in view.
  const crumbsRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = crumbsRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [location]);

  // ── renderers ─────────────────────────────────────────────────────
  const renderCategories = () => (
    <div className="kmap-doors">
      {MAIN_CATEGORIES.filter(cat => getAvailableSubcategories(cat).length > 0).map(cat => {
        const { short, hint, icon: Icon } = MAIN_CATEGORY_META[cat];
        return (
          <button
            key={cat}
            type="button"
            className="kmap-door"
            onClick={() => navigate({ category: cat, subcategory: null, trail: [] })}
            title={getCategoryDescription(cat)}
          >
            <span className="kmap-door-icon">
              <Icon className="h-7 w-7" />
            </span>
            <span className="kmap-door-label">{short}</span>
            <span className="kmap-door-hint">{hint}</span>
          </button>
        );
      })}
    </div>
  );

  const renderSubcategories = (cat: MainCategory) => (
    <div className="kmap-sub-grid">
      {getAvailableSubcategories(cat).map(name => {
        const Icon = getSubcategoryIconComponent(name);
        return (
          <button
            key={name}
            type="button"
            className="kmap-sub-tile"
            onClick={() => navigate({ category: cat, subcategory: name, trail: [] })}
            title={getSubcategoryDescription(cat, name)}
          >
            <span className="kmap-sub-icon">
              <Icon className="h-4 w-4" />
            </span>
            <span className="kmap-sub-name">{name}</span>
            <span className="kmap-sub-count">{getKeywordCountForSubcategory(name)}</span>
          </button>
        );
      })}
    </div>
  );

  const renderMap = () => {
    let content: React.ReactNode = null;
    if (loadError && !data) {
      content = (
        <div className="kmap-empty">
          Couldn't load the keyword map.{' '}
          <button type="button" className="kmap-retry" onClick={() => {
            setLoadError(false);
            ensureLists(centerKw ? [centerKw.id] : subcategoryPool.map(k => k.id), centerKw ? 2 : 1).catch(() => setLoadError(true));
          }}>
            Retry
          </button>
        </div>
      );
    } else if (!data) content = <div className="kmap-empty">Mapping keywords…</div>;
    else if (graph.length < 2) {
      content = <div className="kmap-empty">No related keywords mapped for {titleCase(center?.name ?? '')} yet.</div>;
    } else if (usable && nodes.length > 1) {
      content = (
        <KeywordMapScene
          nodes={nodes}
          plan={plan}
          viewport={viewport!}
          widthOf={measuredNodeWidth}
          reduceMotion={reduceMotion}
          sceneKey={`${centerKey}:${round}`}
          variant={variant}
          modeOf={modeOf}
          onExplore={exploreNode}
          onToggle={setMode}
          onHoverNode={onHoverNode}
          previewPayload={previewPayload}
          onSwipe={variant === 'mobile' ? refresh : undefined}
        />
      );
    }
    return (
      <div ref={viewportRef} className={`kmap-viewport kmap-viewport--${variant}`}>
        {content}
        {isCategoryFallback && graph.length > 1 && <span className="kmap-relation-label">Related by category</span>}
      </div>
    );
  };

  const renderInspector = () => {
    if (!centerKw) {
      return (
        <p className="kmap-hint">
          {variant === 'mobile' ? 'Tap a keyword to explore it, ' : 'Click a keyword to see what it pairs with. Use '}
          <Plus className="inline h-3 w-3" /> to add it to your search.
          {variant === 'mobile' && canRefresh && ' Swipe for more.'}
        </p>
      );
    }
    const mode = centerMode;
    const name = titleCase(centerKw.name);
    const c = inspectorCount;
    // Adding is still allowed at zero results; it just warns first (docs/MAP_FEATURE.md).
    const zeroIfAdded = !mode && c.status === 'ready' && c.count === 0;
    let countLine: React.ReactNode = null;
    if (c.status === 'loading') countLine = <span className="kmap-inspector-count is-loading">Counting games…</span>;
    else if (c.status === 'ready') {
      const strength = craftStrength(c.count, c.capped);
      const label = formatCount(c.count, c.capped);
      countLine = zeroIfAdded ? (
        <span className="kmap-inspector-count is-zero" role="status">
          {hasOtherIncludes ? 'No games match your search with this added' : `No games tagged ${name} yet`}
        </span>
      ) : (
        <span className="kmap-inspector-count" role="status">
          {mode ? `Your search: ${label}` : hasOtherIncludes ? `With your search: ${label}` : `${label} with ${name}`}
          {strength && <span className={`kmap-strength kmap-strength--${strength.replace(' ', '-')}`}>{strength}</span>}
        </span>
      );
    }
    return (
      <div className="kmap-inspector">
        <div className="kmap-inspector-text">
          <span className="kmap-inspector-name">{name}</span>
          {countLine}
        </div>
        <button
          type="button"
          className={`kmap-action kmap-action--include${mode === 'include' ? ' is-active' : ''}${zeroIfAdded ? ' is-warn' : ''}`}
          onClick={() => setMode(centerKw, 'include')}
          aria-pressed={mode === 'include'}
          title={zeroIfAdded ? 'Adding this returns no games with your current search' : undefined}
        >
          <Plus className="h-3.5 w-3.5" />
          {mode === 'include' ? 'Included' : 'Include'}
        </button>
        <button
          type="button"
          className={`kmap-action kmap-action--exclude${mode === 'exclude' ? ' is-active' : ''}`}
          onClick={() => setMode(centerKw, 'exclude')}
          aria-pressed={mode === 'exclude'}
        >
          <Ban className="h-3.5 w-3.5" />
          {mode === 'exclude' ? 'Excluded' : 'Exclude'}
        </button>
      </div>
    );
  };

  const renderHeader = () => {
    const close = onClose && (
      <button type="button" className="kmap-icon-btn" onClick={onClose} aria-label="Close keyword map">
        <X className="h-4 w-4" />
      </button>
    );
    if (step === 'categories') {
      return (
        <div className="kmap-header">
          <div className="min-w-0 flex-1">
            <h2 className="kmap-title">What are you in the mood for?</h2>
            <p className="kmap-subtitle">Pick a direction, then explore the keyword map.</p>
          </div>
          {close}
        </div>
      );
    }

    const crumbs: Array<{ label: string; to: MapLocation }> = [];
    if (category) crumbs.push({ label: MAIN_CATEGORY_META[category].short, to: { category, subcategory: null, trail: [] } });
    if (subcategory) crumbs.push({ label: subcategory, to: { category, subcategory, trail: [] } });
    trail.forEach((kw, i) => crumbs.push({ label: titleCase(kw.name), to: { category, subcategory, trail: trail.slice(0, i + 1) } }));

    return (
      <div className="kmap-header">
        <button type="button" className="kmap-icon-btn" onClick={goBack} aria-label="Back">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <nav ref={crumbsRef} className="kmap-crumbs" aria-label="Keyword map path">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <React.Fragment key={`${i}-${c.label}`}>
                {i > 0 && <ChevronRight className="kmap-crumb-sep" aria-hidden="true" />}
                {isLast ? (
                  <span className="kmap-crumb kmap-crumb--current" aria-current="page">{c.label}</span>
                ) : (
                  <button type="button" className="kmap-crumb" onClick={() => navigate(c.to)}>{c.label}</button>
                )}
              </React.Fragment>
            );
          })}
        </nav>
        {step === 'map' && (
          <button
            type="button"
            className="kmap-icon-btn"
            onClick={() => refresh()}
            disabled={!canRefresh}
            aria-label="Show other keywords"
            title={!canRefresh ? 'No other keywords to show' : remaining > 0 ? `Show other keywords (${remaining} more)` : 'Start over'}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        {close}
      </div>
    );
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, [contenteditable="true"]')) return;
    if (step === 'categories' && !onClose) return;
    e.preventDefault();
    goBack();
  };

  return (
    <section className={variant === 'mobile' ? 'kmap kmap--mobile' : 'kmap hidden lg:flex'} onKeyDown={onKeyDown}>
      {renderHeader()}
      <div className="kmap-body">
        {step === 'categories' && renderCategories()}
        {step === 'subcategories' && category && (
          <>
            <p className="kmap-subtitle mb-3">{getCategoryDescription(category)}</p>
            {renderSubcategories(category)}
          </>
        )}
        {step === 'map' && (
          <>
            {renderMap()}
            {renderInspector()}
          </>
        )}
      </div>
    </section>
  );
};

export default KeywordMap;
