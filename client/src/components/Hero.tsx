import React from 'react';

const Hero: React.FC = () => {
  return (
    <div className="text-center py-48">
      <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
        Find Your Next{' '}
        <span className="inline-block bg-gradient-to-r from-primary to-white bg-clip-text text-transparent">
          Favourite Game
        </span>
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
        Discover new games that match your exact preferences with our advanced filtering system
      </p>
    </div>
  );
};

export default Hero; 