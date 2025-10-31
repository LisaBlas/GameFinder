import React, { useState, useEffect, useRef } from 'react';
// Global analytics variable (if present)
declare const gtag: any;
import { SiSteam, SiEpicgames, SiGogdotcom, SiHumblebundle, SiItchdotio, SiAppstore, SiGoogleplay, SiNintendo, SiPlaystation } from 'react-icons/si';
import { FaGamepad, FaShoppingCart, FaGlobe, FaXbox } from 'react-icons/fa';
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
    category: number;
    url: string;
  }>;
}

interface GameCardProps {
  game: Game;
  expanded?: boolean; // controlled expanded state (optional)
  onToggle?: (expanded: boolean) => void; // notify parent to toggle
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

const GameCard: React.FC<GameCardProps> = ({ game, expanded, onToggle }) => {
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
      className={`rounded-lg overflow-hidden border border-slate-700 hover:border-slate-500 transition-all duration-300 flex flex-col cursor-pointer aspect-[3/4] ${isExpanded ? 'expanded' : ''} ${hasBeenClicked ? 'clicked' : ''}`}
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
              if (store.url.includes('youtube.com') || 
                  store.url.includes('youtube.gaming') || 
                  store.url.includes('amazon.com')) return false;
              return index === self.findIndex(s => s.category === store.category);
            }).map((store) => {
              const icon = getStoreIcon(store.category, store.url);
              if (icon) {
                const storeName = getStoreName(store.category, store.url);
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
      
      <div className={`p-4 flex-1 flex flex-col transition-all duration-300 ${isExpanded ? 'pt-4 overflow-y-auto' : ''}`}>
        

        {isExpanded && isAfterExpandAnimation && (
          <>
            <h3 className="text-lg font-medium text-white mb-1">{game.name}</h3>
        
            <div className="text-xs text-slate-400 mb-3">
              {releaseYear}
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
                    ...(game.genres || []).slice(0, 2).map(tag => ({ ...tag, type: 'genre' })),
                    ...(game.themes || []).slice(0, 2).map(tag => ({ ...tag, type: 'theme' })),
                    ...(game.keywords || []).map(tag => ({ ...tag, type: 'keyword' }))
                  ]
                    .slice(0, 10)
                    .map((tag) => {
                      const isKeyword = tag.type === 'keyword';
                      const isPurple = tag.type === 'genre' || tag.type === 'theme';
                      const displayName = isKeyword 
                        ? tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
                        : tag.name;
                      
                      return (
                        <span
                          key={`${tag.type}-${tag.id}-${tag.name}`}
                          className={`px-2 py-1 text-xs rounded-md ${
                            isPurple 
                              ? 'bg-purple-900/10 text-purple-200' 
                              : 'bg-amber-900/10 text-amber-200'
                          }`}
                        >
                          {displayName}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Spacer to push button to bottom */}
            <div className="flex-1"></div>

            {/* Check prices button - sticky at bottom */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPricePopup(true);
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium rounded-md transition-all duration-200 shadow-lg hover:shadow-amber-500/50 mt-auto"
            >
              Check Prices
            </button>

          </>
        )}
      </div>

      {/* Price popup modal */}
      {showPricePopup && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowPricePopup(false);
          }}
        >
          <div
            className="bg-slate-800/80 rounded-lg p-6 max-w-md w-full border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-medium text-white">Purchase Options</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPricePopup(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <h3 className="text-md font-medium text-white mb-4">{game.name}</h3>
            <div className="grid grid-cols-5 gap-3">
              {/* Kinguin */}
              <button
                onClick={handleKinguinClick}
                className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all duration-200 flex items-center justify-center group relative"
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
                className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all duration-200 flex items-center justify-center group relative"
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
                className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all duration-200 flex items-center justify-center group relative"
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
                className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all duration-200 flex items-center justify-center group relative"
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
                className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-all duration-200 flex items-center justify-center group relative"
                title={affiliateLinks.instantGaming.name}
              >
                <affiliateLinks.instantGaming.icon />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {affiliateLinks.instantGaming.name}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(124, 58, 237, 0.3);
            border-radius: 3px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(124, 58, 237, 0.5);
          }
        `}
      </style>
    </div>
  );
};

// Updated store icon function to include all platforms
const getStoreIcon = (category: number, url?: string) => {
  // Special case for GOG links that come in as category 5
  if (category === 5 && url?.includes('gog.com')) {
    return <SiGogdotcom className="w-5 h-5" />;
  }
  
  switch (category) {
    case 1: // Steam
      return <SiSteam className="w-5 h-5" />;
    case 2: // GOG
      return <SiGogdotcom className="w-5 h-5" />;
    case 3: // Epic Games
      return <SiEpicgames className="w-5 h-5" />;
    case 4: // App Store
      return <SiAppstore className="w-5 h-5" />;
    case 5: // Google Play
      return <SiGoogleplay className="w-5 h-5" />;
    case 6: // Nintendo eShop
      return <SiNintendo className="w-5 h-5" />;
    case 7: // Xbox Store
      return <FaXbox className="w-5 h-5" />;
    case 8: // PlayStation Store
      return <SiPlaystation className="w-5 h-5" />;
    case 9: // itch.io
      return <SiItchdotio className="w-5 h-5" />;
    case 10: // Humble Bundle
      return <SiHumblebundle className="w-5 h-5" />;
    case 11: // Microsoft Store
      return <FaXbox className="w-5 h-5" />;
    default:
      return null;
  }
};

// Helper function to get store name
const getStoreName = (category: number, url?: string): string => {
  // Special case for GOG links that come in as category 5
  if (category === 5 && url?.includes('gog.com')) {
    return 'GOG';
  }
  
  switch (category) {
    case 1: return 'Steam';
    case 2: return 'GOG';
    case 3: return 'Epic Games Store';
    case 4: return 'App Store';
    case 5: return 'Google Play';
    case 6: return 'Nintendo eShop';
    case 7: return 'Xbox Store';
    case 8: return 'PlayStation Store';
    case 9: return 'itch.io';
    case 10: return 'Humble Bundle';
    case 11: return 'Microsoft Store';
    default: return 'Unknown Store';
  }
};

export default GameCard;