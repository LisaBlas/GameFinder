/**
 * Wayfinder — the desktop random-discovery instrument layered over the map.
 *
 * KeywordSection owns all draw/search state. This component only presents the
 * six bearings, the current destination, and the session trail.
 */

import React from 'react';
import {
  Footprints,
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
  onDraw: () => void;
}

interface Props {
  bearings: WayfinderBearing[];
  destination: WayfinderDraw | null;
  history: WayfinderDraw[];
  onExplore: () => void;
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
  const ringSettled = destination !== null && (reduceMotion || settledDrawId === destination.id);
  const revealReady = ringSettled && (state === 'found' || state === 'uncharted');
  const gemsLit = state === 'found' && revealReady;
  const trail = history.filter(draw => draw.id !== destination?.id).slice(0, 4);
  const activeBearingIndex = destination ? bearings.findIndex(bearing => bearing.id === destination.card) : 0;
  const bearingAngles = [0, -60, -120, 180, 120, 60];
  const [roseAngle, setRoseAngle] = React.useState(0);
  const roseTargetRef = React.useRef(0);
  React.useEffect(() => {
    if (!destination) return;
    const nextTarget = bearingAngles[Math.max(0, activeBearingIndex)];
    let shortestDelta = ((nextTarget - roseTargetRef.current + 540) % 360) - 180;
    // The opposite bearing has two equally short routes; consistently go clockwise.
    if (shortestDelta === -180) shortestDelta = 180;
    roseTargetRef.current = nextTarget;
    setRoseAngle(current => current + shortestDelta);
  }, [destination?.id]);
  const instrumentStyle = {
    '--wf-rose-angle': `${roseAngle}deg`,
  } as React.CSSProperties;

  return (
    <div className="wayfinder" style={instrumentStyle} data-state={state} data-rarity={rarity ?? undefined} data-gems-lit={gemsLit || undefined}>
      <div className="wayfinder-instrument" aria-label="Random discovery wayfinder">
        <div className="wayfinder-chassis" data-style="arcane" role="group" aria-label="Choose a bearing">
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
          {bearings.map((bearing, index) => {
            const Icon = bearing.icon;
            const active = destination?.card === bearing.id;
            return (
              <button
                key={bearing.id}
                type="button"
                className={`wayfinder-gem wayfinder-bearing wayfinder-bearing--${bearing.group}`}
                style={{ '--bearing-index': index } as React.CSSProperties}
                data-gem={index}
                data-lit={active || undefined}
                data-active={active || undefined}
                data-rarity={active ? rarity ?? undefined : undefined}
                onClick={bearing.onDraw}
                aria-label={bearing.verb}
                title={bearing.verb}
              >
                <span className="wayfinder-bearing-stone" aria-hidden="true" />
                <span className="wayfinder-bearing-sigil"><Icon aria-hidden="true" /></span>
                <span className="wayfinder-bearing-copy">
                  <strong>{bearing.name}</strong>
                </span>
              </button>
            );
          })}
        </div>
        <span className="wayfinder-orbit wayfinder-orbit--outer" aria-hidden="true" />
        <span className="wayfinder-orbit wayfinder-orbit--inner" aria-hidden="true" />
        <span className="wayfinder-crosshair" aria-hidden="true" />

        <section className="wayfinder-core" aria-live="polite" aria-label="Wayfinder destination">
          <span
            className="wayfinder-rose"
            data-active={destination ? true : undefined}
            aria-hidden="true"
          />
          <span className="wayfinder-core-gem" aria-hidden="true"><span className="wayfinder-core-gem-stone" /></span>
          <div className="wayfinder-core-face" key={destination?.id ?? 'idle'}>
            {!destination ? (
              <>
                <span className="wayfinder-core-overline">Awaiting a bearing</span>
                <h2>Trust the map</h2>
                <p>Select one of the six runes to chart an unexpected route.</p>
              </>
            ) : (
              <>
                <span className="wayfinder-core-overline">{source?.name ?? 'Destination'}</span>
                {!revealReady ? (
                  <div className="wayfinder-core-loading" role="status" aria-label="Finding a destination">
                    <span className="wayfinder-core-loading-ring" aria-hidden="true" />
                    <span>Reading the map…</span>
                  </div>
                ) : (
                  <div className="wayfinder-core-result">
                    <h2>{destinationLabel(destination)}</h2>
                    {destination.title && <p className="wayfinder-parts">{destination.parts.join(' + ')}</p>}
                    <span className="wayfinder-result-count">
                      {state === 'uncharted'
                        ? 'No games on this route'
                        : destination.count && formatCount(destination.count.count, destination.count.capped)}
                    </span>
                    {state !== 'uncharted' && (
                      <div className="wayfinder-actions">
                        <button type="button" className="wayfinder-action wayfinder-action--primary" onClick={onExplore}>
                          Open map
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
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
