import React from 'react';
import { Link } from 'wouter';
import { useMobile } from '@/hooks/use-mobile';
import { Menu, Search } from 'lucide-react';

const Header: React.FC = () => {
  const isMobile = useMobile();

  return (
    <header className="bg-slate-800 border-b border-slate-700 py-4 px-6 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.5 8a5.5 5.5 0 0 0-5.5 5.5v6a1.5 1.5 0 0 0 3 0V13h-1"/>
              <path d="M20 9a1 1 0 0 0-1-1 1 1 0 0 0-1 1v7a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V9"/>
              <path d="M4 9a1 1 0 0 1 1-1h1v7c0 1 0 3 4 3"/>
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white">GameFinder</h1>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="text-white font-medium">Home</Link>
          <Link href="/discover" className="text-slate-300 hover:text-white transition-colors duration-200">Discover</Link>
          <Link href="/collection" className="text-slate-300 hover:text-white transition-colors duration-200">My Collection</Link>
          <Link href="/about" className="text-slate-300 hover:text-white transition-colors duration-200">About</Link>
        </nav>
        
        <div className="flex items-center gap-4">
          {isMobile && (
            <button className="text-white" aria-label="Menu">
              <Menu className="w-6 h-6" />
            </button>
          )}
          
          <button className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
