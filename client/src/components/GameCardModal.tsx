import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameCard from './GameCard';

interface GameCardModalProps {
  gameId: number | null;
  onClose: () => void;
  highlightFilters?: boolean;
  // Card data already known from the click that opened the modal (search
  // result, saved game, suggestion, ...). Lets the detail shell render
  // instantly instead of a blank spinner while /api/games/:id fills in the
  // rest of the fields underneath.
  initialGame?: any;
}

const GameCardModal: React.FC<GameCardModalProps> = ({ gameId, onClose, highlightFilters = false, initialGame }) => {
  // currentGameId allows in-modal navigation when the user clicks a "More like
  // this" cover — the modal swaps to that game without closing and reopening.
  const [currentGameId, setCurrentGameId] = useState<number | null>(gameId);
  const [game, setGame] = useState<any>(gameId !== null && initialGame?.id === gameId ? initialGame : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Keep currentGameId in sync when the parent changes the prop (new search result click).
  // Seed the shell from initialGame when it matches the newly opened game, otherwise
  // clear stale data from whatever was previously open — this only runs on a genuine
  // new open (gameId prop change), not on in-modal "more like this" navigation, so it
  // can't undo the no-clear behavior the currentGameId effect below relies on.
  useEffect(() => {
    setCurrentGameId(gameId);
    if (gameId === null) return;
    setGame(gameId === initialGame?.id ? initialGame : null);
    setError(false);
  }, [gameId]);

  // Deliberately does not clear `game` before fetching: keeping the previous/seeded
  // card visible avoids a blank spinner flash on open and during in-modal
  // "more like this" navigation. AbortController guards against an in-flight
  // request from a stale currentGameId overwriting a newer one's result.
  useEffect(() => {
    if (!currentGameId) return;
    setError(false);
    setLoading(true);

    const controller = new AbortController();

    fetch(`/api/games/${currentGameId}`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(data => setGame(data))
      .catch(err => {
        if (err.name !== 'AbortError') setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [currentGameId]);

  useEffect(() => {
    if (gameId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [gameId]);

  return (
    <AnimatePresence>
      {gameId !== null && (
        <motion.div
          key="game-card-overlay"
          // Mobile: solid fullscreen takeover.
          // Desktop (md+): semi-transparent backdrop, content centred as a dialog.
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 md:flex md:items-center md:justify-center md:overflow-hidden md:bg-black/75 md:backdrop-blur-sm md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Stop click from reaching the backdrop so only the × button closes on desktop */}
          <div
            className="p-3 md:w-full md:max-w-2xl md:max-h-[88vh] md:overflow-y-auto md:rounded-xl md:p-0 md:shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {loading && !game && (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              </div>
            )}
            {error && !game && (
              <div className="py-16 text-center text-sm text-slate-400">
                Failed to load game details.
              </div>
            )}
            {game && (
              <GameCard
                game={game}
                isSelected={true}
                onSelect={onClose}
                fullscreen={true}
                highlightFilters={highlightFilters}
                onOpenSimilar={setCurrentGameId}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameCardModal;
