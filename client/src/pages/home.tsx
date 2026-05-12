import React, { useState, useRef } from 'react';
import ResultsSection from '../components/ResultsSection';
import { KeywordSection } from '../components/KeywordSection';
import { FilterProvider, useFilters } from '../context/FilterContext';
import BottomBar from '../components/BottomBar';
import AnimatedBackground from '../components/AnimatedBackground';
import SavedGamesPanel from '../components/SavedGamesPanel';
import { FaGithub, FaHeart } from 'react-icons/fa';
import { FaXTwitter, FaGlobe } from 'react-icons/fa6';
import { useSavedGames } from '../context/SavedGamesContext';

const HomeContent: React.FC = () => {
  const { gameResults } = useFilters();
  const { savedGames } = useSavedGames();
  const [activeTab, setActiveTab] = useState<'build' | 'results'>('build');
  const [panelOpen, setPanelOpen] = useState(false);
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <AnimatedBackground />

      {/* App header — mobile only; desktop header lives inside the keyword section panel */}
      <div className="lg:hidden shrink-0 px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="font-brand text-[1.05rem] font-normal tracking-[0.08em] bg-gradient-to-r from-emerald-300 via-primary to-emerald-100 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]">
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

      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex shrink-0 border-b border-border bg-background/80 backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('build')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'build'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Build
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'results'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Results
          {gameResults.length > 0 && (
            <span className="ml-1.5 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
              {gameResults.length}
            </span>
          )}
        </button>
      </div>

      {/* Workspace panels */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Build panel — mobile: active tab only, desktop: left 40% */}
        <div
          className={`bg-card flex-col overflow-y-auto w-full lg:w-2/5 lg:border-r lg:border-border ${
            activeTab === 'build' ? 'flex' : 'hidden lg:flex'
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

          {/* External links footer */}
          <div className="shrink-0 flex items-center gap-4 px-4 py-3 border-t border-border/40">
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

        {/* Results panel — mobile: active tab only, desktop: right 60% */}
        <div
          className={`flex-col overflow-y-auto w-full lg:flex-1 ${
            activeTab === 'results' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <ResultsSection
            setActiveSection={() => {}}
            resultsSectionRef={resultsSectionRef}
          />
        </div>
      </div>

      {/* Action bar — fixed bottom drawer on mobile; desktop version lives inside the left panel */}
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
