import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/30 backdrop-blur-sm border-b border-border/30">
      <div className="container mx-auto h-16 flex items-center justify-center">
        <h1 className="text-2xl font-heading font-bold text-white">GameFinder</h1>
      </div>
    </nav>
  );
};

export default Navbar; 