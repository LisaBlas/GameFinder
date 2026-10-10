import React, { useState, useRef, useEffect, useCallback } from 'react';
import ResultsSection from '../components/ResultsSection';
import { KeywordSection } from '../components/KeywordSection';
import { FilterProvider } from '../context/FilterContext';
import AnimatedBackground from '../components/AnimatedBackground';
import GameCardModal from '../components/GameCardModal';
import { motion } from 'framer-motion';
import FantasyScrollArea from '../components/FantasyScrollArea';

const RESULTS_ENTRY = 'results-view';
const isResultsEntry = (s: unknown) =>
  typeof s === 'object' && s !== null && (s as { gamefinder?: string }).gamefinder === RESULTS_ENTRY;
const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;

const HomeContent: React.FC = () => {
  // Mobile shows one view at a time: the keyword map, or the results behind it.
  // Desktop always shows both side by side and ignores this.
  const [mobileView, setMobileView] = useState<'map' | 'results'>('map');
  const [deepLinkGameId, setDeepLinkGameId] = useState<number | null>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // The results view is a history entry, so the phone's Back returns to the map.
  const showResults = useCallback(() => {
    if (!isMobile()) return;
    if (!isResultsEntry(window.history.state)) window.history.pushState({ gamefinder: RESULTS_ENTRY }, '');
    setMobileView('results');
  }, []);

  const showMap = useCallback(() => {
    if (isResultsEntry(window.history.state)) window.history.back();
    else setMobileView('map');
  }, []);

  useEffect(() => {
    // A game card opened over the results pushes above the results entry; only
    // leaving the results entry itself returns to the map.
    const onPop = (e: PopStateEvent) => {
      if (!isResultsEntry(e.state) && (e.state as { gamefinder?: string } | null)?.gamefinder !== 'game-card') {
        setMobileView('map');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Results: swipe right to return to the map (the map's own swipes belong to the map).
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (deltaX < 70 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
    showMap();
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game');
    if (!gameId) return;
    setDeepLinkGameId(Number(gameId));
    params.delete('game');
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    // Preserve state: overlays and the keyword map tag their history entries.
    window.history.replaceState(window.history.state, '', newUrl);
  }, []);

  return (
    <div className="h-screen h-[100dvh] flex flex-col overflow-hidden">
      <AnimatedBackground />

      <GameCardModal gameId={deepLinkGameId} onClose={() => setDeepLinkGameId(null)} />

      {/* Workspace panels */}
      <motion.div
        className="flex-1 overflow-hidden min-h-0 relative lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {/* Build panel - mobile: full screen map view, desktop: left pane */}
        <div
          className={`keyword-build-panel absolute inset-0 lg:relative bg-card flex flex-col overflow-hidden lg:overflow-visible lg:w-1/2 lg:h-full lg:max-h-full transition-opacity duration-200 ${
            mobileView === 'map'
              ? 'opacity-100 pointer-events-auto z-10'
              : 'opacity-0 pointer-events-none z-0 lg:opacity-100 lg:pointer-events-auto'
          }`}
          aria-hidden={mobileView !== 'map' ? true : undefined}
        >
          <FantasyScrollArea className="keyword-build-panel-scroll">
            <KeywordSection onShowResults={showResults} />
          </FantasyScrollArea>
        </div>

        {/* Results panel - mobile: the view behind the map, desktop: right pane */}
        <div
          className={`results-panel-scroll absolute inset-0 lg:static flex flex-col overflow-y-auto lg:flex-1 transition-opacity duration-200 ${
            mobileView === 'results'
              ? 'opacity-100 pointer-events-auto z-10'
              : 'opacity-0 pointer-events-none z-0 lg:opacity-100 lg:pointer-events-auto'
          }`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <ResultsSection resultsSectionRef={resultsSectionRef} onBackToMap={showMap} />
        </div>
      </motion.div>
    </div>
  );
};

const Home: React.FC = () => (
  <FilterProvider>
    <HomeContent />
  </FilterProvider>
);

export default Home;
