import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, ListFilter, Map as MapIcon, RefreshCw, Sparkles, X } from 'lucide-react';
import { useFilters, type Filter } from '../context/FilterContext';
import {
  CARD,
  CARD_DESC_FONT,
  DESKTOP_SHAPE,
  PILL_PAD,
  buildCategoryFallbackData,
  cardHeight,
  titleCase,
  nameKey,
  selectKeywordGraph,
  type GraphShape,
  type LabelNode,
  type MapNode,
  type MapSeed,
} from '../lib/keywordMap';
import { layoutKeywordMap, pillHeight, type LayoutOptions, type Rect, type Size } from '../lib/keywordMapLayout';
import { measuredNodeWidth, wrapText } from '../lib/measureLabel';
import {
  MAIN_CATEGORIES,
  MAIN_CATEGORY_META,
  categoryFromNodeId,
  findKeywordHome,
  getAllKeywordsForSubcategory,
  categoryNodeId,
  getAvailableSubcategories,
  getCategoryDescription,
  getKeywordCountForSubcategory,
  getSubcategoryDescription,
  getSubcategoryIconComponent,
  subcategoryFromNodeId,
  subcategoryNodeId,
  type MainCategory,
} from '../lib/keywordTaxonomy';
import { planTransition, snapshotScene, type MapNavState, type SceneSnapshot } from '../lib/keywordMapMotion';
import { useMapHistory } from '../hooks/useMapHistory';
import { KeywordMapScene, type KeywordMode, type TaxonCard, type ToggleMethod } from './KeywordMapScene';
import { ensureLists, prefetchLists, useKeywordGraph } from '../lib/keywordGraphStore';
import { buildSearchPayload, withKeyword } from '../lib/searchPayload';
import { formatCount, peekCount } from '../lib/searchCount';
import { setMapKeyword } from '../lib/mapLink';
import { markMapSourced, track } from '../lib/funnel';
import { findDiscoveries } from '../lib/keywordDiscoveries';
import { sendLightPulse } from '../lib/lightPulse';
import { storyFor } from '../lib/keywordStories';
import { JOURNEY_PARAM, decodeJourney } from '../lib/mapJourney';
import { useAmbientPause } from '../hooks/useAmbientPause';
import { MAX_PROBE, useKeywordFit } from '../lib/keywordFit';
import { SavedGamesControl } from './Navbar';

const FIT_MODE_KEY = 'kmap-fit-mode';
const readFitMode = () => {
  try {
    return localStorage.getItem(FIT_MODE_KEY) === '1';
  } catch {
    return false;
  }
};

const CATEGORY = 'Keywords';

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
const ROOT_NODE_ID = -1;

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

interface Props {
  variant?: 'desktop' | 'mobile';
  initialLocation?: MapLocation;
  /** Leave the map (shows a close button; Back/Escape at the root call it too). */
  onClose?: () => void;
  /** Keyword/game search: a collapsed lens in the map window's top-right. */
  search?: React.ReactNode;
  /** "Need a spark?" content, swapped in for the map on demand. A function
   *  receives `close` so the content can hand the user back to the map. */
  spark?: React.ReactNode | ((close: () => void) => React.ReactNode);
  /** Search actions (Clear, Search) for the map's bottom bar. */
  actions?: React.ReactNode;
  /** Current user selection, floated on the map's bottom-left. */
  selection?: React.ReactNode;
}

/**
 * Keyword explorer: root map (its 3 categories) → category map (its subcategories as
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
  // Start: an explicit location, else a shared journey link, else the doors.
  const [start] = useState(() => {
    const shared = initialLocation ? null : takeSharedJourney(variant);
    // A shared link's own keywords hydrate around mount; don't let them re-centre the journey.
    const linkHasKeywords = new URLSearchParams(window.location.search).has('kw');
    return { location: initialLocation ?? shared ?? ROOT, skipFirstFollow: Boolean(shared && linkHasKeywords) };
  });
  const { location, navigate, depthRef } = useMapHistory<MapLocation>(variant, start.location);
  const sectionRef = useRef<HTMLElement>(null);
  const mapLayerRef = useRef<HTMLDivElement>(null);
  const ambientPaused = useAmbientPause(sectionRef);
  const { category, subcategory, trail } = location;

  // The receded map is visual context only while the Wayfinder is open. Keep
  // its controls out of keyboard and assistive-tech navigation until it closes.
  useEffect(() => {
    if (mapLayerRef.current) mapLayerRef.current.inert = sparkOpen;
  }, [sparkOpen]);
  /** Keyword names already shown for the current centre, so refresh only brings new ones. */
  const [shown, setShown] = useState<{
    key: string;
    names: ReadonlySet<string>; // every name shown since the last start-over
    last: ReadonlySet<string>; // names on the previous map
    round: number;
    spin: 1 | -1;
  }>({ key: '', names: EMPTY_SHOWN, last: EMPTY_SHOWN, round: 0, spin: 1 });

  const step: 'categories' | 'map' = category || subcategory || trail.length > 0 ? 'map' : 'categories';
  const sceneKind: 'root' | 'category' | 'subcategory' | 'keyword' = trail.length > 0 ? 'keyword' : subcategory ? 'subcategory' : category ? 'category' : 'root';
  const { shape, layout } = sceneKind === 'root'
    ? { shape: { level1Count: 3, level2PerParent: 0 }, layout: CATEGORY_SCENE[variant].layout }
    : sceneKind === 'category' ? CATEGORY_SCENE[variant] : VARIANTS[variant];

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
    const mainCategory = categoryFromNodeId(node.id);
    if (mainCategory) {
      track('map_explore', { category: mainCategory, depth: 0, variant });
      navigate({ category: mainCategory, subcategory: null, trail: [] });
      return;
    }
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
  // Centre: a keyword, else the subcategory, category, or map root — taxonomy nodes use stable
  // negative ids, so the subcategory you open glides from its slot into the centre.
  const center: Kw | null = useMemo(
    () =>
      centerKw ??
      (subcategory
        ? { id: subcategoryNodeId(subcategory), name: subcategory }
        : category
          ? { id: categoryNodeId(category), name: MAIN_CATEGORY_META[category].title }
          : { id: ROOT_NODE_ID, name: 'Choose a direction' }),
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
  const rootPool = useMemo<MapSeed[]>(
    () => MAIN_CATEGORIES
      .filter(mainCategory => CATEGORY_STATS[mainCategory].subcategories.length > 0)
      .map(mainCategory => ({
        id: categoryNodeId(mainCategory),
        name: MAIN_CATEGORY_META[mainCategory].title,
        score: CATEGORY_STATS[mainCategory].ids.length,
      })),
    [],
  );
  const pool: MapSeed[] = useMemo(() => {
    if (centerKw) return isCategoryFallback ? fallbackKeywords : data?.[centerKw.id] ?? [];
    if (subcategory) return subcategoryPool;
    return category ? categoryPool : rootPool;
  }, [centerKw, subcategory, category, subcategoryPool, categoryPool, rootPool, data, isCategoryFallback, fallbackKeywords]);

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
  const fitCountForCategory = useCallback(
    (mainCategory: MainCategory): number | null =>
      fitActive && fit.complete && fit.status !== 'error'
        ? CATEGORY_STATS[mainCategory].ids.filter(id => keywordFits(id) && !keywordFilters.has(id)).length
        : null,
    [fitActive, fit, keywordFits, keywordFilters],
  );
  const fits = useCallback(
    (id: number) => {
      const mainCategory = categoryFromNodeId(id);
      if (mainCategory) {
        const n = fitCountForCategory(mainCategory);
        return n === null || n > 0;
      }
      const sub = subcategoryFromNodeId(id);
      if (!sub) return keywordFits(id);
      const n = fitCountFor(sub.subcategory);
      return n === null || n > 0;
    },
    [keywordFits, fitCountFor, fitCountForCategory],
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
  const viewportEl = useRef<HTMLDivElement | null>(null);

  // Selection pills and Search float on the map: pass their boxes to the layout as
  // obstacles so keywords are pushed out from under them.
  const [obstacles, setObstacles] = useState<Rect[]>([]);
  const overlayObserver = useRef<ResizeObserver | null>(null);
  const measureOverlays = useCallback(() => {
    const vp = viewportEl.current;
    if (!vp) return;
    const o = vp.getBoundingClientRect();
    const pad = 6;
    const rects = Array.from(vp.querySelectorAll<HTMLElement>(':scope > .kmap-user-selection-filters, :scope > .kmap-user-selection-actions'))
      .map(el => el.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0)
      .map(r => ({
        x: Math.round(r.left - o.left - pad),
        y: Math.round(r.top - o.top - pad),
        width: Math.round(r.width + pad * 2),
        height: Math.round(r.height + pad * 2),
      }));
    const key = (rs: Rect[]) => rs.map(r => `${r.x},${r.y},${r.width},${r.height}`).join('|');
    setObstacles(prev => (key(prev) === key(rects) ? prev : rects));
  }, []);
  const overlayRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      (overlayObserver.current ??= new ResizeObserver(measureOverlays)).observe(el);
    },
    [measureOverlays],
  );
  useEffect(() => () => overlayObserver.current?.disconnect(), []);

  const viewportRef = useCallback((el: HTMLDivElement | null) => {
    resizeObserver.current?.disconnect();
    viewportEl.current = el;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setViewport(v => (v && v.width === width && v.height === height ? v : { width, height }));
      // Overlays are anchored to the viewport's bottom corners, so they move with it.
      measureOverlays();
    });
    ro.observe(el);
    resizeObserver.current = ro;
  }, [measureOverlays]);
  const usable = viewport !== null && viewport.width > 120 && viewport.height > 120;

  // ── taxonomy cards ────────────────────────────────────────────────
  // Desktop: categories/subcategories are cards (icon, name, description, size) so they
  // read as places to go, not keywords to add. Sized once per node; text never changes.
  // Keyed by id and level: the subcategory you open glides into the centre as the same id,
  // and the centre card has no size caption.
  const cards = useMemo(() => new Map<string, TaxonCard | null>(), [variant]);
  const cardOf = useCallback(
    (n: LabelNode): TaxonCard | undefined => {
      if (variant !== 'desktop' || n.id === undefined || n.id >= 0) return undefined;
      const key = `${n.id}:${n.level}`;
      const hit = cards.get(key);
      if (hit !== undefined) return hit ?? undefined;
      const mainCategory = categoryFromNodeId(n.id);
      const sub = mainCategory ? null : subcategoryFromNodeId(n.id);
      const description = mainCategory
        ? getCategoryDescription(mainCategory)
        : sub ? getSubcategoryDescription(sub.category, sub.subcategory) : '';
      const icon = mainCategory ? MAIN_CATEGORY_META[mainCategory].icon : sub ? getSubcategoryIconComponent(sub.subcategory) : null;
      // The pill measure is a lighter, smaller font than the card title: pad it.
      const labelW = (measuredNodeWidth(n) - (n.level === 0 ? PILL_PAD.center : PILL_PAD.other)) * 1.12;
      const width = Math.max(CARD.minWidth, Math.ceil(labelW + CARD.padX * 2 + (icon ? CARD.icon + CARD.iconGap : 0)));
      const lines = description ? wrapText(description, width - CARD.padX * 2, CARD.descPx, CARD.maxLines, CARD_DESC_FONT) : [];
      const card = { width, height: cardHeight(lines.length, Boolean(mainCategory || sub) && n.level !== 0), lines, icon };
      cards.set(key, card);
      return card;
    },
    [variant, cards],
  );
  const nodeWidthOf = useCallback((n: LabelNode) => cardOf(n)?.width ?? measuredNodeWidth(n), [cardOf]);
  const nodeHeightOf = useCallback((n: LabelNode) => cardOf(n)?.height ?? pillHeight(n), [cardOf]);

  // ── layout + transition plan ──────────────────────────────────────
  // Both read the scene last committed to screen; the ref only advances after commit.
  const sceneRef = useRef<SceneSnapshot | null>(null);
  const laidOut = useMemo(
    () =>
      usable && graph.length > 1
        ? layoutKeywordMap(graph, {
            ...layout,
            viewport: viewport!,
            widthOf: nodeWidthOf,
            heightOf: nodeHeightOf,
            previous: sceneRef.current?.nodes,
            obstacles,
          })
        : [],
    [graph, viewport, usable, layout, variant, obstacles, nodeWidthOf, nodeHeightOf],
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

  /** Caption under a taxonomy node: "12 fit" in Fits mode, else its size. */
  const tagFor = (node: MapNode) => {
    const mainCategory = categoryFromNodeId(node.id);
    if (mainCategory) {
      const fitN = fitTally(CATEGORY_STATS[mainCategory].ids);
      return fitN !== null ? `${fitN} fit` : `${CATEGORY_STATS[mainCategory].ids.length} keywords`;
    }
    const sub = subcategoryFromNodeId(node.id);
    if (!sub) return undefined;
    const fitN = fitCountFor(sub.subcategory);
    return fitN !== null ? `${fitN} fit` : `${getKeywordCountForSubcategory(sub.subcategory)} keywords`;
  };

  const renderMapControls = () => {
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
        <div className="kmap-modes" aria-label="Map controls">
          <button
            type="button"
            role="switch"
            aria-checked={fitMode}
            className="kmap-mode kmap-fit-control"
            onClick={() => setFitMode(!fitMode)}
            title={disabled ? 'Add a keyword to your search first' : 'Only show keywords that still return games'}
          >
            <ListFilter className="h-3.5 w-3.5" aria-hidden="true" />
            Only compatible
          </button>
          <button
            type="button"
            className="kmap-mode kmap-refresh-control"
            onClick={() => refresh()}
            disabled={!canRefresh}
            aria-label={sceneKind === 'root' ? 'Show other categories' : sceneKind === 'category' ? 'Show other subcategories' : 'Show other keywords'}
            title={
              !canRefresh
                ? 'Nothing else to show'
                : remaining > 0
                  ? `Show ${remaining} more ${sceneKind === 'root' ? 'categories' : sceneKind === 'category' ? 'subcategories' : 'keywords'}`
                  : 'Start over'
            }
          >
            {/* Remounts per round so each refresh (click or swipe) spins it once, in the swipe's direction. */}
            <RefreshCw
              key={round}
              className={`h-3.5 w-3.5${round ? ' kmap-refresh-spin' : ''}`}
              style={{ '--spin-dir': spin } as React.CSSProperties}
              aria-hidden="true"
            />
            New options
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
          <span>{sceneKind === 'root' ? 'No category fits your search yet.' : sceneKind === 'category' ? 'No subcategory here fits your search yet.' : 'Nothing here fits your search yet.'}</span>
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
          widthOf={nodeWidthOf}
          heightOf={nodeHeightOf}
          cardOf={cardOf}
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
        {renderSelectionOverlays()}
      </div>
    );
  };

  /** Floating selection pills bottom-left (empty until a first pick) and Search bottom-right,
   *  measured as layout obstacles so keywords are pushed out from under them. */
  const renderSelectionOverlays = () => (
    <>
      {selection && <div ref={overlayRef} className="kmap-user-selection-filters">{selection}</div>}
      {actions && <div ref={overlayRef} className="kmap-user-selection-actions">{actions}</div>}
    </>
  );

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
        {/* Both labels stay stacked (stable width) and cross-fade; only the visible one is announced. */}
        <span className="kmap-spark-face kmap-spark-face--spark" aria-hidden={sparkOpen || undefined}>
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Need a spark?
        </span>
        <span className="kmap-spark-face kmap-spark-face--back" aria-hidden={!sparkOpen || undefined}>
          <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Back to map
        </span>
      </button>
    );
    const headerActions = (
      <div className="kmap-header-actions">
        {sparkButton}
        <SavedGamesControl className="kmap-saved-btn" />
        {close}
      </div>
    );
    if (step === 'categories') {
      return (
        <div className="kmap-header">
          <div className="min-w-0 flex-1">
            <h1 className="kmap-brand-title font-brand">GameFinder</h1>
          </div>
          {headerActions}
        </div>
      );
    }

    const crumbs: Array<{ label: string; to: MapLocation }> = [];
    if (category) crumbs.push({ label: MAIN_CATEGORY_META[category].short, to: { category, subcategory: null, trail: [] } });
    if (subcategory) crumbs.push({ label: subcategory, to: { category, subcategory, trail: [] } });
    trail.forEach((kw, i) => crumbs.push({ label: titleCase(kw.name), to: { category, subcategory, trail: trail.slice(0, i + 1) } }));

    return (
      <div className="kmap-header">
        <button type="button" className="kmap-icon-btn kmap-root-btn" onClick={() => navigate(ROOT)} aria-label="All categories" title="Pick a different category">
          <Home className="h-4 w-4" />
          <span>All categories</span>
        </button>
        <button type="button" className="kmap-icon-btn kmap-back-btn" onClick={goBack} aria-label="Back">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <nav ref={crumbsRef} className="kmap-crumbs" aria-label="Keyword map path">
          {/* Crumbs only change at the tail: new ones slide in, dropped ones pop out without shifting the rest. */}
          <AnimatePresence initial={false} mode="popLayout">
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <motion.span
                  key={`${i}-${c.label}`}
                  className="kmap-crumb-item"
                  initial={{ opacity: 0, x: 14, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: 10, filter: 'blur(3px)', transition: { duration: reduceMotion ? 0 : 0.16 } }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                  {i > 0 && <ChevronRight className="kmap-crumb-sep" aria-hidden="true" />}
                  {isLast ? (
                    <span className="kmap-crumb kmap-crumb--current" aria-current="page">{c.label}</span>
                  ) : (
                    <button type="button" className="kmap-crumb" onClick={() => navigate(c.to)}>{c.label}</button>
                  )}
                </motion.span>
              );
            })}
          </AnimatePresence>
        </nav>
        {headerActions}
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
    <section
      ref={sectionRef}
      className={`kmap kmap--${variant}`}
      data-ambient={ambientPaused ? 'paused' : undefined}
      onKeyDown={onKeyDown}
    >
      {renderHeader()}
      <div className="kmap-body">
        {/* The map stays mounted under the Wayfinder, so closing it restores the exact location. */}
        <div className={`kmap-window kmap-window--${variant}${sparkOpen ? ' is-spark-open' : ''}`}>
          <motion.div
            ref={mapLayerRef}
            className="kmap-map-layer"
            animate={sparkOpen
              ? { opacity: 0.42, scale: reduceMotion ? 1 : 1.045, filter: reduceMotion ? 'none' : 'blur(1px)' }
              : { opacity: 1, scale: 1, filter: 'none' }}
            transition={{ duration: reduceMotion ? 0.01 : 0.48, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden={sparkOpen || undefined}
          >
            {renderMap()}
            {renderMapControls()}
            {/* Collapsed to a lens; expands on hover/focus (incl. the "/" shortcut). */}
            {search && <div className="kmap-search kmap-search--float">{search}</div>}
            {renderDock()}
          </motion.div>
          <AnimatePresence initial={false}>
            {sparkOpen && spark && (
              <motion.div
                key="wayfinder"
                className="kmap-spark-stage"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'circle(7% at 50% 50%)' }}
                animate={{ opacity: 1, clipPath: 'circle(110% at 50% 50%)' }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'circle(7% at 50% 50%)' }}
                transition={{ duration: reduceMotion ? 0.01 : 0.58, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="kmap-spark-panel">{typeof spark === 'function' ? spark(() => setSparkOpen(false)) : spark}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default KeywordMap;
