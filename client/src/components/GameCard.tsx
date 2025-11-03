import React, { useState, useEffect, useRef } from 'react';
// Global analytics variable (if present)
declare const gtag: any;
import { SiSteam, SiEpicgames, SiGogdotcom, SiHumblebundle, SiItchdotio, SiAppstore, SiGoogleplay, SiNintendo, SiPlaystation } from 'react-icons/si';
import { FaGamepad, FaShoppingCart, FaGlobe, FaXbox, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { useFilters } from '../context/FilterContext';
// Import icon images with different names to avoid conflicts
import EnebaIconImg from '../assets/icons/eneba.png';
import G2AIconImg from '../assets/icons/g2a.png';
import InstantGamingIconImg from '../assets/icons/instantGaming.png';
import KinguinIconImg from '../assets/icons/kinguin.png';
import GamersGateIconImg from '../assets/icons/gamersGate.png';

const trackExternalClick = (storeName: string, storeType: 'official' | 'affiliate', gameTitle: string) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'click', {
      event_category: 'External_Link',
      event_label: `${storeType}_${storeName}`,
      custom_parameter_1: 'external_redirect',
      game_title: gameTitle,
      store_type: storeType
    });
  }
};

interface Game {
  id: number;
  name: string;
  summary?: string;
  cover?: {
    url: string;
  };
  rating?: number;
  first_release_date?: number;
  genres?: { id: number; name: string }[];
  themes?: { id: number; name: string }[];
  keywords?: { id: number; name: string }[];
  platforms?: { id: number; name: string }[];
  game_modes?: { id: number; name: string }[];
  websites?: Array<{
    id: number;
    url: string;
    category: number;
  }>;
  external_games?: Array<{
    id: number;
    name: string;
    external_game_source: number;
    url: string;
  }>;
  involved_companies?: Array<{
    id: number;
    company: {
      id: number;
      name: string;
    };
    developer: boolean;
    publisher: boolean;
  }>;
}

interface GameCardProps {
  game: Game;
  expanded?: boolean; // controlled expanded state (optional)
  onToggle?: (expanded: boolean) => void; // notify parent to toggle
  onPopupOpen?: () => void; // notify parent when popup opens
}

// Helper function to encode game title for URLs
const encodeGameTitle = (title: string): string => {
  return encodeURIComponent(title.trim().toLowerCase());
};

// Custom SVG icons for stores without official React icons
const KinguinIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img
    src={KinguinIconImg}
    alt="Kinguin-Store-Icon"
    {...props}
    className={`w-5 h-5 object-contain ${props.className || ''}`}
  />
);

const GamersGateIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img
    src={GamersGateIconImg}
    alt="GamersGate-Store-Icon"
    {...props}
    className={`w-5 h-5 object-contain ${props.className || ''}`}
  />
);

const EnebaIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img
    src={EnebaIconImg}
    alt="Eneba-Store-Icon"
    {...props}
    className={`w-5 h-5 object-contain ${props.className || ''}`}
  />
);

const G2AIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img
    src={G2AIconImg}
    alt="G2A-Store-Icon"
    {...props}
    className={`w-5 h-5 object-contain ${props.className || ''}`}
  />
);

const InstantGamingIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img
    src={InstantGamingIconImg}
    alt="Instant-Gaming-Store-Icon"
    {...props}
    className={`w-5 h-5 object-contain ${props.className || ''}`}
  />
);

// Generate affiliate links for different platforms
const getAffiliateLinks = (gameTitle: string) => {
  const encodedTitle = encodeGameTitle(gameTitle);
  
  return {
    kinguin: {
      url: `https://kinguin.net/?r=6821d3b3a5047`,
      searchUrl: `https://kinguin.net/catalogsearch/result/index/?q=${encodedTitle}&r=6821d3b3a5047`,
      name: 'Kinguin',
      icon: KinguinIcon
    },
    gamersgate: {
      url: `https://www.gamersgate.com/games/?query=${encodedTitle}&aff=101cb522a80aa651def97a459c07ed80bea7a27d`,
      name: 'GamersGate',
      icon: GamersGateIcon
    },
    eneba: {
      url: `https://www.eneba.com/fr/store/all?text=${encodedTitle}&af_id=Lisa_Blas`,
      name: 'Eneba',
      icon: EnebaIcon
    },
    g2a: {
      url: `https://www.g2a.com/search?query=${encodedTitle}&reflink=eb3730e215`,
      name: 'G2A',
      icon: G2AIcon
    },
    instantGaming: {
      url: `https://www.instant-gaming.com/fr/rechercher/?q=${encodedTitle}&igr=gamefinder-link`,
      name: 'Instant Gaming',
      icon: InstantGamingIcon
    }
  };
};

// Custom hook for Kinguin redirect with localStorage tracking
const useKinguinRedirect = (gameTitle: string) => {
  const [hasVisitedKinguin, setHasVisitedKinguin] = useState(() => {
    // Check if we've set the cookie before using localStorage
    try {
      return localStorage.getItem('kinguin_cookie_set') === 'true';
    } catch (e) {
      return false;
    }
  });
  
  const { kinguin } = getAffiliateLinks(gameTitle);
  
  const handleKinguinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

     // Track the Kinguin click
     trackExternalClick('Kinguin', 'affiliate', gameTitle);
    
    // Create a reference to the game title for iframe communication
    const encodedTitle = encodeGameTitle(gameTitle);
    
    if (!hasVisitedKinguin) {
      // Create a modal to handle Kinguin cookie setting and redirection
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      modal.style.zIndex = '9999';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      
      // Create message
      const message = document.createElement('div');
      message.style.color = 'white';
      message.style.marginBottom = '20px';
      message.style.textAlign = 'center';
      message.style.maxWidth = '80%';
      message.innerHTML = `
        <p style="font-size: 18px; margin-bottom: 10px;">Setting affiliate cookie for Kinguin...</p>
        <p style="font-size: 14px;">You'll be redirected to search results for "${gameTitle}" in a few seconds.</p>
      `;
      modal.appendChild(message);
      
      // Create iframe to load the affiliate link in background
      const iframe = document.createElement('iframe');
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = 'none';
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.src = kinguin.url;
      modal.appendChild(iframe);
      
      // Add a loading spinner
      const spinner = document.createElement('div');
      spinner.style.border = '4px solid rgba(255, 255, 255, 0.3)';
      spinner.style.borderTop = '4px solid white';
      spinner.style.borderRadius = '50%';
      spinner.style.width = '40px';
      spinner.style.height = '40px';
      spinner.style.animation = 'spin 1s linear infinite';
      modal.appendChild(spinner);
      
      // Add keyframes for spinner
      const style = document.createElement('style');
      style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
      
      // Add modal to body
      document.body.appendChild(modal);
      
      // Wait for the cookie to be set, then redirect
      setTimeout(() => {
        try {
          // Save to localStorage that we've set the cookie
          localStorage.setItem('kinguin_cookie_set', 'true');
          setHasVisitedKinguin(true);
        } catch (e) {
          console.error('Could not save to localStorage:', e);
        }
        
        // Remove the modal
        document.body.removeChild(modal);
        
        // Open the search URL in a new tab
        window.open(kinguin.searchUrl, '_blank');
      }, 3000); // 3 seconds should be enough to set the cookie
    } else {
      // If we've already set the cookie in a previous session, go directly to search
      window.open(kinguin.searchUrl, '_blank');
    }
  };
  
  return { handleKinguinClick, hasVisitedKinguin };
};

const GameCard: React.FC<GameCardProps> = ({ game, expanded, onToggle, onPopupOpen }) => {
  const isControlled = typeof expanded === 'boolean';
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
  const isExpanded = isControlled ? (expanded as boolean) : uncontrolledExpanded;
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const [videos, setVideos] = useState<Array<{ name?: string; video_id: string }>>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [hasLoadedVideos, setHasLoadedVideos] = useState(false);
  const { handleKinguinClick } = useKinguinRedirect(game.name);
  const [isAfterExpandAnimation, setIsAfterExpandAnimation] = useState(false);
  const topSectionRef = useRef<HTMLDivElement | null>(null);
  const [showPricePopup, setShowPricePopup] = useState(false);
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const { addFilter, isFilterSelected } = useFilters();

  // Close popup when card is collapsed
  useEffect(() => {
    if (!isExpanded) {
      setShowPricePopup(false);
    }
  }, [isExpanded]);

  // Check localStorage on mount to see if this card has been clicked before
  useEffect(() => {
    const clickedGames = JSON.parse(localStorage.getItem('clickedGames') || '[]');
    if (clickedGames.includes(game.id)) {
      setHasBeenClicked(true);
    }
  }, [game.id]);

  const handleClick = () => {
    if (!hasBeenClicked) {
      // Add this game to the clicked games in localStorage
      const clickedGames = JSON.parse(localStorage.getItem('clickedGames') || '[]');
      if (!clickedGames.includes(game.id)) {
        clickedGames.push(game.id);
        localStorage.setItem('clickedGames', JSON.stringify(clickedGames));
      }
      setHasBeenClicked(true);
    }
    if (isControlled) {
      onToggle && onToggle(!isExpanded);
    } else {
      setUncontrolledExpanded(!isExpanded);
    }
  };

  // Format the image URL to get a thumbnail size
  const imageUrl = game.cover?.url 
    ? game.cover.url.replace('/t_thumb/', '/t_cover_big/')
    : 'https://via.placeholder.com/300x400?text=No+Image';

  // Format release year
  const releaseYear = game.first_release_date 
    ? new Date(game.first_release_date * 1000).getFullYear() 
    : 'Unknown';

  // Format rating to one decimal place
  const rating = game.rating
    ? Math.round(game.rating) / 10
    : null;

  // Get developer name with fallback
  const developerName = React.useMemo(() => {
    if (!game.involved_companies || game.involved_companies.length === 0) {
      return undefined;
    }

    // Try to find a developer
    const developer = game.involved_companies.find(ic => ic.developer);
    if (developer?.company?.name) {
      return developer.company.name;
    }

    // Fallback: if no developer found, try to get the first company
    const firstCompany = game.involved_companies[0];
    return firstCompany?.company?.name;
  }, [game.involved_companies]);

  // Debug: Log involved_companies data (remove this after testing)
  useEffect(() => {
    if (game.involved_companies && game.involved_companies.length > 0) {
      console.log(`[${game.name}] involved_companies:`, game.involved_companies);
      console.log(`[${game.name}] developerName:`, developerName);
    }
  }, [game.involved_companies, game.name, developerName]);

  // Handler for tag clicks
  const handleTagClick = (tag: { id: number; name: string }, category: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card expansion/collapse

    // Check if filter is already selected
    if (!isFilterSelected(tag.id, category)) {
      addFilter({
        id: tag.id,
        name: tag.name,
        category: category,
        compositeId: `${category}-${tag.id}-${tag.name}`.toLowerCase().replace(/\s+/g, '-')
      });
    }
  };

  // Get affiliate links
  const affiliateLinks = getAffiliateLinks(game.name);

  const handleLinkClick = (e: React.MouseEvent, url: string, storeName: string, storeType: 'official' | 'affiliate' = 'official') => {
    e.preventDefault();
    e.stopPropagation();

    // Track the click
    trackExternalClick(storeName, storeType, game.name);

    window.open(url, '_blank');
  };

  // Lazy-load videos the first time the card is expanded
  useEffect(() => {
    const fetchVideos = async () => {
      if (!isExpanded || !isAfterExpandAnimation || hasLoadedVideos) return;
      try {
        setIsVideoLoading(true);
        const resp = await fetch(`/api/games/${game.id}/videos`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const parsed = Array.isArray(data) ? data : [];
        setVideos(parsed.filter((v: any) => typeof v?.video_id === 'string' && v.video_id.length > 0));
      } catch (e) {
        console.error('Failed to load videos for game', game.id, e);
      } finally {
        setHasLoadedVideos(true);
        setIsVideoLoading(false);
      }
    };
    fetchVideos();
  }, [isExpanded, isAfterExpandAnimation, hasLoadedVideos, game.id]);

  // Wait for the fade animation to complete before showing expanded content
  useEffect(() => {
    if (!isExpanded) {
      setIsAfterExpandAnimation(false);
      return;
    }

    const node = topSectionRef.current;
    if (!node) {
      const timer = setTimeout(() => setIsAfterExpandAnimation(true), 300);
      return () => clearTimeout(timer);
    }

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'opacity' || e.propertyName === 'all') {
        setIsAfterExpandAnimation(true);
      }
    };

    node.addEventListener('transitionend', onTransitionEnd as any);
    // Fallback safety timer in case transitionend doesn't fire
    const fallbackTimer = setTimeout(() => setIsAfterExpandAnimation(true), 350);
    return () => {
      node.removeEventListener('transitionend', onTransitionEnd as any);
      clearTimeout(fallbackTimer);
    };
  }, [isExpanded]);

  return (
    <div
      className={`game-card rounded-lg overflow-hidden transition-all duration-300 flex flex-col cursor-pointer aspect-[3/4] relative ${isExpanded ? 'expanded' : ''} ${hasBeenClicked ? 'clicked' : ''}`}
      onClick={handleClick}
    >
      <div ref={topSectionRef} className={`relative transition-opacity duration-300 ${isExpanded ? 'opacity-0 h-0 pointer-events-none' : 'opacity-100 h-full'}`}>
        <img 
          src={imageUrl}
          alt={`${game.name}-game-cover-image`} 
          className="w-full h-full object-contain"
        />
        {rating && (
          <div className="absolute top-2 right-2 text-white text-xs font-medium px-2 py-1 rounded-md">
            {rating.toFixed(1)} ⭐
          </div>
        )}
        
        {/* Official Stores overlay on cover image */}
        {!isExpanded && (
          <div className="absolute bottom-2 right-2 flex gap-1 p-2 rounded-md">
            {/* Official Website */}
            {game.websites?.map((website) => {
              if (website.category === 1 && !website.url.includes('youtube.com')) {
                return (
                  <a
                    key={website.id}
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black/70 w-8 h-8 hover:bg-slate-700 text-white rounded transition-all duration-200 flex items-center justify-center"
                    title="Official Website"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackExternalClick('Official Website', 'official', game.name);
                    }}
                  >
                    <FaGlobe className="w-4 h-4" />
                  </a>
                );
              }
              return null;
            })}

            {/* Store Links */}
            {game.external_games?.filter((store, index, self) => {
              if (!store.url) return false;

              // Filter out YouTube and Amazon links
              if (store.url.includes('youtube.com') ||
                  store.url.includes('youtube.gaming') ||
                  store.url.includes('amazon.com')) return false;

              // Filter out old Xbox 360 marketplace links that redirect to generic pages
              if (store.url.includes('marketplace.xbox.com')) return false;

              // Group Xbox-related sources (Microsoft Store: 11, Xbox Marketplace: 31, Xbox Game Pass: 54)
              const xboxSources = [11, 31, 54];
              const isXbox = xboxSources.includes(store.external_game_source);

              // For Xbox sources, deduplicate by keeping only the first Xbox entry
              if (isXbox) {
                const firstXboxIndex = self.findIndex(s => xboxSources.includes(s.external_game_source) && s.url && !s.url.includes('marketplace.xbox.com'));
                return index === firstXboxIndex;
              }

              // For non-Xbox sources, deduplicate by external_game_source as before
              return index === self.findIndex(s => s.external_game_source === store.external_game_source);
            }).map((store) => {
              const icon = getStoreIcon(store.external_game_source);
              if (icon) {
                const storeName = getStoreName(store.external_game_source);
                return (
                  <a
                    key={store.id}
                    href={store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black/70 w-10 h-10 hover:bg-slate-700 text-white rounded transition-all duration-200 flex items-center justify-center"
                    title={storeName}
                    onClick={(e) => {
                      e.stopPropagation();
                      trackExternalClick(storeName, 'official', game.name);
                    }}
                  >
                    {React.cloneElement(icon, { className: "w-6 h-6" })}
                  </a>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
      
      <div className={`p-4 flex-1 flex flex-col transition-all duration-300 ${isExpanded ? 'pt-4 overflow-y-auto custom-scrollbar' : ''}`}>
        

        {isExpanded && isAfterExpandAnimation && (
          <>
            {/* Rating badge in expanded state */}
            {rating && (
              <div className="absolute top-2 right-2 text-white text-xs font-medium px-2 py-1 rounded-md bg-black/50 z-10">
                {rating.toFixed(1)} ⭐
              </div>
            )}

            <h3 className="text-lg font-medium text-white mb-1">{game.name}</h3>

            <div className="text-xs text-slate-400 mb-3">
              {releaseYear}
              {developerName && (
                <>
                  {' • '}
                  <span className="text-slate-300">{developerName}</span>
                </>
              )}
            </div>
            {/* Video section */}
            <div className="mb-3">
              {isVideoLoading && (
                <div className="w-full h-48 border border-slate-700 rounded-md animate-pulse" />
              )}
              {!isVideoLoading && videos.length > 0 && (
                <div className="w-full aspect-video bg-black rounded-md overflow-hidden">
                  <iframe
                    title={videos[0]?.name || `${game.name} video`}
                    src={`https://www.youtube.com/embed/${videos[0].video_id}?rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              )}
              {!isVideoLoading && hasLoadedVideos && videos.length === 0 && (
                <div className="w-full h-10 text-xs text-slate-400 flex items-center">No video available</div>
              )}
            </div>

            {/* Tags section */}
            {(game.genres || game.themes || game.keywords) && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(game.genres || []).slice(0, 2).map(tag => ({ ...tag, type: 'genre', category: 'genres' })),
                    ...(game.themes || []).slice(0, 2).map(tag => ({ ...tag, type: 'theme', category: 'themes' })),
                    ...(showAllKeywords ? (game.keywords || []) : (game.keywords || []).slice(0, 8)).map(tag => ({ ...tag, type: 'keyword', category: 'Keywords' }))
                  ]
                    .map((tag) => {
                      const isKeyword = tag.type === 'keyword';
                      const isPurple = tag.type === 'genre' || tag.type === 'theme';
                      const displayName = isKeyword
                        ? tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
                        : tag.name;
                      const isSelected = isFilterSelected(tag.id, tag.category);

                      return (
                        <button
                          key={`${tag.type}-${tag.id}-${tag.name}`}
                          onClick={(e) => handleTagClick(tag, tag.category, e)}
                          className={`px-2 py-1 text-xs rounded-md transition-all cursor-pointer ${
                            isPurple
                              ? isSelected
                                ? 'bg-purple-500/30 text-purple-100 ring-2 ring-purple-400/50'
                                : 'bg-purple-900/10 text-purple-200 hover:bg-purple-800/20'
                              : isSelected
                                ? 'bg-amber-500/30 text-amber-100 ring-2 ring-amber-400/50'
                                : 'bg-amber-900/10 text-amber-200 hover:bg-amber-800/20'
                          }`}
                          title={`Click to add "${displayName}" to filters`}
                        >
                          {displayName}
                        </button>
                      );
                    })}
                  {/* Show more button for keywords */}
                  {!showAllKeywords && (game.keywords || []).length > 8 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllKeywords(true);
                      }}
                      className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
                    >
                      +{(game.keywords || []).length - 8} more
                    </button>
                  )}
                  {/* Show less button */}
                  {showAllKeywords && (game.keywords || []).length > 8 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllKeywords(false);
                      }}
                      className="px-2 py-1 text-xs rounded-md bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
                    >
                      Show less
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Spacer to push button to bottom */}
            <div className="flex-1"></div>

            {/* Purchase button - sticky at bottom */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPricePopup(true);
                onPopupOpen?.();
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-md transition-all duration-200 shadow-lg hover:shadow-amber-500/50 mt-auto"
            >
              Purchase Options
            </button>

          </>
        )}
      </div>

      {/* Price popup modal */}
      {showPricePopup && (
        <div
          className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4 overflow-y-auto custom-scrollbar"
          onClick={(e) => {
            e.stopPropagation();
            setShowPricePopup(false);
          }}
        >
          <div
            className="bg-slate-800 rounded-lg p-6 max-w-lg w-full border border-slate-700 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1 text-left">
                <h3 className="text-md font-semibold text-white mb-2 leading-tight text-left">{game.name}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-400 leading-none text-left">
                  <span>{releaseYear}</span>
                  {developerName && (
                    <>
                      <span>•</span>
                      <span>{developerName}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPricePopup(false);
                }}
                className="text-slate-400 hover:text-white transition-colors text-2xl leading-none ml-4 flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Official Stores Section */}
            {game.external_games && game.external_games.filter(store =>
              store.url &&
              !store.url.includes('youtube.com') &&
              !store.url.includes('youtube.gaming') &&
              !store.url.includes('amazon.com')
            ).length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-left">
                  <FaCheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wide leading-none text-left">Official Stores</h4>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed text-left">Official retailers - full market price</p>
                {(() => {
                  const filteredStores = game.external_games
                    .filter((store, index, self) => {
                      if (!store.url) return false;
                      if (store.url.includes('youtube.com') ||
                          store.url.includes('youtube.gaming') ||
                          store.url.includes('amazon.com')) return false;

                      // Group Xbox-related sources (Microsoft Store: 11, Xbox Marketplace: 31, Xbox Game Pass: 54)
                      const xboxSources = [11, 31, 54];
                      const isXbox = xboxSources.includes(store.external_game_source);

                      // For Xbox sources, deduplicate by keeping only the first Xbox entry
                      if (isXbox) {
                        const firstXboxIndex = self.findIndex(s => xboxSources.includes(s.external_game_source) && s.url && !s.url.includes('marketplace.xbox.com'));
                        return index === firstXboxIndex;
                      }

                      // For non-Xbox sources, deduplicate by external_game_source as before
                      return index === self.findIndex(s => s.external_game_source === store.external_game_source);
                    })
                    .map((store) => {
                      const icon = getStoreIcon(store.external_game_source);
                      if (icon) {
                        const storeName = getStoreName(store.external_game_source);
                        return (
                          <button
                            key={store.id}
                            onClick={(e) => handleLinkClick(e, store.url, storeName, 'official')}
                            className="aspect-square bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center group relative hover:border-green-500/50"
                            title={storeName}
                          >
                            {React.cloneElement(icon, { className: "w-6 h-6" })}
                            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              {storeName}
                            </span>
                          </button>
                        );
                      }
                      return null;
                    })
                    .filter(Boolean);

                  return filteredStores.length > 0 ? (
                    <div className="grid grid-cols-5 gap-3">
                      {filteredStores}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic text-left">No official store links available</p>
                  );
                })()}
              </div>
            )}

            {/* Official Website */}
            {game.websites?.some(w => w.category === 1 && !w.url.includes('youtube.com')) && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 text-left">
                  <FaGlobe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wide leading-none text-left">Official Website</h4>
                </div>
                {game.websites
                  .filter(w => w.category === 1 && !w.url.includes('youtube.com'))
                  .map((website) => (
                    <a
                      key={website.id}
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        trackExternalClick('Official Website', 'official', game.name);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 border border-slate-600 hover:border-blue-500/50 text-sm"
                    >
                      <FaGlobe className="w-4 h-4" />
                      Visit Official Site
                    </a>
                  ))}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-slate-700 my-6"></div>

            {/* Key Resellers Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-left">
                <FaShoppingCart className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <h4 className="text-sm font-semibold text-white uppercase tracking-wide leading-none text-left">Key Resellers</h4>
              </div>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed text-left">Third-party search - find cheaper deals</p>
              <div className="grid grid-cols-5 gap-3">
                {/* Kinguin */}
                <button
                  onClick={handleKinguinClick}
                  className="aspect-square bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center group relative"
                  title={affiliateLinks.kinguin.name}
                >
                  <affiliateLinks.kinguin.icon />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {affiliateLinks.kinguin.name}
                  </span>
                </button>

                {/* GamersGate */}
                <button
                  onClick={(e) => handleLinkClick(e, affiliateLinks.gamersgate.url, 'GamersGate', 'affiliate')}
                  className="aspect-square bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center group relative"
                  title={affiliateLinks.gamersgate.name}
                >
                  <affiliateLinks.gamersgate.icon />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {affiliateLinks.gamersgate.name}
                  </span>
                </button>

                {/* Eneba */}
                <button
                  onClick={(e) => handleLinkClick(e, affiliateLinks.eneba.url, 'Eneba', 'affiliate')}
                  className="aspect-square bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center group relative"
                  title={affiliateLinks.eneba.name}
                >
                  <affiliateLinks.eneba.icon />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {affiliateLinks.eneba.name}
                  </span>
                </button>

                {/* G2A */}
                <button
                  onClick={(e) => handleLinkClick(e, affiliateLinks.g2a.url, 'G2A', 'affiliate')}
                  className="aspect-square bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center group relative"
                  title={affiliateLinks.g2a.name}
                >
                  <affiliateLinks.g2a.icon />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {affiliateLinks.g2a.name}
                  </span>
                </button>

                {/* Instant Gaming */}
                <button
                  onClick={(e) => handleLinkClick(e, affiliateLinks.instantGaming.url, 'Instant Gaming', 'affiliate')}
                  className="aspect-square bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center group relative"
                  title={affiliateLinks.instantGaming.name}
                >
                  <affiliateLinks.instantGaming.icon />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {affiliateLinks.instantGaming.name}
                  </span>
                </button>
              </div>
            </div>

            {/* Trust & Disclosure Footer */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <div className="flex items-start gap-2 text-xs text-slate-400 text-left">
                <FaInfoCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 leading-relaxed text-left">
                  <p className="leading-relaxed text-left">We only list reputable sellers. Prices may vary - check seller ratings before purchase.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(30, 41, 59, 0.3);
            border-radius: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(217, 119, 6, 0.5);
            border-radius: 4px;
            transition: background 0.2s ease;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(217, 119, 6, 1);
          }
        `}
      </style>
    </div>
  );
};

// Updated store icon function to include all platforms
// Based on official IGDB external_games category enum
const getStoreIcon = (category: number) => {
  switch (category) {
    case 1: // Steam
      return <SiSteam className="w-5 h-5" />;
    case 5: // GOG
      return <SiGogdotcom className="w-5 h-5" />;
    case 11: // Microsoft Store
    case 31: // Xbox Marketplace
    case 54: // Xbox Game Pass Ultimate Cloud
      return <FaXbox className="w-5 h-5" />;
    case 13: // Apple App Store
      return <SiAppstore className="w-5 h-5" />;
    case 15: // Android/Google Play
      return <SiGoogleplay className="w-5 h-5" />;
    case 26: // Epic Games Store
      return <SiEpicgames className="w-5 h-5" />;
    case 28: // Oculus
      return null; // No icon available
    case 29: // Utomik
      return null; // No icon available
    case 30: // itch.io
      return <SiItchdotio className="w-5 h-5" />;
    case 32: // Kartridge
      return null; // No icon available
    case 36: // PlayStation Store US
      return <SiPlaystation className="w-5 h-5" />;
    case 55: // GameJolt
      return null; // No icon available
    default:
      return null;
  }
};

// Helper function to get store name
// Based on official IGDB external_games category enum
const getStoreName = (category: number): string => {
  switch (category) {
    case 1: return 'Steam';
    case 5: return 'GOG';
    case 11: // Microsoft Store
    case 31: // Xbox Marketplace
    case 54: // Xbox Game Pass Ultimate Cloud
      return 'Xbox';
    case 13: return 'Apple App Store';
    case 15: return 'Google Play';
    case 26: return 'Epic Games Store';
    case 28: return 'Oculus';
    case 29: return 'Utomik';
    case 30: return 'itch.io';
    case 32: return 'Kartridge';
    case 36: return 'PlayStation Store';
    case 55: return 'GameJolt';
    default: return 'Unknown Store';
  }
};

export default GameCard;