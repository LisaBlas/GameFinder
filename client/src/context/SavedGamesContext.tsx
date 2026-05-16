import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

declare const gtag: (...args: any[]) => void;

export interface SavedGame {
  id: number;
  name: string;
  cover?: { url: string };
  rating?: number;
  first_release_date?: number;
}

interface SavedGamesContextType {
  savedGames: SavedGame[];
  isSaved: (id: number) => boolean;
  toggleSaved: (game: SavedGame) => void;
  removeSaved: (id: number) => void;
}

const SavedGamesContext = createContext<SavedGamesContextType | null>(null);

const STORAGE_KEY = 'gamefinder_saved_games';

const loadFromStorage = (): SavedGame[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedGame[]) : [];
  } catch {
    return [];
  }
};

export const SavedGamesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedGames, setSavedGames] = useState<SavedGame[]>(loadFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedGames));
    } catch {
      // localStorage unavailable
    }
  }, [savedGames]);

  const isSaved = useCallback((id: number) => savedGames.some(g => g.id === id), [savedGames]);

  const toggleSaved = useCallback((game: SavedGame) => {
    setSavedGames(prev => {
      const removing = prev.some(g => g.id === game.id);
      if (typeof gtag !== 'undefined') {
        gtag('event', removing ? 'game_unsaved' : 'game_saved', {
          game_id: game.id,
          game_name: game.name,
        });
      }
      return removing ? prev.filter(g => g.id !== game.id) : [...prev, game];
    });
  }, []);

  const removeSaved = useCallback((id: number) => {
    setSavedGames(prev => prev.filter(g => g.id !== id));
  }, []);

  return (
    <SavedGamesContext.Provider value={{ savedGames, isSaved, toggleSaved, removeSaved }}>
      {children}
    </SavedGamesContext.Provider>
  );
};

export const useSavedGames = (): SavedGamesContextType => {
  const ctx = useContext(SavedGamesContext);
  if (!ctx) throw new Error('useSavedGames must be used inside SavedGamesProvider');
  return ctx;
};
