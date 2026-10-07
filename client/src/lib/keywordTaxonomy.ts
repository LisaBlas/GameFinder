/**
 * Curated keyword taxonomy: 3 main categories → subcategories → keywords.
 * Shared by the desktop keyword map explorer and the mobile keyword shelves.
 * Keyword order inside each subcategory is curated; never re-sort it.
 */
import {
  Cog, Globe, Palette,
  Sword, Mountain, Crosshair, Zap, Layers, TrendingUp, Flame, Gamepad2,
  Coins, Sparkles, Wand2, LayoutGrid, Target, Trophy, Dices, Brain,
  Clock, Map, Leaf, Scroll, Users, Cloud, Car, Film, Hash,
  Paintbrush, Eye, Wind, Volume2, BookOpen,
  type LucideIcon,
} from 'lucide-react';
import topKeywordsByCategory from '../assets/top_keywords_by_category.json';
import extendedKeywordsByCategory from '../assets/extended_keywords_by_category.json';
import keywordCategories from '../assets/keyword-categories.json';

export type MainCategory = 'Mechanics & Systems' | 'Setting & World' | 'Aesthetics & Style';

export interface KeywordItem {
  id: number;
  name: string;
  category: string;
  'sub-category': string;
  game_count?: number;
}

export const MAIN_CATEGORIES: MainCategory[] = ['Mechanics & Systems', 'Setting & World', 'Aesthetics & Style'];

/** Display copy. `title` is the full name; `short` fits breadcrumbs and tabs. Keys stay stable (URLs use them). */
export const MAIN_CATEGORY_META: Record<MainCategory, { title: string; short: string; hint: string; icon: LucideIcon }> = {
  'Mechanics & Systems': { title: 'Gameplay and Mechanics', short: 'Mechanics', hint: 'How it plays', icon: Cog },
  'Setting & World': { title: 'Setting and World', short: 'Setting', hint: 'Where it takes you', icon: Globe },
  'Aesthetics & Style': { title: 'Visuals and Aesthetics', short: 'Aesthetics', hint: 'How it looks & feels', icon: Palette },
};

const SUBCATEGORY_ICONS: Record<string, LucideIcon> = {
  'Combat Systems': Sword,
  'Combat Environments': Mountain,
  'Combat Styles': Crosshair,
  'Movement': Zap,
  'Structure': Layers,
  'Progression': TrendingUp,
  'Challenges': Flame,
  'Controls': Gamepad2,
  'Economy Value': Coins,
  'Game Features': Sparkles,
  'RPGs': Wand2,
  'Puzzles': LayoutGrid,
  'Shooters': Target,
  'Sports': Trophy,
  'Strategy': Dices,
  'Simulation': Brain,
  'Time Periods': Clock,
  'Locations': Map,
  'Environmental Features': Leaf,
  'Historical Events': Scroll,
  'Cultural Elements': Users,
  'Setting Conditions': Cloud,
  'Vehicles & Transportation': Car,
  'Entertainment Franchises': Film,
  'Internet Culture': Hash,
  'Art Styles': Paintbrush,
  'Visual Themes': Eye,
  'Atmosphere': Wind,
  'Sound Design': Volume2,
  'Narrative Tone': BookOpen,
};

export const getSubcategoryIconComponent = (subCategory: string): LucideIcon => SUBCATEGORY_ICONS[subCategory] ?? Dices;

type CategoryData = { description: string } & Record<string, { description: string } | string>;
const categories = keywordCategories as unknown as Record<MainCategory, CategoryData>;

export const getCategoryDescription = (mainCat: MainCategory): string => categories[mainCat]?.description ?? '';

export const getSubcategories = (mainCat: MainCategory): string[] =>
  Object.keys(categories[mainCat] ?? {}).filter(key => key !== 'description');

export const getSubcategoryDescription = (mainCat: MainCategory, subCategoryName: string): string =>
  (categories[mainCat]?.[subCategoryName] as { description: string } | undefined)?.description || '';

export const getKeywordsForSubcategory = (subCategoryName: string): KeywordItem[] =>
  (topKeywordsByCategory as Record<string, KeywordItem[]>)[subCategoryName] || [];

export const getExtendedKeywordsForSubcategory = (subCategoryName: string): KeywordItem[] =>
  (extendedKeywordsByCategory as Record<string, KeywordItem[]>)[subCategoryName] || [];

/** Top keywords first, then extended — curated order preserved. */
export const getAllKeywordsForSubcategory = (subCategoryName: string): KeywordItem[] => [
  ...getKeywordsForSubcategory(subCategoryName),
  ...getExtendedKeywordsForSubcategory(subCategoryName),
];

export const getKeywordCountForSubcategory = (subCategoryName: string): number =>
  getAllKeywordsForSubcategory(subCategoryName).length;

export const getAvailableSubcategories = (mainCat: MainCategory): string[] =>
  getSubcategories(mainCat).filter(subCat => getKeywordsForSubcategory(subCat).length > 0);

export const getSubcategoryParent = (subCategoryName: string): MainCategory | undefined =>
  MAIN_CATEGORIES.find(cat => getSubcategories(cat).includes(subCategoryName));

let keywordHome: globalThis.Map<number, { category: MainCategory; subcategory: string }> | null = null;

/** Where a keyword lives in the taxonomy (first match), or null if it isn't curated. */
export const findKeywordHome = (keywordId: number) => {
  if (!keywordHome) {
    keywordHome = new globalThis.Map();
    for (const category of MAIN_CATEGORIES) {
      for (const subcategory of getAvailableSubcategories(category)) {
        for (const kw of getAllKeywordsForSubcategory(subcategory)) {
          if (!keywordHome.has(kw.id)) keywordHome.set(kw.id, { category, subcategory });
        }
      }
    }
  }
  return keywordHome.get(keywordId) ?? null;
};

// ── Map node ids for categories and subcategories ────────────────────
// Keyword ids are positive; categories and subcategories get stable negative
// ids so the keyword map can animate them like keywords (a subcategory node
// glides into the centre when opened).

const CATEGORY_ID_BASE = -10;
const SUBCATEGORY_ID_BASE = -100;
let subcategoryIds: globalThis.Map<string, number> | null = null;
let subcategoryById: globalThis.Map<number, { category: MainCategory; subcategory: string }> | null = null;

const buildSubcategoryIds = () => {
  subcategoryIds = new globalThis.Map();
  subcategoryById = new globalThis.Map();
  let i = 0;
  for (const category of MAIN_CATEGORIES) {
    for (const subcategory of getAvailableSubcategories(category)) {
      const id = SUBCATEGORY_ID_BASE - i++;
      subcategoryIds.set(subcategory, id);
      subcategoryById.set(id, { category, subcategory });
    }
  }
};

export const categoryNodeId = (category: MainCategory) => CATEGORY_ID_BASE - MAIN_CATEGORIES.indexOf(category);

export const subcategoryNodeId = (subcategory: string) => {
  if (!subcategoryIds) buildSubcategoryIds();
  return subcategoryIds!.get(subcategory) ?? SUBCATEGORY_ID_BASE + 1; // -99: unknown, never collides
};

/** The subcategory behind a map node id, if it is one. */
export const subcategoryFromNodeId = (id: number) => {
  if (!subcategoryById) buildSubcategoryIds();
  return subcategoryById!.get(id) ?? null;
};

/** Category and subcategory nodes aren't keywords: they can't be added to a search. */
export const isTaxonomyNodeId = (id: number) => id < 0;
