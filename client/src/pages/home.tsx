import React, { useState, useRef, useEffect } from 'react';
import FilterSidebar from '../components/FilterSidebar';
import ResultsSection from '../components/ResultsSection';
import { KeywordSection } from '../components/KeywordSection';
import { FilterProvider } from '../context/FilterContext';
import { useFilters } from '../context/FilterContext';
import BottomBar from '../components/BottomBar';
import AnimatedBackground from '../components/AnimatedBackground';
import Hero from '../components/Hero';
import Navbar from '../components/Navbar';

// Inner component to access context
const HomeContent: React.FC = () => {
  const { gameResults, isLoading } = useFilters();
  const hasResults = gameResults.length > 0 || isLoading;
  const keywordSectionRef = useRef<HTMLDivElement>(null);
  const filterSectionRef = useRef<HTMLDivElement>(null);
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Changed initial state to null instead of 'keywords'
  const [activeSection, setActiveSection] = useState<'keywords' | 'filters' | 'results' | 'none' | null>(null);
  const [hasExpandedSection, setHasExpandedSection] = useState(false);

  // Update hasExpandedSection whenever activeSection changes
  React.useEffect(() => {
    if (activeSection === 'keywords' || activeSection === 'filters') {
      setHasExpandedSection(true);
    }
  }, [activeSection]);

  const resetSections = () => {
    setActiveSection(null);
  };

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />
      
      <main className="w-full min-h-[150vh]">
        <div className="container mx-auto px-4 lg:py-8">
          <Hero ref={heroRef} />
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left side - Keyword Section */}
            <div className="w-full lg:w-1/2">
              <KeywordSection
                expanded={activeSection === 'keywords'}
                setActiveSection={setActiveSection}
                filterSectionRef={filterSectionRef}
                heroRef={heroRef}
              />
            </div>

            {/* Right side - Filter Section */}
            <div className="w-full lg:w-1/2" ref={filterSectionRef}>
              <FilterSidebar
                expanded={activeSection === 'filters'}
                setActiveSection={setActiveSection}
                filterSectionRef={filterSectionRef}
                heroRef={heroRef}
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
