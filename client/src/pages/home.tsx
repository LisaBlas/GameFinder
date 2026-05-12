import React, { useState, useRef, useEffect } from 'react';
import ResultsSection from '../components/ResultsSection';
import { KeywordSection } from '../components/KeywordSection';
import { FilterProvider, useFilters } from '../context/FilterContext';
import BottomBar from '../components/BottomBar';
import AnimatedBackground from '../components/AnimatedBackground';
import SavedGamesPanel from '../components/SavedGamesPanel';
import GameCardModal from '../components/GameCardModal';
import { FaGithub, FaHeart } from 'react-icons/fa';
import { FaXTwitter, FaGlobe } from 'react-icons/fa6';
import { useSavedGames } from '../context/SavedGamesContext';
import { motion } from 'framer-motion';

const homepageSeoLinks = [
  { href: '/best/cozy-games', label: 'Cozy games' },
  { href: '/best/survival-crafting-games', label: 'Survival crafting' },
  { href: '/best/dark-fantasy-rpg-games', label: 'Dark fantasy RPGs' },
  { href: '/best/souls-like-games', label: 'Souls-like games' },
  { href: '/best/mystery-adventure-games', label: 'Mystery adventures' },
  { href: '/best/city-builder-games', label: 'City builders' },
];

const HomeContent: React.FC = () => {
  const { gameResults } = useFilters();
  const { savedGames } = useSavedGames();
  const [activeTab, setActiveTab] = useState<'build' | 'results'>('build');
  const [panelOpen, setPanelOpen] = useState(false);
  const [deepLinkGameId, setDeepLinkGameId] = useState<number | null>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game');
    if (!gameId) return;
    setDeepLinkGameId(Number(gameId));
    params.delete('game');
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AnimatedBackground />

      {/* App header - mobile only; desktop header lives inside the keyword section panel */}
      <div className="lg:hidden shrink-0 px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="brand-wordmark font-brand text-[1.08rem] font-normal tracking-[0.075em]">
              GameFinder
            </h1>
            <span className="font-cinzel text-[0.55rem] tracking-[0.2em] uppercase text-muted-foreground/70">Find your next favourite game</span>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="relative text-white/70 hover:text-rose-400 transition-colors p-1"
            aria-label="Saved games"
          >
            <FaHeart size={18} />
            {savedGames.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">
                {savedGames.length > 9 ? '9+' : savedGames.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <SavedGamesPanel open={panelOpen} onOpenChange={setPanelOpen} />
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
          Build
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
              {gameResults.length}
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
      >
        {/* Build panel - mobile: cross-fade, desktop: left 40% */}
        <div
          className={`absolute inset-0 lg:static bg-card flex flex-col overflow-y-auto lg:w-2/5 lg:border-r lg:border-border transition-opacity duration-200 ${
            activeTab === 'build'
              ? 'opacity-100 pointer-events-auto z-10'
              : 'opacity-0 pointer-events-none z-0 lg:opacity-100 lg:pointer-events-auto'
          }`}
        >
          {/* Keyword builder */}
          <div className="flex-1">
            <KeywordSection
              expanded={true}
              setActiveSection={() => {}}
              filterSectionRef={resultsSectionRef}
              heroRef={resultsSectionRef}
            />
          </div>

          {/* Footer links */}
          <div className="shrink-0 border-t border-border/40 px-4 py-3">
            <nav className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5" aria-label="Popular game searches">
              {homepageSeoLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <a href="https://lisablas.github.io/BleepBloop/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Website">
                <FaGlobe size={16} />
              </a>
              <a href="https://github.com/LisaBlas/GameFinder" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
                <FaGithub size={16} />
              </a>
              <a href="https://x.com/BerliozGordon" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="X / Twitter">
                <FaXTwitter size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Results panel - mobile: cross-fade, desktop: right 60% */}
        <div
          className={`absolute inset-0 lg:static flex flex-col overflow-y-auto lg:flex-1 transition-opacity duration-200 ${
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
