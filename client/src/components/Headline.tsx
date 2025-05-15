import React from 'react';

interface HeadlineProps {
  isVisible: boolean;
}

const Headline: React.FC<HeadlineProps> = ({ isVisible }) => {
  return (
    <div 
      className={`
        fixed inset-0 z-50 bg-background flex items-center justify-center
        transition-opacity duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      {/* Loading Animation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-primary/40 rounded-full animate-[spin_2s_linear_infinite]" />
          {/* Inner ring */}
          <div className="absolute inset-2 border-4 border-primary/60 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
          {/* Center dot */}
          <div className="absolute inset-[30%] bg-primary rounded-full animate-pulse" />
        </div>
      </div>

      {/* Text Content */}
      <div className="text-center relative z-10">
        <h2 className="text-2xl md:text-3xl font-medium text-foreground mb-2">
          <span className="inline-block animate-[slideIn_0.5s_ease-out]">
            Game
          </span>
          <span className="inline-block animate-[slideIn_0.5s_ease-out_0.2s] text-primary-500">
            Finder
          </span>
        </h2>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground">
          <span className="inline-block animate-[slideIn_0.5s_ease-out_0.4s]">
            Search for games
          </span>
          <br />
          <span className="inline-block animate-[slideIn_0.5s_ease-out_0.6s]">
            using unique filters
          </span>
        </h1>
      </div>
    </div>
  );
};

export default Headline; 