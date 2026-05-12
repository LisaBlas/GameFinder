import { Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { useFilters } from '../context/FilterContext';

export const ShareButton = () => {
  const { gameResults, selectedFilters } = useFilters();
  const [copied, setCopied] = useState(false);

  if (!gameResults.length) return null;

  const kwNames = selectedFilters
    .filter(f => f.category === 'Keywords' && f.mode !== 'exclude')
    .map(f => f.name);

  const shareText = kwNames.length
    ? `Found great games on GameFinder searching ${kwNames.join(' + ')} → ${window.location.href}`
    : `Found great games on GameFinder → ${window.location.href}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'GameFinder', text: shareText, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="results-filter-trigger flex items-center gap-1.5 text-xs"
      aria-label="Share results"
    >
      {copied
        ? <Check className="w-3.5 h-3.5 text-[var(--c-emerald)]" />
        : <Share2 className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
};
