import React from 'react';
import { Home } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 mb-6 text-slate-600">
        <Home className="w-full h-full" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">No Games Found</h3>
      <p className="text-slate-400 max-w-md">Try adjusting your filters or selecting different criteria to find games that match your preferences.</p>
    </div>
  );
};

export default EmptyState;
