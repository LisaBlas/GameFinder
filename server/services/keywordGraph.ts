import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { rankGraph, type GraphNeighbor, type KeywordGraphData } from '../../shared/keywordRelevance';
import { KEYWORD_EDITORIAL } from '../../shared/keywordEditorial';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Bundled into dist/index.js in production, where `build:server` copies the assets next to it.
const assetPath = (file: string) =>
  process.env.NODE_ENV === 'production'
    ? path.join(__dirname, './assets', file)
    : path.join(__dirname, '../../client/src/assets', file);

const readJson = (file: string) => JSON.parse(fs.readFileSync(assetPath(file), 'utf8').replace(/^﻿/, ''));

interface Loaded {
  graph: KeywordGraphData;
  version: string;
}

let loaded: Loaded | null = null;

/** Ids of every keyword in the curated (top) lists, wherever they nest. */
function collectIds(node: unknown, out: Set<number>, names: Map<number, string>) {
  if (Array.isArray(node)) node.forEach(n => collectIds(n, out, names));
  else if (node && typeof node === 'object') {
    const o = node as { id?: unknown; name?: unknown };
    if (typeof o.id === 'number' && typeof o.name === 'string') {
      out.add(o.id);
      names.set(o.id, o.name);
    }
    Object.values(node).forEach(v => collectIds(v, out, names));
  }
}

/** Loads and ranks the co-occurrence graph once, on first use. */
function load(): Loaded {
  if (loaded) return loaded;
  const raw = fs.readFileSync(assetPath('keyword_cooccurrence.json'), 'utf8');
  const graph = JSON.parse(raw.replace(/^﻿/, '')) as KeywordGraphData;

  const curated = new Set<number>();
  const names = new Map<number, string>();
  collectIds(readJson('top_keywords_by_category.json'), curated, names);
  for (const list of Object.values(graph)) for (const n of list) if (!names.has(n.id)) names.set(n.id, n.name);

  const started = Date.now();
  const ranked = rankGraph(graph, { curated, overrides: KEYWORD_EDITORIAL, nameOf: id => names.get(id) });
  const editorialHash = crypto.createHash('md5').update(JSON.stringify(KEYWORD_EDITORIAL)).digest('hex');
  const version = crypto.createHash('md5').update(raw).update(editorialHash).digest('hex').slice(0, 12);
  console.log(`[keywordGraph] ranked ${Object.keys(ranked).length} keywords in ${Date.now() - started}ms (v${version})`);
  loaded = { graph: ranked, version };
  return loaded;
}

export const MAX_SLICE_IDS = 100;

/**
 * Neighbour lists for `ids`; depth 2 also includes the lists of each of their
 * neighbours, which is everything the map needs to draw a keyword's two rings.
 */
export function getGraphSlice(ids: number[], depth: 1 | 2): { version: string; lists: Record<number, GraphNeighbor[]> } {
  const { graph, version } = load();
  const lists: Record<number, GraphNeighbor[]> = {};
  const add = (id: number) => {
    if (!(id in lists)) lists[id] = graph[id] ?? [];
  };
  for (const id of ids.slice(0, MAX_SLICE_IDS)) {
    add(id);
    if (depth === 2) for (const n of graph[id] ?? []) add(n.id);
  }
  return { version, lists };
}

let known: Set<number> | null = null;

/**
 * Every keyword the map can show: the curated taxonomy (top + extended lists)
 * plus everything in the co-occurrence graph. Bounds facet payloads.
 */
export function knownKeywordIds(): ReadonlySet<number> {
  if (known) return known;
  const ids = new Set<number>();
  const names = new Map<number, string>();
  collectIds(readJson('top_keywords_by_category.json'), ids, names);
  collectIds(readJson('extended_keywords_by_category.json'), ids, names);
  for (const [k, list] of Object.entries(load().graph)) {
    ids.add(Number(k));
    for (const n of list) ids.add(n.id);
  }
  known = ids;
  return known;
}
