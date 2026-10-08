import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Compass, Home, Link2, ListFilter, RefreshCw, Sparkles, X } from 'lucide-react';
import { useFilters, type Filter } from '../context/FilterContext';
import {
  DESKTOP_SHAPE,
  buildCategoryFallbackData,
  titleCase,
  nameKey,
  selectKeywordGraph,
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
  categoryNodeId,
  getAvailableSubcategories,
  getCategoryDescription,
  getKeywordCountForSubcategory,
  getSubcategoryIconComponent,
  subcategoryFromNodeId,
  subcategoryNodeId,
  type MainCategory,
} from '../lib/keywordTaxonomy';
import { planTransition, snapshotScene, type MapNavState, type SceneSnapshot } from '../lib/keywordMapMotion';
import { useMapHistory } from '../hooks/useMapHistory';
import { KeywordMapScene, type KeywordMode, type ToggleMethod } from './KeywordMapScene';
import { ensureLists, prefetchLists, useKeywordGraph } from '../lib/keywordGraphStore';
import { buildSearchPayload, withKeyword } from '../lib/searchPayload';
import { formatCount, peekCount } from '../lib/searchCount';
import { setMapKeyword } from '../lib/mapLink';
import { markMapSourced, track } from '../lib/funnel';
import { findDiscoveries } from '../lib/keywordDiscoveries';
import { sendLightPulse } from '../lib/lightPulse';
import { storyFor } from '../lib/keywordStories';
import { JOURNEY_PARAM, decodeJourney, encodeJourney, journeyUrl } from '../lib/mapJourney';
import { useAmbientPause } from '../hooks/useAmbientPause';
import { MAX_PROBE, useKeywordFit } from '../lib/keywordFit';

const FIT_MODE_KEY = 'kmap-fit-mode';
const readFitMode = () => {
  try {
    return localStorage.getItem(FIT_MODE_KEY) === '1';
  } catch {
    return false;
  }
};

const CATEGORY = 'Keywords';

/** Subcategory shortcuts shown on each category door before "+N more". */
const DOOR_SUBCATEGORY_LIMIT = { desktop: 6, mobile: 4 } as const;

/** Per category: its subcategories and the unique keyword ids across them. */
const CATEGORY_STATS = Object.fromEntries(
  MAIN_CATEGORIES.map(cat => {
    const subcategories = getAvailableSubcategories(cat);
    const ids = Array.from(new Set(subcategories.flatMap(sub => getAllKeywordsForSubcategory(sub).map(k => k.id))));
    return [cat, { subcategories, ids }];
  }),
) as Record<MainCategory, { subcategories: string[]; ids: number[] }>;

type Kw = { id: number; name: string };
const EMPTY_SHOWN: ReadonlySet<string> = new Set();

export interface MapLocation {
  category: MainCategory | null;
  subcategory: string | null;
  /** Keywords explored from the subcategory centre; the last one is the map centre. */
  trail: Kw[];
}

const ROOT: MapLocation = { category: null, subcategory: null, trail: [] };

/**
 * A journey shared via `?map=` (lib/mapJourney.ts), for whichever map is the
 * visible one at this viewport. The param is consumed so later URL syncs and
 * reloads don't replay it.
 */
let takenJourney: { value: MapLocation | null } | null = null; // idempotent: safe under double-invoked initialisers

export function takeSharedJourney(target: 'desktop' | 'mobile'): MapLocation | null {
  if (typeof window === 'undefined') return null;
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  if ((target === 'desktop') !== isDesktop) return null;
  if (takenJourney) return takenJourney.value;
  // FilterContext's URL sync carries `map` over until it's taken here (the map may mount late).
  const url = new URL(window.location.href);
  if (!url.searchParams.has(JOURNEY_PARAM)) return null;
  takenJourney = { value: decodeJourney(url.searchParams.get(JOURNEY_PARAM), MAIN_CATEGORIES, getAvailableSubcategories) };
  url.searchParams.delete(JOURNEY_PARAM);
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  return takenJourney.value;
}

const CATEGORY_TEXTURE: Record<MainCategory, string> = {
  'Mechanics & Systems': 'mechanics',
  'Setting & World': 'setting',
  'Aesthetics & Style': 'aesthetics',
};

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

/** A category scene shows its subcategories as nodes: more per page, no outer ring. */
const CATEGORY_SCENE: Record<'desktop' | 'mobile', { shape: GraphShape; layout: Partial<LayoutOptions> }> = {
  desktop: {
    shape: { level1Count: 8, level2PerParent: 0 },
    layout: { ringWidth: { inner: 0.34, outer: 0.385 }, ringHeight: { inner: 0.74, outer: 0.84 } },
  },
  mobile: {
    shape: { level1Count: 4, level2PerParent: 0 },
    layout: { centerY: 0.44, slotOffsetDeg: 45, ringWidth: { inner: 0.27, outer: 0.4 }, ringHeight: { inner: 0.55, outer: 0.84 } },
  },
};

/**
 * The in-window toolbar's footprint (top-right): refresh + copy link, plus the
 * zoom row on desktop. Pills are laid out around it (layout `obstacles`).
 */
const TOOLBAR_FOOTPRINT: Record<'desktop' | 'mobile', { width: number; height: number }> = {
  desktop: { width: 112, height: 80 },
  mobile: { width: 84, height: 46 },
};

interface Props {
  variant?: 'desktop' | 'mobile';
  initialLocation?: MapLocation;
  /** Mobile only: leave map mode. */
  onClose?: () => void;
  /** Keyword/game search, shown at the top of the section. */
  search?: React.ReactNode;
  /** "Need a spark?" content (the roll/discovery deck), swapped in for the map on demand. */
  spark?: React.ReactNode;
  /** Search actions (Clear, Search) for the map's bottom bar. */
  actions?: React.ReactNode;
  /** Current user selection, shown with the search actions below the map. */
  selection?: React.ReactNode;
}

/**
 * Keyword explorer: 3 category doors → category map (its subcategories as
 * nodes) → subcategory map (its keywords) → keyword maps.
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
export const KeywordMap: React.FC<Props> = ({ variant = 'desktop', initialLocation, onClose, search, spark, actions, selection }) => {
  const { selectedFilters, addFilter, removeFilter, requireDeveloper, requireRating } = useFilters();
  const [sparkOpen, setSparkOpen] = useState(false);
  // Start: an explicit location (mobile sheet), else a shared journey link, else the doors.
  const [start] = useState(() => {
    const shared = initialLocation ? null : variant === 'desktop' ? takeSharedJourney('desktop') : null;
    // A shared link's own keywords hydrate around mount; don't let them re-centre the journey.
    const linkHasKeywords = new URLSearchParams(window.location.search).has('kw');
    return { location: initialLocation ?? shared ?? ROOT, skipFirstFollow: Boolean(shared && linkHasKeywords) };
  });
  const { location, navigate, depthRef } = useMapHistory<MapLocation>(variant, start.location);
  const sectionRef = useRef<HTMLElement>(null);
  const ambientPaused = useAmbientPause(sectionRef);
  const { category, subcategory, trail } = location;
  /** Keyword names already shown for the current centre, so refresh only brings new ones. */
  const [shown, setShown] = useState<{
    key: string;
    names: ReadonlySet<string>; // every name shown since the last start-over
    last: ReadonlySet<string>; // names on the previous map
    round: number;
    spin: 1 | -1;
  }>({ key: '', names: EMPTY_SHOWN, last: EMPTY_SHOWN, round: 0, spin: 1 });

  const step: 'categories' | 'map' = category || subcategory || trail.length > 0 ? 'map' : 'categories';
  const sceneKind: 'category' | 'subcategory' | 'keyword' = trail.length > 0 ? 'keyword' : subcategory ? 'subcategory' : 'category';
  const { shape, layout } = sceneKind === 'category' ? CATEGORY_SCENE[variant] : VARIANTS[variant];

  // Funnel: entering the map (from a door, a deep link, or a keyword added elsewhere).
  const wasMapRef = useRef(false);
  useEffect(() => {
    if (step === 'map' && !wasMapRef.current) track('map_open', { variant, start: sceneKind });
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
      sendLightPulse(sectionRef.current?.querySelector(`[data-node-id="${kw.id}"]`) ?? null);
    }
    addFilter({ id: existing?.id ?? kw.id, name: existing?.name ?? titleCase(kw.name), category: CATEGORY, mode });
  };

  // ── follow keywords added outside the map ─────────────────────────
  const includes = selectedFilters.filter(f => f.category === CATEGORY && f.mode !== 'exclude');
  const includeKey = includes.map(f => Number(f.id)).join(',');
  // A map opened at a given place (mobile) shouldn't immediately jump to an older pick.
  const prevIncludeRef = useRef(new Set<number>(initialLocation ? includes.map(f => Number(f.id)) : []));
  const skipFollowRef = useRef(start.skipFirstFollow);

  useEffect(() => {
    const prev = prevIncludeRef.current;
    prevIncludeRef.current = new Set(includes.map(f => Number(f.id)));

    const latest = includes.filter(f => !prev.has(Number(f.id))).pop();
    if (!latest) return;
    if (skipFollowRef.current) {
      skipFollowRef.current = false;
      return;
    }
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
    const sub = subcategoryFromNodeId(node.id);
    if (sub) {
      track('map_explore', { subcategory: sub.subcategory, depth: 0, variant });
      navigate({ category: sub.category, subcategory: sub.subcategory, trail: [] });
      return;
    }
    track('map_explore', { keyword: titleCase(node.name), depth: trail.length + 1, variant });
    navigate({ ...location, trail: [...trail, { id: node.id, name: node.name }] });
  };

  // ── map data ──────────────────────────────────────────────────────
  const centerKw = trail[trail.length - 1] ?? null;
  // Centre: a keyword, else the subcategory, else the category — the latter two as stable
  // negative ids, so the subcategory you open glides from its slot into the centre.
  const center: Kw | null = useMemo(
    () =>
      centerKw ??
      (subcategory
        ? { id: subcategoryNodeId(subcategory), name: subcategory }
        : category
          ? { id: categoryNodeId(category), name: MAIN_CATEGORY_META[category].title }
          : null),
    [centerKw, subcategory, category],
  );
  const centerKey = center ? `${category ?? ''}:${subcategory ?? ''}:${center.id}` : '';
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
  // Freeze the snapshot per centre once ready: later slices (e.g. idle prefetch) only add
  // lists, and re-deriving the graph from them would re-plan the scene mid-transition.
  const sliceKey = centerKw ? `k:${centerKw.id}` : subcategory ? `s:${subcategory}` : `c:${category ?? ''}`;
  const frozenRef = useRef<{ key: string; data: typeof loadedLists } | null>(null);
  if (ready && frozenRef.current?.key !== sliceKey) frozenRef.current = { key: sliceKey, data: loadedLists };
  const data = ready && frozenRef.current?.key === sliceKey ? frozenRef.current.data : null;

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
  // A category scene's "pool" is its subcategories (curated order; bigger ones get heavier edges).
  const categoryPool = useMemo<MapSeed[]>(
    () =>
      category && !subcategory && !centerKw
        ? getAvailableSubcategories(category).map(name => ({ id: subcategoryNodeId(name), name, score: getKeywordCountForSubcategory(name) }))
        : [],
    [category, subcategory, centerKw],
  );
  const pool: MapSeed[] = useMemo(() => {
    if (centerKw) return isCategoryFallback ? fallbackKeywords : data?.[centerKw.id] ?? [];
    return subcategory ? subcategoryPool : categoryPool;
  }, [centerKw, subcategory, subcategoryPool, categoryPool, data, isCategoryFallback, fallbackKeywords]);

  // ── Fits-my-search mode ───────────────────────────────────────────
  // Explore wanders freely; "Fits my search" only shows keywords that would
  // still return games if added to the current search, in every subcategory.
  const [fitMode, setFitModeState] = useState(readFitMode);
  const setFitMode = (on: boolean) => {
    setFitModeState(on);
    try {
      localStorage.setItem(FIT_MODE_KEY, on ? '1' : '0');
    } catch {
      /* per-viewer convenience only */
    }
    track('map_mode', { mode: on ? 'fits' : 'explore', variant });
  };
  const currentSearch = useMemo(
    () => buildSearchPayload(selectedFilters, { requireDeveloper, requireRating }),
    [selectedFilters, requireDeveloper, requireRating],
  );
  const fitActive = fitMode && currentSearch !== null;
  // Counts load in both modes once something is searched: Explore uses them to
  // colour keywords by rarity-if-added; only Fits mode filters by them.
  // Probes are only used when the search is too broad to facet: count exactly what this screen draws from.
  const probeIds = useMemo(
    () => (currentSearch ? pool.filter(n => n.id > 0).slice(0, MAX_PROBE).map(n => n.id) : []),
    [currentSearch, pool],
  );
  const fit = useKeywordFit(currentSearch, probeIds);
  const keywordFits = useCallback(
    (id: number) => {
      if (!fitActive || fit.status === 'off' || fit.status === 'error') return true;
      if (keywordFilters.has(id)) return true; // already in the search: always shown
      const c = fit.countOf(id);
      return c === undefined || c > 0; // unknown (unprobed) is never hidden
    },
    [fitActive, fit, keywordFilters],
  );
  /** "N fit" for a subcategory — only when the facets cover the whole search (else null). */
  const fitCountFor = useCallback(
    (subcategoryName: string): number | null =>
      fitActive && fit.complete && fit.status !== 'error'
        ? getAllKeywordsForSubcategory(subcategoryName).filter(k => keywordFits(k.id) && !keywordFilters.has(k.id)).length
        : null,
    [fitActive, fit, keywordFits, keywordFilters],
  );
  const fits = useCallback(
    (id: number) => {
      const sub = subcategoryFromNodeId(id);
      if (!sub) return keywordFits(id);
      const n = fitCountFor(sub.subcategory);
      return n === null || n > 0;
    },
    [keywordFits, fitCountFor],
  );
  const visiblePool = useMemo(() => (fitActive ? pool.filter(n => fits(n.id)) : pool), [fitActive, pool, fits]);

  const graph = useMemo(
    () =>
      graphData && center
        ? selectKeywordGraph(center, pool, graphData, { inner: seen, outer: last, allow: fitActive ? fits : undefined }, shape)
        : [],
    [graphData, center, pool, seen, last, shape, fitActive, fits],
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
  const laidOut = useMemo(
    () =>
      usable && graph.length > 1
        ? layoutKeywordMap(graph, {
            ...layout,
            viewport: viewport!,
            widthOf: measuredNodeWidth,
            previous: sceneRef.current?.nodes,
            obstacles: [{ x: viewport!.width - TOOLBAR_FOOTPRINT[variant].width, y: 0, ...TOOLBAR_FOOTPRINT[variant] }],
          })
        : [],
    [graph, viewport, usable, layout, variant],
  );
  // Same nodes in the same places → same array, so the transition plan isn't recomputed.
  // While the next centre's slice is loading, hold the current scene on screen instead of
  // unmounting it, so the transition still plays once the data lands.
  const nodesRef = useRef<{ sig: string; nodes: MapNode[]; sceneKey: string }>({ sig: '', nodes: [], sceneKey: '' });
  const holding = laidOut.length === 0 && !ready && !loadError && step === 'map' && nodesRef.current.nodes.length > 1;
  const sig = laidOut.map(n => `${n.id}:${n.level}:${Math.round(n.x)},${Math.round(n.y)}`).join('|');
  if (!holding && sig !== nodesRef.current.sig) nodesRef.current = { sig, nodes: laidOut, sceneKey: `${centerKey}:${round}` };
  const nodes = nodesRef.current.nodes;

  const reduceMotion = useReducedMotion() ?? false;
  // category → subcategory → keywords: each step extends the path, so it animates as "forward".
  const nav: MapNavState = useMemo(
    () => ({ path: [category ?? '', ...(subcategory ? [subcategory] : []), ...trail.map(k => k.id)], round, spin }),
    [category, subcategory, trail, round, spin],
  );
  const livePlan = useMemo(() => planTransition(sceneRef.current, nav, nodes), [nav, nodes]);
  // A held scene keeps its own plan and snapshot: the transition is planned when the new data lands.
  const heldPlanRef = useRef(livePlan);
  if (!holding) heldPlanRef.current = livePlan;
  const plan = heldPlanRef.current;
  useEffect(() => {
    if (holding) return;
    sceneRef.current = nodes.length >= 2 ? snapshotScene(nav, nodes, plan.edges) : null;
  }, [nav, nodes, plan, holding]);

  // Rare-but-strong pairings for the centre (none for the category fallback: no crawl data).
  const discoveries = useMemo(
    () =>
      centerKw && data && !isCategoryFallback
        ? findDiscoveries(data[centerKw.id] ?? [], { eligible: id => findKeywordHome(id) !== null })
        : [],
    [centerKw, data, isCategoryFallback],
  );
  const discoveryMap = useMemo(() => new Map(discoveries.map(d => [d.id, d.games])), [discoveries]);

  // Share this journey: the current URL (which carries the search) plus `?map=`.
  const [shared, setShared] = useState(false);
  const shareJourney = async () => {
    if (!category) return;
    const encoded = encodeJourney({ category, subcategory, trail }, MAIN_CATEGORIES);
    if (!encoded) return;
    const url = journeyUrl(encoded);
    track('map_journey_share', { variant, depth: trail.length });
    try {
      if (variant === 'mobile' && navigator.share) await navigator.share({ title: 'GameFinder keyword map', url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 2000);
    } catch {
      /* share sheet dismissed or clipboard blocked */
    }
  };

  // Exploring a visible neighbour should be instant: warm its slice while idle.
  useEffect(() => {
    const next = nodes.filter(n => n.level === 1).map(n => n.id);
    if (next.length) prefetchLists(next, 2);
  }, [nodes]);

  const onHoverNode = useCallback((node: MapNode | null) => {
    setMapKeyword(node && node.id > 0 ? node.id : null);
    if (node && node.level === 2) prefetchLists([node.id], 2);
  }, []);
  useEffect(() => () => setMapKeyword(null), []);

  /** Hover preview: the search with this keyword added (nothing for ones already in it). */
  const previewPayload = (node: MapNode) =>
    node.level === 0 || node.id < 0 || modeOf(node.id) ? null : previewWith(node);

  const onMap = useMemo(() => new Set(graph.filter(n => n.level > 0).map(n => nameKey(n.name))), [graph]);
  const shownNow = useMemo(() => new Set(Array.from(seen).concat(Array.from(onMap))), [seen, onMap]);
  const remaining = visiblePool.filter(n => !shownNow.has(nameKey(n.name))).length;
  const canRefresh = visiblePool.length > shape.level1Count;

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
  /**
   * Keywords that would still return games if added to the current search
   * (null: no search, still loading, or too broad to facet — counts unknown).
   */
  const fitTally = useCallback(
    (ids: number[]): number | null => {
      if (!currentSearch || !fit.complete || fit.status === 'off' || fit.status === 'error') return null;
      return ids.filter(id => !keywordFilters.has(id) && (fit.countOf(id) ?? 0) > 0).length;
    },
    [currentSearch, fit, keywordFilters],
  );

  const renderCategories = () => {
    const searching = currentSearch !== null;
    const checking = searching && fit.status === 'loading' && !fit.stale;
    return (
      <div className="kmap-doors">
        {MAIN_CATEGORIES.filter(cat => getAvailableSubcategories(cat).length > 0).map(cat => {
          const { title, icon: Icon } = MAIN_CATEGORY_META[cat];
          const { ids, subcategories } = CATEGORY_STATS[cat];
          const fitN = fitTally(ids);
          // With a search, the groups that fit best come first; otherwise curated order.
          const subs = subcategories.map(sub => ({ sub, fit: fitTally(getAllKeywordsForSubcategory(sub).map(k => k.id)) }));
          if (fitN !== null) subs.sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0));
          const shownSubs = subs.slice(0, DOOR_SUBCATEGORY_LIMIT[variant]);
          const hiddenSubs = subcategories.length - shownSubs.length;
          const empty = fitN === 0;
          return (
            <div key={cat} className={`kmap-door${empty ? ' is-empty' : ''}`}>
              <button
                type="button"
                className="kmap-door-main"
                onClick={() => navigate({ category: cat, subcategory: null, trail: [] })}
              >
                <span className="kmap-door-icon">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="kmap-door-text">
                  <span className="kmap-door-label">{title}</span>
                  <span className="kmap-door-desc">{getCategoryDescription(cat)}</span>
                </span>
                {fitN !== null ? (
                  <span className="kmap-door-fit" title="Keywords here that still return games with your current search">
                    <strong>{fitN}</strong>
                    <span>fit your search</span>
                  </span>
                ) : checking ? (
                  <span className="kmap-door-fit is-loading">
                    <strong>…</strong>
                    <span>checking fit</span>
                  </span>
                ) : null}
                <ArrowRight className="kmap-door-go h-4 w-4" aria-hidden="true" />
              </button>

              <div className="kmap-door-subs" aria-label={`${title} subcategories`}>
                {shownSubs.map(({ sub, fit: subFit }) => {
                  const SubIcon = getSubcategoryIconComponent(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      className={`kmap-door-sub${subFit === 0 ? ' is-empty' : ''}`}
                      onClick={() => {
                        track('map_explore', { subcategory: sub, depth: 0, variant, from: 'door' });
                        navigate({ category: cat, subcategory: sub, trail: [] });
                      }}
                    >
                      <SubIcon className="h-3 w-3" aria-hidden="true" />
                      {sub}
                      {subFit !== null && <span className="kmap-door-sub-count">{subFit}</span>}
                    </button>
                  );
                })}
                {hiddenSubs > 0 && (
                  <button type="button" className="kmap-door-sub kmap-door-sub--more" onClick={() => navigate({ category: cat, subcategory: null, trail: [] })}>
                    +{hiddenSubs} more
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
    );
  };

  /** Caption under a subcategory node: "12 fit" in Fits mode, else its size. */
  const tagFor = (node: MapNode) => {
    const sub = subcategoryFromNodeId(node.id);
    if (!sub) return undefined;
    const fitN = fitCountFor(sub.subcategory);
    return fitN !== null ? `${fitN} fit` : `${getKeywordCountForSubcategory(sub.subcategory)} keywords`;
  };

  const renderModes = () => {
    const disabled = currentSearch === null;
    let note: React.ReactNode = null;
    if (fitMode && disabled) note = 'Add a keyword to your search, then only matching keywords show.';
    else if (fitActive) {
      if (fit.status === 'loading' && !fit.stale) note = 'Checking which keywords fit…';
      else if (fit.status === 'error') note = "Couldn't check — showing every keyword.";
      else if (fit.complete) note = `Only keywords that still return games${fit.total !== null ? ` (your search: ${formatCount(fit.total, false)})` : ''}.`;
      else note = 'Broad search: hiding keywords that would return nothing, where checked.';
    }
    return (
      <div className="kmap-modes-row">
        <div className="kmap-modes" role="radiogroup" aria-label="Map mode">
          <button type="button" role="radio" aria-checked={!fitMode} className="kmap-mode" onClick={() => setFitMode(false)}>
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            Explore
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={fitMode}
            className="kmap-mode"
            onClick={() => setFitMode(true)}
            title={disabled ? 'Add a keyword to your search first' : 'Only show keywords that still return games'}
          >
            <ListFilter className="h-3.5 w-3.5" aria-hidden="true" />
            Fits my search
          </button>
        </div>
        {note && (
          <span className={`kmap-modes-note${fit.status === 'loading' ? ' is-loading' : ''}`} role="status">
            {note}
          </span>
        )}
      </div>
    );
  };

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
    } else if (!holding && !data) content = <div className="kmap-empty">Mapping keywords…</div>;
    else if (!holding && graph.length < 2 && fitActive && pool.length > 0) {
      content = (
        <div className="kmap-empty kmap-empty--fit">
          <span>{sceneKind === 'category' ? 'No subcategory here fits your search yet.' : 'Nothing here fits your search yet.'}</span>
          <button type="button" className="kmap-retry" onClick={() => setFitMode(false)}>
            Show everything
          </button>
        </div>
      );
    } else if (!holding && graph.length < 2) {
      content = <div className="kmap-empty">No related keywords mapped for {titleCase(center?.name ?? '')} yet.</div>;
    } else if (usable && nodes.length > 1) {
      content = (
        <KeywordMapScene
          nodes={nodes}
          plan={plan}
          viewport={viewport!}
          widthOf={measuredNodeWidth}
          reduceMotion={reduceMotion}
          sceneKey={nodesRef.current.sceneKey}
          variant={variant}
          modeOf={modeOf}
          onExplore={exploreNode}
          onToggle={setMode}
          onHoverNode={onHoverNode}
          previewPayload={previewPayload}
          discoveries={discoveryMap}
          fitCountOf={fit.status !== 'off' && fit.status !== 'error' ? fit.countOf : undefined}
          showFitTags={fitActive}
          tagFor={tagFor}
          onSwipe={variant === 'mobile' ? refresh : undefined}
        />
      );
    }
    return (
      <div
        ref={viewportRef}
        className={`kmap-viewport kmap-viewport--${variant}`}
        data-texture={category ? CATEGORY_TEXTURE[category] : undefined}
        aria-busy={holding || undefined}
      >
        {holding && <span className="kmap-loading">Mapping {titleCase(center?.name ?? '')}…</span>}
        {content}
        {isCategoryFallback && graph.length > 1 && <span className="kmap-relation-label">Related by category</span>}
      </div>
    );
  };

  /** Optional contextual content below the map. Keyword controls live on its centre node. */
  const renderDock = () => {
    const name = centerKw ? titleCase(centerKw.name) : '';
    if (discoveries.length === 0 && !storyFor(name)) return null;
    return (
      <div className="kmap-dock">
        {renderDiscoveries()}
        {name && renderStory(name)}
      </div>
    );
  };

  /** "Rare pairings": strong relations few games share — a nudge toward hidden gems. */
  const renderDiscoveries = () => {
    if (discoveries.length === 0) return null;
    return (
      <div className="kmap-discoveries" aria-label="Rare pairings">
        <span className="kmap-discoveries-label">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Rare pairings
        </span>
        {discoveries.map(d => (
          <button
            key={d.id}
            type="button"
            className="kmap-discovery"
            title={`${d.games} games share both — explore ${titleCase(d.name)}`}
            onClick={() => {
              track('map_discovery_click', { keyword: titleCase(d.name), games: d.games, variant });
              navigate({ ...location, trail: [...trail, { id: d.id, name: d.name }] });
            }}
          >
            {titleCase(d.name)}
            <span className="kmap-discovery-games">{d.games}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderStory = (name: string) => {
    const story = storyFor(name);
    if (!story) return null;
    return (
      <aside className="kmap-story">
        <span className="kmap-story-title">{story.title}</span>
        <p className="kmap-story-body">{story.body}</p>
        {story.href && (
          <a className="kmap-story-link" href={story.href}>
            Read more
          </a>
        )}
      </aside>
    );
  };

  const renderHeader = () => {
    const close = onClose && (
      <button type="button" className="kmap-icon-btn" onClick={onClose} aria-label="Close keyword map">
        <X className="h-4 w-4" />
      </button>
    );
    const sparkButton = spark && (
      <button
        type="button"
        className={`kmap-spark-btn${sparkOpen ? ' is-open' : ''}`}
        onClick={() => {
          if (!sparkOpen) track('map_spark_open', { variant, step });
          setSparkOpen(o => !o);
        }}
        aria-pressed={sparkOpen}
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        {sparkOpen ? 'Back to map' : 'Need a spark?'}
      </button>
    );
    if (step === 'categories') {
      return (
        <div className="kmap-header">
          <div className="min-w-0 flex-1">
            <h2 className="kmap-title">What are you in the mood for?</h2>
            <p className="kmap-subtitle">Search, pick a direction, or roll for a spark.</p>
          </div>
          {sparkButton}
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
        <button type="button" className="kmap-icon-btn" onClick={() => navigate(ROOT)} aria-label="All categories" title="All categories">
          <Home className="h-4 w-4" />
        </button>
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
        {sparkButton}
        {close}
      </div>
    );
  };

  /** Map-window toolbar (top-right, inside the map): refresh and copy-link. */
  const renderToolbar = () => (
    <div className="kmap-toolbar" role="toolbar" aria-label="Map actions">
      <button
        type="button"
        className="kmap-tool"
        onClick={() => refresh()}
        disabled={!canRefresh}
        aria-label={sceneKind === 'category' ? 'Show other subcategories' : 'Show other keywords'}
        title={
          !canRefresh
            ? 'Nothing else to show'
            : remaining > 0
              ? `Show ${remaining} more ${sceneKind === 'category' ? 'subcategories' : 'keywords'}`
              : 'Start over'
        }
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      {category && (
        <button
          type="button"
          className="kmap-tool"
          onClick={shareJourney}
          aria-label={shared ? 'Link copied' : 'Copy link to this map'}
          title={shared ? 'Link copied' : 'Copy a link to this map (includes your search)'}
        >
          {shared ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, [contenteditable="true"]')) return;
    if (step === 'categories' && !onClose) return;
    e.preventDefault();
    goBack();
  };

  return (
    <section
      ref={sectionRef}
      className={variant === 'mobile' ? 'kmap kmap--mobile' : 'kmap hidden lg:flex'}
      data-ambient={ambientPaused ? 'paused' : undefined}
      onKeyDown={onKeyDown}
    >
      {renderHeader()}
      {search && <div className="kmap-search">{search}</div>}
      <div className="kmap-body">
        {sparkOpen && spark ? (
          // The roll/discovery deck in place of the map; rolls add keywords, which the map follows.
          <div className="kmap-spark-panel">{spark}</div>
        ) : (
          <>
            {/* Desktop: the mode toggle sits inside the map window (top-left). */}
            {step !== 'categories' && variant === 'mobile' && renderModes()}
            {step === 'categories' && renderCategories()}
            {step === 'categories' && selectedFilters.length > 0 && (selection || actions) && (
              <div className="user-selection kmap-user-selection kmap-doors-selection">
                <div className="kmap-user-selection-filters">{selection}</div>
                {actions && <div className="kmap-user-selection-actions">{actions}</div>}
              </div>
            )}
            {step === 'map' && (
              <div className={`kmap-window kmap-window--${variant}`}>
                {renderMap()}
                {variant === 'desktop' && renderModes()}
                {renderToolbar()}
                {renderDock()}
                {(selection || actions) && (
                  <div className="user-selection kmap-user-selection">
                    <div className="kmap-user-selection-filters">{selection}</div>
                    {actions && <div className="kmap-user-selection-actions">{actions}</div>}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default KeywordMap;
