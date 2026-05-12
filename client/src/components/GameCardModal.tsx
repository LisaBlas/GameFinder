import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import GameCard from './GameCard';

interface GameCardModalProps {
  gameId: number | null;
  onClose: () => void;
}

const GameCardModal: React.FC<GameCardModalProps> = ({ gameId, onClose }) => {
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

  return (
    <Dialog open={gameId !== null} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl xl:max-w-5xl w-full border-slate-700/60 bg-slate-900 xl:bg-transparent p-0 shadow-none [&>button]:hidden overflow-y-auto max-h-[90vh]">
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
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GameCardModal;
