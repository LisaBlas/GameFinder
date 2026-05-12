import React, { useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { useSavedGames } from '../context/SavedGamesContext';
import SavedGamesPanel from './SavedGamesPanel';

const Navbar: React.FC = () => {
  const [panelOpen, setPanelOpen] = useState(false);
  const { savedGames } = useSavedGames();

  return (
    <>
      <div className="hidden lg:flex flex-col justify-center sticky top-0 z-30 min-h-[4.75rem] border-b border-border bg-[rgba(3,8,7,0.96)] backdrop-blur-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.32)] w-full px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="shrink-0 font-brand text-[1.55rem] font-normal tracking-[0.08em] bg-gradient-to-r from-emerald-300 via-primary to-emerald-100 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
              GameFinder
            </h1>
            <span className="font-cinzel text-[0.65rem] tracking-[0.22em] uppercase text-muted-foreground/70">Find your next favourite game</span>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="relative text-white/70 hover:text-rose-400 transition-colors"
            aria-label="Saved games"
          >
            <FaHeart size={18} />
            {savedGames.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">
                {savedGames.length > 9 ? '9+' : savedGames.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <SavedGamesPanel open={panelOpen} onOpenChange={setPanelOpen} />
    </>
  );
};

export default Navbar;
