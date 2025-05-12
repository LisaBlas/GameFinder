import React, { useState, useRef, useEffect } from 'react';
import FilterSidebar from '../components/FilterSidebar';
import ResultsSection from '../components/ResultsSection';
import { KeywordSection } from '../components/KeywordSection';
import { FilterProvider } from '../context/FilterContext';
import { useFilters } from '../context/FilterContext';
import BottomBar from '../components/BottomBar';
import Headline from '../components/Headline';

// Inner component to access context
const HomeContent: React.FC = () => {
  const { gameResults, isLoading } = useFilters();
  const hasResults = gameResults.length > 0 || isLoading;
  const keywordSectionRef = useRef<HTMLDivElement>(null);
  const filterSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const [showIntro, setShowIntro] = useState(true);

  // Changed initial state to null instead of 'keywords'
  const [activeSection, setActiveSection] = useState<'keywords' | 'filters' | 'results' | 'none' | null>(null);
  const [hasExpandedSection, setHasExpandedSection] = useState(false);

  useEffect(() => {
    // Show intro for 4 seconds
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const resetSections = () => {
    setActiveSection(null);
  };

  // Update hasExpandedSection whenever activeSection changes
  React.useEffect(() => {
    if (activeSection === 'keywords' || activeSection === 'filters') {
      setHasExpandedSection(true);
    }
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-background">
      <Headline isVisible={showIntro} />
      
      <main className={`w-full transition-opacity duration-500 ${showIntro ? 'opacity-0' : 'opacity-100'}`}>
        <div className="container mx-auto px-4 lg:py-8">
          <div className={`flex flex-col lg:flex-row gap-8 ${!activeSection ? 'mt-[140px]' : 'lg:mt-8'}`}>
            {/* Left side - Keyword Section */}
            <div className="w-full lg:w-1/2">
              <KeywordSection 
                expanded={activeSection === 'keywords'} 
                setActiveSection={setActiveSection}
                filterSectionRef={filterSectionRef}
              />
            </div>

            {/* Right side - Filter Section */}
            <div className="w-full lg:w-1/2" ref={filterSectionRef}>
              <FilterSidebar 
                expanded={activeSection === 'filters'} 
                setActiveSection={setActiveSection}
                filterSectionRef={filterSectionRef}
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="mt-8" ref={resultsSectionRef}>
            <ResultsSection 
              setActiveSection={setActiveSection}
              resultsSectionRef={resultsSectionRef}
            />
          </div>
        </div>
      </main>
      {hasExpandedSection && <BottomBar resetSections={resetSections} resultsSectionRef={resultsSectionRef} />}
    </div>
  );
};

// Wrapper component to provide context
const Home: React.FC = () => {
  return (
    <FilterProvider>
      <HomeContent />
    </FilterProvider>
  );
};

export default Home;
