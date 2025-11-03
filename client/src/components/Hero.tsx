import React, { useState, forwardRef } from 'react';
import { Info, Search, Filter, Gamepad, ChevronDown } from 'lucide-react';

const Hero = forwardRef<HTMLDivElement>((props, ref) => {
  const [howItWorksExpanded, setHowItWorksExpanded] = useState(false);

  const toggleHowItWorks = () => {
    setHowItWorksExpanded(prev => !prev);
  };
  return (
    <div className="hero-section text-center">
      <h1 className="text-4xl md:text-7xl font-bold text-foreground mb-6 leading-[1.4]">
          Find your next <br />
        <span className="inline-block bg-gradient-to-r from-primary to-white bg-clip-text text-transparent">
          Favourite Game.
        </span>
      </h1>
      <h2 className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-[1.8]">
      Get Smarter Game Recommendations <br /> Based on What Actually Matters.
      </h2>

      <div ref={ref} className="mt-10 flex justify-center">
        <button
          onClick={toggleHowItWorks}
          className="flex items-center gap-2 text-sm bg-card/40 hover:bg-card/60 border border-border px-4 py-2 rounded-full transition-all duration-200"
        >
          <Info className="h-4 w-4 text-primary" />
          <span>How it works</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${howItWorksExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      
      {howItWorksExpanded && (
        <div className="mt-6 max-w-2xl mx-auto bg-card/40 backdrop-blur-sm border border-border rounded-lg p-5 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="flex flex-col items-center md:items-start gap-2 p-3 rounded-lg hover:bg-card/60 transition-colors">
              <Search className="h-5 w-5 text-primary" />
              <span className="font-medium">Find An Idea</span>
              <span className="text-xs text-muted-foreground">Explore thousands of hyper-specific gaming tags. <br></br>Bullet Hell, Base Building, Minimalist UI and 10000+</span>
            </div>
            <div className="flex flex-col items-center md:items-start gap-2 p-3 rounded-lg hover:bg-card/60 transition-colors">
              <Filter className="h-5 w-5 text-primary" />
              <span className="font-medium">Apply filters</span>
              <span className="text-xs text-muted-foreground">Narrow down your search with our optional filters, to show results that fit your setup and preferences.</span>
            </div>
            <div className="flex flex-col items-center md:items-start gap-2 p-3 rounded-lg hover:bg-card/60 transition-colors">
              <Gamepad className="h-5 w-5 text-primary" />
              <span className="font-medium">Discover games</span>
              <span className="text-xs text-muted-foreground">Find your next favourite game on official stores, or discounted offers with our partners.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Hero.displayName = 'Hero';

export default Hero;