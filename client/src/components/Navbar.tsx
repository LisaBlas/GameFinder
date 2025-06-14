import React, { useState, useEffect } from 'react';
import { FaGithub } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { FaGlobe } from 'react-icons/fa6';

const Navbar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Show navbar only when at the very top (scroll position 0)
      setIsVisible(window.scrollY === 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-16 bg-transparent backdrop-blur-sm z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
      }`}
    >
      <div className="container mx-auto h-full flex items-center justify-between px-4">
        <div className="flex-1"></div>
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-white bg-clip-text text-transparent">
          GameFinder
        </span>
        <div className="flex-1 flex justify-end gap-4">
          <a
            href="https://lisablas.github.io/BleepBloop/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-primary transition-colors"
          >
            <FaGlobe size={20} />
          </a>
          <a
            href="https://github.com/LisaBlas/GameFinder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-primary transition-colors"
          >
            <FaGithub size={20} />
          </a>
          <a
            href="https://x.com/BerliozGordon"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-primary transition-colors"
          >
            <FaXTwitter size={20} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Navbar; 