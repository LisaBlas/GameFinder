import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FilterSidebar from '../components/FilterSidebar';
import SearchResults from '../components/SearchResults';
import { FilterProvider } from '../context/FilterContext';

const Home: React.FC = () => {
  return (
    <FilterProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col md:flex-row">
          <FilterSidebar />
          <SearchResults />
        </main>
        <Footer />
      </div>
    </FilterProvider>
  );
};

export default Home;
