import React, { useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { useSavedGames } from '../context/SavedGamesContext';
import SavedGamesPanel from './SavedGamesPanel';

interface SavedGamesControlProps {
  className?: string;
}

export const SavedGamesControl: React.FC<SavedGamesControlProps> = ({ className = '' }) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const { savedGames } = useSavedGames();

  return (
    <>
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className={`relic-saved-button relative ${className}`.trim()}
        aria-label="Saved games"
      >
        <FaHeart size={14} />
        <span>Saved</span>
        {savedGames.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">
            {savedGames.length > 9 ? '9+' : savedGames.length}
          </span>
        )}
      </button>

      <SavedGamesPanel open={panelOpen} onOpenChange={setPanelOpen} />
    </>
  );
};

export default SavedGamesControl;
