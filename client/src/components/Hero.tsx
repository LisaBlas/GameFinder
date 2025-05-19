import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="text-center py-40">
      <h1 className="text-4xl md:text-7xl font-bold text-foreground mb-6 leading-[1.4]">
          Use unique keywords. <br />
        <span className="inline-block bg-gradient-to-r from-primary to-white bg-clip-text text-transparent">
          Find Better Games.
        </span>
      </h1>
      <h2 className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 leading-[1.8]">
      Get Smarter Game Recommendations <br /> Based on What Actually Matters.
      </h2>
    </div>
  );
};

export default Hero; 