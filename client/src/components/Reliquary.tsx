/**
 * Reliquary — the desktop "Need a spark?" view (swapped in for the keyword map).
 *
 * Three zones, top to bottom:
 *   altar    The relic you just drew, large, in its rarity's light. Dormant
 *            (a cold seal) until the first draw; "Unidentified" while its game
 *            count loads; struck and lit once identified.
 *   vessels  The six draw sources as carved niches: Keys | Uniques | Crafts.
 *   shelf    This session's earlier draws, one click to restore.
 *
 * Presentation only: KeywordSection owns the draws (it applies the filters and
 * locks each relic's count). Styles: client/src/styles/reliquary.css; carved
 * art: scripts/build-reliquary.py. Mobile keeps the DiscoveryCard deck.
 */

import React from 'react';
import { Hammer, KeyRound, Map as MapIcon, RefreshCw, Sparkles, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getRarity, type RarityTier, type RevealCard } from '../lib/discoveryCards';
import { formatCount, type CountResult } from '../lib/searchCount';

export interface RelicDraw {
  /** Unique per draw (a redraw of the same keyword is a new relic). */
  id: number;
  card: RevealCard;
  /** Curated combo title, when the relic has one. */
  title?: string;
  /** The keywords/filters it adds, in order. */
  parts: string[];
  /** Locked once identified; undefined while the count loads. */
  count?: CountResult;
}

export interface Vessel {
  id: RevealCard;
  /** Short inscription under the niche. */
  name: string;
  /** What drawing does, e.g. "Roll popular" (tooltip + accessible name). */
  verb: string;
  icon: LucideIcon;
  group: 'keys' | 'uniques' | 'crafts';
  meta: React.ReactNode;
  onDraw: () => void;
}

interface Props {
  vessels: Vessel[];
  relic: RelicDraw | null;
  history: RelicDraw[];
  onExplore: () => void;
  onDrawAgain: () => void;
  onRestore: (draw: RelicDraw) => void;
}

/** undefined = not identified yet; null = identified, no games. */
const rarityOf = (d: RelicDraw): RarityTier | null | undefined =>
  d.count ? getRarity(d.count.count) : undefined;

const relicLabel = (d: RelicDraw) => d.title ?? d.parts.join(' + ');

const GROUPS = [
  { id: 'keys', label: 'Keys', icon: KeyRound },
  { id: 'uniques', label: 'Uniques', icon: Star },
  { id: 'crafts', label: 'Crafts', icon: Hammer },
] as const;

export const Reliquary: React.FC<Props> = ({ vessels, relic, history, onExplore, onDrawAgain, onRestore }) => {
  const source = relic ? vessels.find(v => v.id === relic.card) : undefined;
  const rarity = relic ? rarityOf(relic) : undefined;
  const state = !relic ? 'dormant' : rarity === undefined ? 'unidentified' : rarity === null ? 'empty' : 'identified';
  const past = history.filter(d => d.id !== relic?.id).slice(0, 4);

  const renderName = (d: RelicDraw) => {
    const long = relicLabel(d).length > 22;
    return (
      <p className={`reliquary-name${long ? ' is-long' : ''}`}>
        {d.title ??
          d.parts.map((p, i) => (
            <React.Fragment key={p}>
              {i > 0 && <span className="reliquary-name-plus">+</span>}
              {p}
            </React.Fragment>
          ))}
      </p>
    );
  };

  const renderAltar = () => {
    if (!relic) {
      return (
        <div className="reliquary-relic">
          <span className="reliquary-seal" aria-hidden="true">
            <Sparkles />
          </span>
          <p className="reliquary-invite">Draw a relic</p>
          <p className="reliquary-hint">Unseal a vessel below. Keys open a place on the map; crafts are ready-made recipes.</p>
        </div>
      );
    }
    const kind = source?.group === 'crafts' || relic.parts.length > 1 ? 'Craft' : 'Key';
    return (
      // Keyed by draw and state so the strike replays on each identification.
      <div key={`${relic.id}-${state}`} className="reliquary-relic">
        <span className="reliquary-kind">
          {kind === 'Craft' ? <Hammer aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
          {kind} · {source?.group === 'uniques' ? 'Unique' : source?.name}
        </span>
        <span className="reliquary-rarity">
          {state === 'unidentified' ? 'Unidentified' : state === 'empty' ? 'Empty' : rarity}
        </span>
        {renderName(relic)}
        {relic.title && <span className="reliquary-parts">{relic.parts.join(' + ')}</span>}
        <span className="reliquary-count">
          {state === 'unidentified' ? 'Identifying…' : relic.count && relic.count.count > 0 ? formatCount(relic.count.count, relic.count.capped) : 'No games match'}
        </span>
        <div className="reliquary-actions">
          {state !== 'empty' && (
            <button type="button" className="reliquary-plate reliquary-plate--lit" onClick={onExplore}>
              <MapIcon aria-hidden="true" />
              Explore on map
            </button>
          )}
          {source && (
            <button type="button" className="reliquary-plate" onClick={onDrawAgain} title={source.verb}>
              <RefreshCw aria-hidden="true" />
              Draw again
            </button>
          )}
        </div>
        {state === 'identified' && <span className="reliquary-embers" aria-hidden="true" />}
      </div>
    );
  };

  return (
    <div className="reliquary">
      <section
        className="reliquary-altar"
        data-state={state}
        data-rarity={rarity ?? undefined}
        aria-label="Altar"
        aria-live="polite"
      >
        <div className="reliquary-arch">
          {renderAltar()}
          <span className="reliquary-plinth" aria-hidden="true" />
        </div>
      </section>

      <div className="reliquary-vessels" role="group" aria-label="Vessels">
        {GROUPS.map(g => (
          <span key={g.id} className={`reliquary-group reliquary-group--${g.id}`} aria-hidden="true">
            <g.icon />
            {g.label}
          </span>
        ))}
        {vessels.map(v => {
          const drawn = relic?.card === v.id;
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              type="button"
              className={`reliquary-vessel reliquary-vessel--${v.group}`}
              data-drawn={drawn || undefined}
              data-rarity={drawn ? rarity ?? undefined : undefined}
              data-pending={drawn && state === 'unidentified' ? true : undefined}
              onClick={v.onDraw}
              aria-label={v.verb}
              title={v.verb}
            >
              <span className="reliquary-niche">
                <Icon aria-hidden="true" />
              </span>
              <span className="reliquary-vessel-name">{v.name}</span>
              <span className="reliquary-vessel-meta">{v.meta}</span>
            </button>
          );
        })}
      </div>

      <div className="reliquary-shelf">
        <span className="reliquary-shelf-label">Last drawn</span>
        {past.length === 0 ? (
          <span className="reliquary-shelf-empty">Your draws will rest here.</span>
        ) : (
          past.map(d => (
            <button
              key={d.id}
              type="button"
              className="reliquary-plate reliquary-plate--sm"
              data-rarity={rarityOf(d) ?? undefined}
              onClick={() => onRestore(d)}
              title={`Draw ${relicLabel(d)} again`}
            >
              {relicLabel(d)}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Reliquary;
