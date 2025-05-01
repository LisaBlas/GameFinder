import React, { useState } from 'react';
import Footer from '../components/Footer';
import FilterSidebar from '../components/FilterSidebar';
import SearchResults from '../components/SearchResults';
import { KeywordSection } from '../components/KeywordSection';
import { FilterProvider } from '../context/FilterContext';
import { useFilters } from '../context/FilterContext';

// Inner component to access context
const HomeContent: React.FC = () => {
  const { gameResults, isLoading } = useFilters();
  const hasResults = gameResults.length > 0 || isLoading;
  const [filterSidebarCollapsed, setFilterSidebarCollapsed] = useState(false);
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col md:flex-row relative">
        <FilterSidebar 
          collapsed={filterSidebarCollapsed} 
          onToggleCollapse={() => setFilterSidebarCollapsed(!filterSidebarCollapsed)} 
        />
        
        {/* Keywords section - always visible but with different sizing based on search state */}
        <div className={`flex-1 transition-all duration-300 ${hasResults ? 'md:min-h-[30vh]' : 'md:min-h-[80vh]'}`}>
          <KeywordSection />
          
          {/* Results section - positioned differently based on search state */}
          <div 
            className={`transition-all duration-500 w-full ${
              hasResults 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-full opacity-0 absolute bottom-0 left-0 right-0'
            }`}
          >
            <SearchResults />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Outer component provides context
const Home: React.FC = () => {
  return (
    <FilterProvider>
      <HomeContent />
    </FilterProvider>
  );
};

export default Home;
