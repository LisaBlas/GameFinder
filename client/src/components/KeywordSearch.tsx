import React, { useState, useEffect, useRef } from 'react';
import { Search, Gamepad2, Tag } from 'lucide-react';
import { useFilters } from '../context/FilterContext';

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

interface SeedData {
  id: number;
  name: string;
  genres?: Array<{ id: number; name: string }>;
  themes?: Array<{ id: number; name: string }>;
  keywords?: Array<{ id: number; name: string }>;
}

interface KeywordSearchProps {
  inputRef?: React.RefObject<HTMLInputElement>;
  onKeywordSelect?: () => void;
}

const KeywordSearch: React.FC<KeywordSearchProps> = ({ inputRef, onKeywordSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gameSuggestions, setGameSuggestions] = useState<SuggestedGame[]>([]);
  const [keywordSuggestions, setKeywordSuggestions] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { addFilter, setSeedGame } = useFilters();

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

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!searchTerm.trim()) {
      setGameSuggestions([]);
      setKeywordSuggestions([]);
      return;
    }

    setIsLoading(true);

    searchTimeout.current = setTimeout(async () => {
      try {
        const [gameRes, keywordRes] = await Promise.all([
          fetch(`/api/games/suggest?q=${encodeURIComponent(searchTerm)}`),
          fetch(`/api/keywords/search?q=${encodeURIComponent(searchTerm)}`)
        ]);
        const [games, keywords]: [SuggestedGame[], Keyword[]] = await Promise.all([
          gameRes.ok ? gameRes.json() : [],
          keywordRes.ok ? keywordRes.json() : []
        ]);

        setGameSuggestions(games.slice(0, 5));

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
        setGameSuggestions([]);
        setKeywordSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
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

  const handleGameSelect = async (game: SuggestedGame) => {
    setSearchTerm('');
    setGameSuggestions([]);
    setKeywordSuggestions([]);
    setShowSuggestions(false);

    setSeedGame({ id: game.id, name: game.name });

    try {
      const res = await fetch(`/api/games/${game.id}/similar-seed`);
      if (!res.ok) return;
      const seed: SeedData = await res.json();

      // Add up to 3 keywords, then genre and theme
      const keywords = (seed.keywords ?? []).slice(0, 3);
      keywords.forEach(kw =>
        addFilter({
          id: kw.id,
          name: kw.name,
          category: 'Keywords',
          mode: 'include',
          slug: kw.name.toLowerCase().replace(/\s+/g, '-')
        })
      );

      if (seed.genres && seed.genres.length > 0) {
        addFilter({ id: seed.genres[0].id, name: seed.genres[0].name, category: 'genres' });
      }

      if (seed.themes && seed.themes.length > 0) {
        addFilter({ id: seed.themes[0].id, name: seed.themes[0].name, category: 'themes' });
      }
    } catch {
      // Seed fetch failed — seedGame is still set; user can search manually
    }

    if (onKeywordSelect) setTimeout(onKeywordSelect, 100);
  };

  const hasSuggestions = gameSuggestions.length > 0 || keywordSuggestions.length > 0;

  return (
    <div className="relative w-full" ref={searchContainerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search games or keywords..."
          className="w-full px-4 py-3 pl-12 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
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
          {isLoading ? (
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
                        <span className="text-xs text-primary/80 whitespace-nowrap flex-shrink-0">Find similar →</span>
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
  );
};

export default KeywordSearch;
