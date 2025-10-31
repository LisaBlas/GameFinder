import { useState, useEffect } from 'react';

export function useMediaQuery(query: string) {
  // Initialize with the actual media query result instead of false
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', listener);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}
