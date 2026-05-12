import React, { useState } from 'react';
import { FaHeart, FaTimes } from 'react-icons/fa';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { useSavedGames } from '../context/SavedGamesContext';
import GameCardModal from './GameCardModal';

interface SavedGamesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SavedGamesPanel: React.FC<SavedGamesPanelProps> = ({ open, onOpenChange }) => {
  const { savedGames, removeSaved } = useSavedGames();
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full max-w-sm border-slate-700/60 bg-slate-900 p-0">
          <SheetHeader className="border-b border-slate-700/50 px-5 py-4">
            <SheetTitle className="flex items-center gap-2 text-white">
              <FaHeart className="h-4 w-4 text-rose-400" />
              Saved Games
              {savedGames.length > 0 && (
                <span className="ml-1 rounded-full bg-rose-400/15 px-2 py-0.5 text-xs font-semibold text-rose-300">
                  {savedGames.length}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="overflow-y-auto h-[calc(100vh-73px)]">
            {savedGames.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
                <FaHeart className="h-8 w-8 text-slate-700" />
                <p className="text-sm font-medium text-slate-400">No saved games yet</p>
                <p className="text-xs text-slate-600">Hit the heart on any game card to save it here</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-800/60">
                {savedGames.map((game) => {
                  const coverUrl = game.cover?.url
                    ? game.cover.url.replace('/t_thumb/', '/t_cover_small/')
                    : null;
                  const releaseYear = game.first_release_date
                    ? new Date(game.first_release_date * 1000).getFullYear()
                    : null;
                  const rating = game.rating ? (Math.round(game.rating) / 10).toFixed(1) : null;

                  return (
                    <li key={game.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-800/40">
                      <button
                        type="button"
                        onClick={() => setActiveGameId(game.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        aria-label={`Open ${game.name}`}
                      >
                        <div className="h-14 w-10 flex-shrink-0 overflow-hidden rounded-md bg-slate-800">
                          {coverUrl ? (
                            <img src={coverUrl} alt={game.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="h-full w-full" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{game.name}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            {releaseYear && <span>{releaseYear}</span>}
                            {rating && (
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-200 font-medium">
                                {rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSaved(game.id)}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-700/60 hover:text-slate-300"
                        aria-label={`Remove ${game.name} from saved`}
                      >
                        <FaTimes className="h-3 w-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <GameCardModal gameId={activeGameId} onClose={() => setActiveGameId(null)} />
    </>
  );
};

export default SavedGamesPanel;
