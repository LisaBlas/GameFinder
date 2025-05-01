import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-spin text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
      <h3 className="text-xl font-medium text-white mb-2">Searching Games</h3>
      <p className="text-slate-400 max-w-md">Hold tight while we find the perfect games for you...</p>
    </div>
  );
};

export default LoadingState;
