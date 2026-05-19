import React from 'react';
import { motion } from 'framer-motion';
import { useFilters, Filter } from '../context/FilterContext';

interface Preset {
  id: string;
  title: string;
  subtitle: string;
  filters: Filter[];
}

const kw = (id: number, name: string): Filter => ({
  id,
  name,
  category: 'Keywords',
  mode: 'include',
  compositeId: `keywords-${id}-${name.toLowerCase().replace(/\s+/g, '-')}`,
});
const genre = (id: number, name: string): Filter => ({
  id,
  name,
  category: 'genres',
  compositeId: `genres-${id}-${name.toLowerCase().replace(/\s+/g, '-')}`,
});
const theme = (id: number, name: string): Filter => ({
  id,
  name,
  category: 'themes',
  compositeId: `themes-${id}-${name.toLowerCase().replace(/\s+/g, '-')}`,
});

const PRESETS: Preset[] = [
  {
    id: 'cozy',
    title: 'Cozy & Relaxing',
    subtitle: 'Low stakes, high comfort',
    filters: [kw(24685, 'Cozy'), kw(1697, 'Atmospheric'), kw(2084, 'Relaxing')],
  },
  {
    id: 'dark-rpg',
    title: 'Dark Fantasy RPG',
    subtitle: 'Grim worlds, earned victories',
    filters: [kw(537, 'Dark Fantasy'), kw(226, 'Magic'), genre(12, 'Role-playing (RPG)')],
  },
  {
    id: 'survival',
    title: 'Survival & Crafting',
    subtitle: 'Build, gather, outlast',
    filters: [kw(510, 'Crafting'), kw(606, 'Resource Management'), theme(21, 'Survival')],
  },
  {
    id: 'space',
    title: 'Space Exploration',
    subtitle: 'Vast voids, hidden wonders',
    filters: [kw(974, 'Space'), kw(72, 'Exploration'), theme(18, 'Science fiction')],
  },
  {
    id: 'cozy-horror',
    title: 'Cozy Horror',
    subtitle: 'Spooky vibes, no trauma',
    filters: [kw(44167, 'Cozy horror'), kw(1697, 'Atmospheric'), theme(19, 'Horror')],
  },
  {
    id: 'roguelite',
    title: 'Roguelite Run',
    subtitle: 'Every death is a lesson',
    filters: [kw(17292, 'Roguelite'), kw(2228, 'Dungeon Crawler')],
  },
];

const SearchPlaceholder: React.FC = () => {
  const { applyFiltersAndSearch } = useFilters();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="py-4"
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Pick a vibe to get started, or build your own keyword combo.
      </p>

      <div className="grid grid-cols-1 widescreen:grid-cols-2 gap-3">
        {PRESETS.map((preset, i) => (
          <motion.button
            key={preset.id}
            type="button"
            onClick={() => applyFiltersAndSearch(preset.filters)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
            className="group w-full cursor-pointer rounded-xl border border-slate-600/35 bg-slate-900/95 px-4 py-4 text-left ring-1 ring-inset ring-white/[0.045] shadow-[0_1px_0_rgba(255,255,255,0.035),0_8px_24px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-0.5 hover:border-amber-300/35 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.10),0_18px_40px_rgba(0,0,0,0.28)]"
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{preset.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{preset.subtitle}</p>
                </div>
                <span className="mt-0.5 shrink-0 text-xs text-slate-600 transition-colors group-hover:text-amber-400/70">
                  Try →
                </span>
              </div>
              <div className="pointer-events-none flex flex-wrap gap-1.5" aria-hidden>
                {preset.filters.map(f => (
                  <span
                    key={`${f.category}-${f.id}`}
                    className={`filter-pill text-xs ${f.category === 'Keywords' ? 'keyword-include' : 'selected'}`}
                  >
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default SearchPlaceholder;
