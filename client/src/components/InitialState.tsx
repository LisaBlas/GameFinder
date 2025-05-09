import React from 'react';
import { Filter } from 'lucide-react';

const InitialState: React.FC = () => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 mb-6 text-slate-600">
        <Filter className="w-full h-full" />
      </div>
      <h3 className="text-2xl font-medium text-white mb-3">Start Your Search</h3>
      <p className="text-slate-400 max-w-md text-lg">
        Select filters and keywords to discover games that match your preferences. Your perfect game is just a few clicks away!
      </p>
    </div>
  );
};

export default InitialState; 