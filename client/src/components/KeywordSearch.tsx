import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useFilters } from '../context/FilterContext';

interface Keyword {
  id: number;
  name: string;
}

interface KeywordSearchProps {
  inputRef?: React.RefObject<HTMLInputElement>;
  onKeywordSelect?: () => void;
}

const KeywordSearch: React.FC<KeywordSearchProps> = ({ inputRef, onKeywordSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { addFilter } = useFilters();

  useEffect(() => {
    // Handle click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    // Handle escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // If search term is empty, clear suggestions
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    // Set loading state
    setIsLoading(true);

    // Set new timeout for search
    searchTimeout.current = setTimeout(async () => {
      try {
        console.log('Making API request for:', searchTerm);
        const response = await fetch(`/api/keywords/search?q=${encodeURIComponent(searchTerm)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received response:', data);

        // Sort suggestions to prioritize exact matches
        const sortedSuggestions = data.sort((a: Keyword, b: Keyword) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const searchTermLower = searchTerm.toLowerCase();

          // Exact match gets highest priority
          if (aName === searchTermLower && bName !== searchTermLower) return -1;
          if (bName === searchTermLower && aName !== searchTermLower) return 1;

          // Starts with search term gets second priority
          if (aName.startsWith(searchTermLower) && !bName.startsWith(searchTermLower)) return -1;
          if (bName.startsWith(searchTermLower) && !aName.startsWith(searchTermLower)) return 1;

          // Contains search term gets third priority
          if (aName.includes(searchTermLower) && !bName.includes(searchTermLower)) return -1;
          if (bName.includes(searchTermLower) && !aName.includes(searchTermLower)) return 1;

          // If both have same priority, sort alphabetically
          return aName.localeCompare(bName);
        });

        setSuggestions(sortedSuggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 1000); // 1 second delay

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm]);

  const handleSuggestionClick = (keyword: Keyword) => {
    addFilter({
      id: keyword.id,
      name: keyword.name,
      category: 'Keywords',
      slug: keyword.name.toLowerCase().replace(/\s+/g, '-')
    });
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Trigger the section switch
    if (onKeywordSelect) {
      onKeywordSelect();
    }
  };

  return (
    <div className="relative w-full" ref={searchContainerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Search for keywords..."
          className="w-full px-4 py-3 pl-12 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (searchTerm.trim() || isLoading) && (
        <div 
          className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-muted
            [&::-webkit-scrollbar-thumb]:bg-muted-foreground/50
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/70"
          onMouseDown={(e) => e.preventDefault()} // Prevent input blur
        >
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((keyword) => (
                <li
                  key={keyword.id}
                  onClick={() => handleSuggestionClick(keyword)}
                  className="px-4 py-2 hover:bg-muted cursor-pointer transition-colors"
                >
                  {keyword.name}
                </li>
              ))}
            </ul>
          ) : searchTerm.trim() ? (
            <div className="p-4 text-center text-muted-foreground">
              No keywords found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default KeywordSearch; 