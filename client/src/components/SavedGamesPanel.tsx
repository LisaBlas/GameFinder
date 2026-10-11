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
  const activeGame = savedGames.find(game => game.id === activeGameId) ?? null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="saved-games-panel w-full max-w-sm p-0">
          <SheetHeader className="saved-games-panel__header px-5 py-4">
            <SheetTitle className="saved-games-panel__title flex items-center gap-2">
              <FaHeart className="h-4 w-4" />
              Saved Games
              {savedGames.length > 0 && (
                <span className="saved-games-panel__count ml-1 px-2 py-0.5 text-xs font-semibold">
                  {savedGames.length}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="saved-games-panel__body">
            {savedGames.length === 0 ? (
              <div className="saved-games-panel__empty flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
                <FaHeart className="h-8 w-8" />
                <p className="text-sm font-medium">No saved games yet</p>
                <p className="text-xs">Hit the heart on any game card to save it here</p>
              </div>
            ) : (
              <ul className="saved-games-panel__list">
                {savedGames.map((game) => {
                  const coverUrl = game.cover?.url
                    ? game.cover.url.replace('/t_thumb/', '/t_cover_small/')
                    : null;
                  const releaseYear = game.first_release_date
                    ? new Date(game.first_release_date * 1000).getFullYear()
                    : null;
                  const rating = game.rating ? (Math.round(game.rating) / 10).toFixed(1) : null;

                  return (
                    <li key={game.id} className="saved-games-panel__item flex items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => { setActiveGameId(game.id); onOpenChange(false); }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        aria-label={`Open ${game.name}`}
                      >
                        <div className="saved-games-panel__cover h-14 w-10 flex-shrink-0 overflow-hidden">
                          {coverUrl ? (
                            <img src={coverUrl} alt={game.name} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="h-full w-full" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="saved-games-panel__game-title truncate text-sm font-semibold">{game.name}</p>
                          <div className="saved-games-panel__meta mt-0.5 flex items-center gap-2 text-xs">
                            {releaseYear && <span>{releaseYear}</span>}
                            {rating && (
                              <span className="saved-games-panel__rating px-1.5 py-0.5 font-medium">
                                {rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSaved(game.id)}
                        className="saved-games-panel__remove flex h-7 w-7 flex-shrink-0 items-center justify-center"
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

      <GameCardModal
        gameId={activeGameId}
        initialGame={activeGame}
        onClose={() => setActiveGameId(null)}
      />
    </>
  );
};

export default SavedGamesPanel;
