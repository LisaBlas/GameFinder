import React, { useState, useRef } from 'react';
import FilterSidebar from '../components/FilterSidebar';
import ResultsSection from '../components/ResultsSection';
import { KeywordSection } from '../components/KeywordSection';
import { FilterProvider } from '../context/FilterContext';
import { useFilters } from '../context/FilterContext';
import BottomBar from '../components/BottomBar';
import Navbar from '../components/Navbar';

// Inner component to access context
const HomeContent: React.FC = () => {
  const { gameResults, isLoading } = useFilters();
  const hasResults = gameResults.length > 0 || isLoading;
  const keywordSectionRef = useRef<HTMLDivElement>(null);

  // Changed initial state to null instead of 'keywords'
  const [activeSection, setActiveSection] = useState<'keywords' | 'filters' | 'results' | null>(null);

  const resetSections = () => {
    setActiveSection(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="w-full pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8 mt-8">
            {/* Left side - Keyword Section */}
            <div className="w-full lg:w-1/2">
              <KeywordSection expanded={activeSection === 'keywords'} setActiveSection={setActiveSection} />
            </div>

            {/* Right side - Filter Section */}
            <div className="w-full lg:w-1/2">
              <FilterSidebar expanded={activeSection === 'filters'} setActiveSection={setActiveSection} />
            </div>
          </div>

          {/* Results Section */}
          <div className="mt-8">
            <ResultsSection setActiveSection={setActiveSection} />
          </div>
        </div>
      </main>
      <BottomBar resetSections={resetSections} />
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
