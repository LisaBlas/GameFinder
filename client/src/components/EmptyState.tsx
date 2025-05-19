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
        Consider using <b className="text-slate-50">less filters</b> or <b className="text-slate-50">adjusting</b> your criterias.
      </p>
    </div>
  );
};

export default EmptyState;
