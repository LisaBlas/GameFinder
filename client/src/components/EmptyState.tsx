import React from 'react';
import { SearchX } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 mb-6 text-slate-600">
        <SearchX className="w-full h-full" />
      </div>
      <h3 className="text-2xl font-medium text-white mb-3">No Games Found</h3>
      <p className="text-slate-400 max-w-md text-lg">
        We couldn't find any games matching your current filters. Try adjusting your criteria or selecting different options to discover new games.
      </p>
    </div>
  );
};

export default EmptyState;
