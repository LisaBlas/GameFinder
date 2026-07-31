import React, { useState, useEffect, useRef } from 'react';
import { Search, Gamepad2, Tag } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import GameCardModal from './GameCardModal';

interface Keyword {
  id: number;
  name: string;
}

interface SuggestedGame {
  id: number;
  name: string;
  cover?: { url: string };
  first_release_date?: number;
}

interface KeywordSearchProps {
  inputRef?: React.RefObject<HTMLInputElement>;
  onKeywordSelect?: () => void;
}

const KeywordSearch: React.FC<KeywordSearchProps> = ({ inputRef, onKeywordSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gameSuggestions, setGameSuggestions] = useState<SuggestedGame[]>([]);
  const [keywordSuggestions, setKeywordSuggestions] = useState<Keyword[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeModalGameId, setActiveModalGameId] = useState<number | null>(null);
  const [activeModalGame, setActiveModalGame] = useState<SuggestedGame | null>(null);
  const keywordSearchTimeout = useRef<NodeJS.Timeout>();
  const gameSearchTimeout = useRef<NodeJS.Timeout>();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { addFilter } = useFilters();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Keyword suggestions are served from an in-memory local lookup (see
  // server/routes/keywords.ts), so they can use a much shorter debounce than
  // the IGDB-backed game suggestions and render well before games arrive.
  useEffect(() => {
    if (keywordSearchTimeout.current) clearTimeout(keywordSearchTimeout.current);

    if (!searchTerm.trim()) {
      setKeywordSuggestions([]);
      setIsLoadingKeywords(false);
      return;
    }

    setIsLoadingKeywords(true);

    keywordSearchTimeout.current = setTimeout(async () => {
      try {
        const keywordRes = await fetch(`/api/keywords/search?q=${encodeURIComponent(searchTerm)}`);
        const keywords: Keyword[] = keywordRes.ok ? await keywordRes.json() : [];

        const q = searchTerm.toLowerCase();
        const sorted = [...keywords].sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          if (aName === q && bName !== q) return -1;
          if (bName === q && aName !== q) return 1;
          if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
          if (bName.startsWith(q) && !aName.startsWith(q)) return 1;
          return aName.localeCompare(bName);
        });
        setKeywordSuggestions(sorted);
      } catch {
        setKeywordSuggestions([]);
      } finally {
        setIsLoadingKeywords(false);
      }
    }, 120);

    return () => { if (keywordSearchTimeout.current) clearTimeout(keywordSearchTimeout.current); };
  }, [searchTerm]);

  useEffect(() => {
    if (gameSearchTimeout.current) clearTimeout(gameSearchTimeout.current);

    if (!searchTerm.trim()) {
      setGameSuggestions([]);
      setIsLoadingGames(false);
      return;
    }

    setIsLoadingGames(true);

    gameSearchTimeout.current = setTimeout(async () => {
      try {
        const gameRes = await fetch(`/api/games/suggest?q=${encodeURIComponent(searchTerm)}`);
        const games: SuggestedGame[] = gameRes.ok ? await gameRes.json() : [];
        setGameSuggestions(games.slice(0, 5));
      } catch {
        setGameSuggestions([]);
      } finally {
        setIsLoadingGames(false);
      }
    }, 500);

    return () => { if (gameSearchTimeout.current) clearTimeout(gameSearchTimeout.current); };
  }, [searchTerm]);

  const handleKeywordClick = (keyword: Keyword) => {
    addFilter({
      id: keyword.id,
      name: keyword.name,
      category: 'Keywords',
      mode: 'include',
      slug: keyword.name.toLowerCase().replace(/\s+/g, '-')
    });
    setSearchTerm('');
    setGameSuggestions([]);
    setKeywordSuggestions([]);
    setShowSuggestions(false);
    if (onKeywordSelect) setTimeout(onKeywordSelect, 100);
  };

  const handleGameSelect = (game: SuggestedGame) => {
    setSearchTerm('');
    setGameSuggestions([]);
    setKeywordSuggestions([]);
    setShowSuggestions(false);
    setActiveModalGame(game);
    setActiveModalGameId(game.id);
  };

  const hasSuggestions = gameSuggestions.length > 0 || keywordSuggestions.length > 0;
  const isLoading = isLoadingKeywords || isLoadingGames;
  // Only block the whole dropdown on the spinner before anything has arrived yet;
  // once keywords render, games are allowed to fill in afterward without re-blocking.
  const showSearchingState = isLoading && !hasSuggestions;

  return (
    <>
    <div className="relative w-full" ref={searchContainerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search games or keywords..."
          className="w-full rounded-lg border border-transparent bg-white/[0.035] px-4 py-3 pl-12 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary/30 focus:bg-background/60 focus:outline-none focus:ring-2 focus:ring-primary/35 max-lg:py-4 max-lg:bg-c-surface-2 max-lg:border-[rgba(121,255,210,0.45)] max-lg:[box-shadow:inset_0_2px_5px_rgba(0,0,0,0.35)]"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 max-lg:w-4 max-lg:h-4 max-lg:opacity-50" />
      </div>

      {showSuggestions && (searchTerm.trim() || isLoading) && (
        <div
          className="absolute z-50 w-full mt-2 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-muted
            [&::-webkit-scrollbar-thumb]:bg-muted-foreground/50
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/70"
          onMouseDown={(e) => e.preventDefault()}
        >
          {showSearchingState ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : hasSuggestions ? (
            <>
              {gameSuggestions.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/50">
                    <Gamepad2 className="w-3 h-3" />
                    Games
                  </div>
                  {gameSuggestions.map((game) => {
                    const year = game.first_release_date
                      ? new Date(game.first_release_date * 1000).getFullYear()
                      : null;
                    const coverUrl = game.cover?.url
                      ? game.cover.url.replace('/t_thumb/', '/t_cover_small/').replace(/^\/\//, 'https://')
                      : null;
                    return (
                      <div
                        key={game.id}
                        onClick={() => handleGameSelect(game)}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                      >
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={game.name}
                            className="w-8 h-10 object-cover rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-10 bg-muted rounded flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{game.name}</div>
                          {year && <div className="text-xs text-muted-foreground">{year}</div>}
                        </div>
                        <span className="text-xs text-primary/80 whitespace-nowrap flex-shrink-0">View game</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {keywordSuggestions.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/50">
                    <Tag className="w-3 h-3" />
                    Keywords
                  </div>
                  {keywordSuggestions.map((keyword) => (
                    <div
                      key={keyword.id}
                      onClick={() => handleKeywordClick(keyword)}
                      className="px-4 py-2 hover:bg-muted cursor-pointer transition-colors text-sm"
                    >
                      {keyword.name}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : searchTerm.trim() ? (
            <div className="p-4 text-center text-muted-foreground">No results found</div>
          ) : null}
        </div>
      )}
    </div>
    <GameCardModal
      gameId={activeModalGameId}
      initialGame={activeModalGame}
      highlightFilters
      onClose={() => {
        setActiveModalGameId(null);
        setActiveModalGame(null);
      }}
    />
    </>
  );
};

export default KeywordSearch;
