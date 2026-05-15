import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameCard from './GameCard';

interface GameCardModalProps {
  gameId: number | null;
  onClose: () => void;
  highlightFilters?: boolean;
}

const GameCardModal: React.FC<GameCardModalProps> = ({ gameId, onClose, highlightFilters = false }) => {
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    setGame(null);
    setError(false);
    setLoading(true);

    fetch(`/api/games/${gameId}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(data => setGame(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [gameId]);

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
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-slate-950"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-3">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              </div>
            )}
            {error && (
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
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameCardModal;
