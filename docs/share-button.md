# Share Button — Implementation Spec

## What to build

1. **Shareable URLs** — serialize filter state to URL query params so any search is linkable
2. **Share button** — appears after a search completes; copies the URL and/or opens the native share sheet

This is ordered by dependency: URLs first, button second.

---

## Phase 1 — URL state serialization

### Goal
`https://gamefinder-app.com/?kw=story-rich,atmospheric&kw-ex=pvp&genre=12&platform=6&sort=rating`

- `kw` — included keyword slugs, comma-separated
- `kw-ex` — excluded keyword slugs, comma-separated
- `genre`, `platform`, `theme`, `mode`, `perspective` — single filter IDs by category
- `sort` — sort value

### Where to add it

All changes live in `client/src/context/FilterContext.tsx`.

**On filter/sort change — write to URL:**

```ts
// After any setSelectedFilters or setSortBy call, sync to URL
// Use history.replaceState so it doesn't pollute back-stack during browsing
const syncToUrl = useCallback((filters: Filter[], sort: string) => {
  const params = new URLSearchParams();

  const kwInclude = filters
    .filter(f => f.category === 'Keywords' && f.mode !== 'exclude' && f.slug)
    .map(f => f.slug!);
  const kwExclude = filters
    .filter(f => f.category === 'Keywords' && f.mode === 'exclude' && f.slug)
    .map(f => f.slug!);

  if (kwInclude.length) params.set('kw', kwInclude.join(','));
  if (kwExclude.length) params.set('kw-ex', kwExclude.join(','));

  // Map category names to param keys
  const categoryParams: Record<string, string> = {
    genres: 'genre',
    platforms: 'platform',
    themes: 'theme',
    'Game Mode': 'mode',
    Perspective: 'perspective',
  };
  for (const [cat, key] of Object.entries(categoryParams)) {
    const f = filters.find(f => f.category === cat);
    if (f) params.set(key, String(f.id));
  }

  if (sort && sort !== 'relevance') params.set('sort', sort);

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params}`
    : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
}, []);
```

Call `syncToUrl(nextFilters, sortBy)` at the end of `addFilter`, `removeFilter`, `clearAllFilters`, and the `setSortBy` wrapper.

**On mount — read from URL and hydrate:**

```ts
// Run once on FilterProvider mount (useEffect with [])
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (!params.toString()) return;

  const hydrated: Filter[] = [];

  // Keywords need to be looked up by slug from your keywords list
  // Fetch /api/keywords or use a local slug→id map if one exists
  // For now, a best-effort approach: store slug as id if numeric id not available
  const kwSlugs = params.get('kw')?.split(',').filter(Boolean) ?? [];
  const kwExSlugs = params.get('kw-ex')?.split(',').filter(Boolean) ?? [];

  // You'll need to resolve slugs → { id, name } — see "Slug resolution" below
  // ...hydrate filters from resolved slugs

  // Simple numeric filters can be hydrated without a lookup:
  const categoryMap: Record<string, string> = {
    genre: 'genres',
    platform: 'platforms',
    theme: 'themes',
    mode: 'Game Mode',
    perspective: 'Perspective',
  };
  for (const [key, category] of Object.entries(categoryMap)) {
    const val = params.get(key);
    if (val) {
      hydrated.push({ id: Number(val), name: val, category });
    }
  }

  const sort = params.get('sort');
  if (sort) setSortBy(sort);

  if (hydrated.length) setSelectedFilters(hydrated);
}, []);
```

### Slug resolution

Keywords are the hard part — they have numeric IGDB IDs but the URL should use human-readable slugs. Options:

**Option A (recommended):** Add a `GET /api/keywords/by-slug?slugs=story-rich,atmospheric` endpoint that returns `{ slug, id, name }[]`. The FilterProvider calls it on mount when `kw` or `kw-ex` params exist.

**Option B:** Store a client-side slug→{id, name} map built from your curated keyword list. Zero extra requests, but the map lives in the bundle. Fine if the keyword list is static.

The `Filter` interface already has a `slug` field, so this is the right field to use in both directions.

---

## Phase 2 — Share button

### Component: `client/src/components/ShareButton.tsx`

```tsx
import { Share2, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useFilters } from '../context/FilterContext';

export const ShareButton = () => {
  const { gameResults, selectedFilters } = useFilters();
  const [copied, setCopied] = useState(false);

  if (!gameResults.length) return null;

  const kwNames = selectedFilters
    .filter(f => f.category === 'Keywords' && f.mode !== 'exclude')
    .map(f => f.name);

  const shareText = kwNames.length
    ? `Found great games on GameFinder searching ${kwNames.join(' + ')} → ${window.location.href}`
    : `Found great games on GameFinder → ${window.location.href}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'GameFinder', text: shareText, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button onClick={handleShare} className="results-filter-trigger flex items-center gap-1.5 text-xs">
      {copied ? <Check className="w-3.5 h-3.5 text-[var(--c-emerald)]" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
};
```

### Placement

Add `<ShareButton />` in the sticky results header alongside the existing filter controls. In `home.tsx`, wherever `FilterBar` and the sort select are rendered in `.results-sticky-header`.

---

## Scope boundaries

- **No price fetching** — don't touch store links or affiliate URLs as part of this feature.
- **No server changes needed** unless you go with Option A for slug resolution.
- **Keywords only need slugs** — other filter categories (genre, platform, etc.) use numeric IDs and are trivial.
- **Auto-search on load** — if URL params are present on mount, call `searchGames()` after hydration so the linked page shows results immediately.
- **Don't break mobile tab state** — the mobile tab bar uses local UI state, not URL. Keep it that way; don't try to encode the active tab in the URL.

---

## Verification

1. Select 2–3 keywords + a genre, click Search
2. URL updates with params
3. Copy that URL, open in a new tab → filters are pre-selected and search fires automatically
4. Share button appears in results header; on mobile it triggers the native share sheet; on desktop it copies the URL
5. Clearing all filters resets the URL to `/`
