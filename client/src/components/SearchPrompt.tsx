import React from 'react';
import { Search } from 'lucide-react';

const SearchPrompt: React.FC = () => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 mb-6 text-slate-600">
        <Search className="w-full h-full" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">Ready to Find Games</h3>
      <p className="text-slate-400 max-w-md">Click Search to find games that fit your criteria.</p>
    </div>
  );
};

export default SearchPrompt;