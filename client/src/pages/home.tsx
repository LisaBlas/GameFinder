import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FilterSidebar from '../components/FilterSidebar';
import SearchResults from '../components/SearchResults';
import { KeywordSection } from '../components/KeywordSection';
import { FilterProvider } from '../context/FilterContext';
import { useFilters } from '../context/FilterContext';

// Inner component to access context
const HomeContent: React.FC = () => {
  const { gameResults, isLoading } = useFilters();
  const showKeywords = gameResults.length === 0 && !isLoading;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col md:flex-row">
        <FilterSidebar />
        {showKeywords && <KeywordSection />}
        <SearchResults />
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
