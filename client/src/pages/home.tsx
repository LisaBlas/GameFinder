import React, { useState, useRef, useEffect } from 'react';
import ResultsSection from '../components/ResultsSection';
import { KeywordSection } from '../components/KeywordSection';
import { FilterProvider, useFilters } from '../context/FilterContext';
import BottomBar from '../components/BottomBar';
import AnimatedBackground from '../components/AnimatedBackground';
import SavedGamesPanel from '../components/SavedGamesPanel';
import GameCardModal from '../components/GameCardModal';
import { FaHeart } from 'react-icons/fa';
import { useSavedGames } from '../context/SavedGamesContext';
import { motion } from 'framer-motion';
import FantasyScrollArea from '../components/FantasyScrollArea';

const HomeContent: React.FC = () => {
  const { gameResults, totalCount, countIsCapped } = useFilters();
  const { savedGames } = useSavedGames();
  const [activeTab, setActiveTab] = useState<'build' | 'results'>('build');
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      if (panelOpen) setPanelOpen(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [panelOpen]);

  const handlePanelOpenChange = (open: boolean) => {
    if (open) {
      window.history.pushState({ gamefinder: 'saved-panel' }, '');
    } else if (panelOpen) {
      window.history.back();
    }
    setPanelOpen(open);
  };
  const [deepLinkGameId, setDeepLinkGameId] = useState<number | null>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    setActiveTab(deltaX < 0 ? 'results' : 'build');
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
    <div className="h-screen flex flex-col overflow-hidden">
      <AnimatedBackground />

      {/* App header - mobile only; desktop header lives inside the keyword section panel */}
      <div className="mobile-relic-masthead lg:hidden shrink-0 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="relic-brand-plaque">
            <h1 className="relic-brand-wordmark font-brand text-[1.08rem] font-normal tracking-[0.075em]">
              GameFinder
            </h1>
          </div>
          <button
            type="button"
            onClick={() => handlePanelOpenChange(true)}
            className="relic-saved-button relative"
            aria-label="Saved games"
          >
            <FaHeart size={14} />
            <span>Saved</span>
            {savedGames.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">
                {savedGames.length > 9 ? '9+' : savedGames.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <SavedGamesPanel open={panelOpen} onOpenChange={handlePanelOpenChange} />
      <GameCardModal gameId={deepLinkGameId} onClose={() => setDeepLinkGameId(null)} />

      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex shrink-0 border-b border-border bg-background/80 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('build')}
          className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'build'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Keywords
          {activeTab === 'build' && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'results'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Results
          {gameResults.length > 0 && (
            <span className="ml-1.5 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
              {countIsCapped ? `${totalCount}+` : (totalCount ?? gameResults.length)}
            </span>
          )}
          {activeTab === 'results' && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
            />
          )}
        </button>
      </div>

      {/* Workspace panels */}
      <motion.div
        className="flex-1 overflow-hidden min-h-0 relative lg:flex"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Build panel - mobile: cross-fade, desktop: left half */}
        <div
          className={`keyword-build-panel absolute inset-0 lg:relative bg-card flex flex-col overflow-hidden lg:overflow-visible lg:w-1/2 lg:h-full lg:max-h-full transition-opacity duration-200 ${
            activeTab === 'build'
              ? 'opacity-100 pointer-events-auto z-10'
              : 'opacity-0 pointer-events-none z-0 lg:opacity-100 lg:pointer-events-auto'
          }`}
        >
          {/* Keyword builder */}
          <FantasyScrollArea className="keyword-build-panel-scroll">
            <KeywordSection
              expanded={true}
              setActiveSection={() => {}}
              filterSectionRef={resultsSectionRef}
              heroRef={resultsSectionRef}
            />
          </FantasyScrollArea>
        </div>

        {/* Results panel - mobile: cross-fade, desktop: right half */}
        <div
          className={`results-panel-scroll absolute inset-0 lg:static flex flex-col overflow-y-auto lg:flex-1 transition-opacity duration-200 ${
            activeTab === 'results'
              ? 'opacity-100 pointer-events-auto z-10'
              : 'opacity-0 pointer-events-none z-0 lg:opacity-100 lg:pointer-events-auto'
          }`}
        >
          <ResultsSection
            setActiveSection={() => {}}
            resultsSectionRef={resultsSectionRef}
          />
        </div>
      </motion.div>

      {/* Action bar - fixed bottom drawer on mobile; desktop version lives inside the left panel */}
      <BottomBar
        resetSections={() => {}}
        resultsSectionRef={resultsSectionRef}
        onSearchSuccess={() => setActiveTab('results')}
      />
    </div>
  );
};

const Home: React.FC = () => (
  <FilterProvider>
    <HomeContent />
  </FilterProvider>
);

export default Home;
