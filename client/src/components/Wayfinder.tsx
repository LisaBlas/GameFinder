/**
 * Wayfinder — the desktop random-discovery instrument layered over the map.
 *
 * KeywordSection owns all draw/search state. This component only presents the
 * six bearings, the current destination, and the session trail.
 */

import React from 'react';
import {
  Compass,
  Footprints,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getRarity, type RarityTier, type RevealCard } from '../lib/discoveryCards';
import { formatCount, type CountResult } from '../lib/searchCount';

export interface WayfinderDraw {
  id: number;
  card: RevealCard;
  title?: string;
  parts: string[];
  count?: CountResult;
}

export interface WayfinderBearing {
  id: RevealCard;
  name: string;
  verb: string;
  icon: LucideIcon;
  group: 'keys' | 'uniques' | 'crafts';
  meta: React.ReactNode;
  onDraw: () => void;
}

interface Props {
  bearings: WayfinderBearing[];
  destination: WayfinderDraw | null;
  history: WayfinderDraw[];
  onExplore: () => void;
  onDrawAgain: () => void;
  onRestore: (draw: WayfinderDraw) => void;
}

const rarityOf = (draw: WayfinderDraw): RarityTier | null | undefined =>
  draw.count ? getRarity(draw.count.count) : undefined;

const destinationLabel = (draw: WayfinderDraw) => draw.title ?? draw.parts.join(' + ');

export const Wayfinder: React.FC<Props> = ({
  bearings,
  destination,
  history,
  onExplore,
  onDrawAgain,
  onRestore,
}) => {
  const source = destination ? bearings.find(bearing => bearing.id === destination.card) : undefined;
  const rarity = destination ? rarityOf(destination) : undefined;
  const state = !destination
    ? 'dormant'
    : rarity === undefined
      ? 'charting'
      : rarity === null
        ? 'uncharted'
        : 'found';
  // The gems shine only once the inner ring has finished its spin for this draw.
  const [settledDrawId, setSettledDrawId] = React.useState<number | null>(null);
  React.useEffect(() => setSettledDrawId(null), [destination?.id]);
  // With reduced motion there is no spin (and no animationend), so light at once.
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const gemsLit = state === 'found' && destination !== null && (reduceMotion || settledDrawId === destination.id);
  const trail = history.filter(draw => draw.id !== destination?.id).slice(0, 4);
  const activeBearingIndex = destination ? bearings.findIndex(bearing => bearing.id === destination.card) : 0;
  const bearingAngles = [0, -60, -120, 180, 120, 60];
  const instrumentStyle = {
    '--wf-lock-angle': `${bearingAngles[Math.max(0, activeBearingIndex)]}deg`,
  } as React.CSSProperties;

  return (
    <div className="wayfinder" style={instrumentStyle} data-state={state} data-rarity={rarity ?? undefined} data-gems-lit={gemsLit || undefined}>
      <div className="wayfinder-heading">
        <span className="wayfinder-kicker"><Navigation aria-hidden="true" /> The Wayfinder</span>
        <p>Choose a bearing. Let the map reveal the route.</p>
      </div>

      <div className="wayfinder-instrument" aria-label="Random discovery wayfinder">
        <div className="wayfinder-chassis" data-style="arcane" aria-hidden="true">
          <span className="wayfinder-chassis-layer wayfinder-chassis-layer--outer" />
          <span className="wayfinder-chassis-layer wayfinder-chassis-layer--mechanism" />
          {/* Keyed per draw so every click restarts the spin on top of the idle tick. */}
          <span
            key={destination?.id ?? 'idle'}
            className="wayfinder-chassis-spin"
            data-spinning={destination ? true : undefined}
            onAnimationEnd={event => {
              if (destination && event.target === event.currentTarget) setSettledDrawId(destination.id);
            }}
          >
            <span className="wayfinder-chassis-layer wayfinder-chassis-layer--inner" />
          </span>
          <span className="wayfinder-chassis-layer wayfinder-chassis-layer--spokes" />
          {bearings.map((bearing, index) => (
            <span
              key={bearing.id}
              className="wayfinder-gem"
              data-gem={index}
              data-lit={destination?.card === bearing.id || undefined}
            />
          ))}
        </div>
        <span className="wayfinder-orbit wayfinder-orbit--outer" aria-hidden="true" />
        <span className="wayfinder-orbit wayfinder-orbit--inner" aria-hidden="true" />
        <span className="wayfinder-crosshair" aria-hidden="true" />

        <div className="wayfinder-bearings" role="group" aria-label="Choose a bearing">
          {bearings.map((bearing, index) => {
            const Icon = bearing.icon;
            const active = destination?.card === bearing.id;
            return (
              <button
                key={bearing.id}
                type="button"
                className={`wayfinder-bearing wayfinder-bearing--${bearing.group}`}
                style={{ '--bearing-index': index } as React.CSSProperties}
                data-active={active || undefined}
                data-pending={active && state === 'charting' ? true : undefined}
                data-rarity={active ? rarity ?? undefined : undefined}
                onClick={bearing.onDraw}
                aria-label={bearing.verb}
                title={bearing.verb}
              >
                <span className="wayfinder-bearing-sigil"><Icon aria-hidden="true" /></span>
                <span className="wayfinder-bearing-copy">
                  <strong>{bearing.name}</strong>
                  <small>{bearing.meta}</small>
                </span>
              </button>
            );
          })}
        </div>

        <section className="wayfinder-core" aria-live="polite" aria-label="Wayfinder destination">
          <span className="wayfinder-needle" aria-hidden="true" />
          <span className="wayfinder-core-gem" aria-hidden="true"><span className="wayfinder-core-gem-stone" /></span>
          <div className="wayfinder-core-face" key={`${destination?.id ?? 'idle'}-${state}`}>
            {!destination ? (
              <>
                <span className="wayfinder-core-icon"><Compass aria-hidden="true" /></span>
                <span className="wayfinder-core-overline">Awaiting a bearing</span>
                <h2>Trust the map</h2>
                <p>Select one of the six runes to chart an unexpected route.</p>
              </>
            ) : (
              <>
                <span className="wayfinder-core-overline">
                  {state === 'charting' ? 'Charting route' : source?.name ?? 'Destination'}
                </span>
                <h2>{destinationLabel(destination)}</h2>
                {destination.title && <p className="wayfinder-parts">{destination.parts.join(' + ')}</p>}
                <span className="wayfinder-result-count">
                  {state === 'charting'
                    ? 'Reading the map…'
                    : state === 'uncharted'
                      ? 'No games on this route'
                      : destination.count && formatCount(destination.count.count, destination.count.capped)}
                </span>
                <div className="wayfinder-actions">
                  {state !== 'uncharted' && (
                    <button type="button" className="wayfinder-action wayfinder-action--primary" onClick={onExplore}>
                      <MapPin aria-hidden="true" /> Follow route
                    </button>
                  )}
                  {source && (
                    <button type="button" className="wayfinder-action" onClick={onDrawAgain} title={source.verb}>
                      <RefreshCw aria-hidden="true" /> Again
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          {state === 'found' && <span className="wayfinder-route-flare" aria-hidden="true"><Route /></span>}
        </section>
      </div>

      <div className="wayfinder-trail" aria-label="Previous destinations">
        <span className="wayfinder-trail-label"><Footprints aria-hidden="true" /> Recent routes</span>
        {trail.length === 0 ? (
          <span className="wayfinder-trail-empty">Your discoveries will leave marks here.</span>
        ) : (
          trail.map(draw => (
            <button
              key={draw.id}
              type="button"
              className="wayfinder-trail-stop"
              data-rarity={rarityOf(draw) ?? undefined}
              onClick={() => onRestore(draw)}
              title={`Return to ${destinationLabel(draw)}`}
            >
              <Sparkles aria-hidden="true" /> {destinationLabel(draw)}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Wayfinder;
