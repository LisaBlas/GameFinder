import React from 'react';
import { motion } from 'framer-motion';

const popularTrails = [
  { href: '/best/cozy-games', label: 'Cozy games' },
  { href: '/best/survival-crafting-games', label: 'Survival crafting' },
  { href: '/best/dark-fantasy-rpg-games', label: 'Dark fantasy RPGs' },
  { href: '/best/souls-like-games', label: 'Souls-like games' },
  { href: '/best/mystery-adventure-games', label: 'Mystery adventures' },
  { href: '/best/city-builder-games', label: 'City builders' },
];

const SearchPlaceholder: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="search-placeholder flex flex-1 items-center justify-center px-6 pb-16 text-center"
    >
      <div className="max-w-2xl">
        <p className="etched-placeholder-title font-cinzel text-3xl font-normal uppercase leading-tight tracking-[0.18em] sm:text-4xl lg:text-5xl">
          Pick keywords on the left
        </p>
        <p className="etched-placeholder-subtitle mt-5 font-cinzel text-xs font-normal uppercase tracking-[0.24em] sm:text-sm">
          Matching games will appear here.
        </p>
        <div className="popular-trails">
          <p className="popular-trails-label">Or begin with a popular trail</p>
          <nav className="popular-trails-list" aria-label="Popular game searches">
            {popularTrails.map((trail) => (
              <a key={trail.href} href={trail.href} className="popular-trail-link">
                {trail.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchPlaceholder;
