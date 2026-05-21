import React from 'react';
import { motion } from 'framer-motion';

const SearchPlaceholder: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="pointer-events-none flex flex-1 items-center justify-center px-6 pb-16 text-center"
      aria-hidden="true"
    >
      <div className="max-w-2xl">
        <p className="font-cinzel text-3xl font-normal uppercase leading-tight tracking-[0.18em] text-emerald-200/[0.25] sm:text-4xl lg:text-5xl">
          Pick keywords on the left
        </p>
        <p className="mt-5 font-cinzel text-xs font-normal uppercase tracking-[0.24em] text-slate-200/[0.4] sm:text-sm">
          Matching games will appear here.
        </p>
      </div>
    </motion.div>
  );
};

export default SearchPlaceholder;
