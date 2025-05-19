import React, { useState, useEffect } from 'react';
import { SiSteam, SiEpicgames, SiGogdotcom, SiHumblebundle, SiItchdotio, SiAppstore, SiGoogleplay, SiNintendo, SiPlaystation } from 'react-icons/si';
import { FaGamepad, FaShoppingCart, FaGlobe, FaXbox } from 'react-icons/fa';
// Import icon images with different names to avoid conflicts
import EnebaIconImg from '../assets/icons/eneba.png';
import G2AIconImg from '../assets/icons/g2a.png';
import InstantGamingIconImg from '../assets/icons/instantGaming.png';
import KinguinIconImg from '../assets/icons/kinguin.png';
import GamersGateIconImg from '../assets/icons/gamersGate.png';

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

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const { handleKinguinClick } = useKinguinRedirect(game.name);

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
    setIsExpanded(!isExpanded);
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

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank');
  };

  return (
    <div 
      className={`game-card bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-500 transition-all duration-300 flex flex-col h-full cursor-pointer ${isExpanded ? 'expanded' : ''} ${hasBeenClicked ? 'clicked' : ''}`}
      onClick={handleClick}
    >
      <div className={`relative bg-slate-900 transition-all duration-300 ${isExpanded ? 'h-0' : 'h-[300px]'}`}>
        <img 
          src={imageUrl}
          alt={`${game.name}-game-cover-image`} 
          className="w-full h-full object-cover"
        />
        {rating && (
          <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs font-medium px-2 py-1 rounded-md">
            {rating.toFixed(1)} ⭐
          </div>
        )}
      </div>
      
      <div className={`p-4 flex-1 flex flex-col transition-all duration-300 ${isExpanded ? 'pt-4' : ''}`}>
        <h3 className="text-lg font-medium text-white mb-1">{game.name}</h3>
        
        <div className="text-xs text-slate-400 mb-3">
          {releaseYear}
        </div>
        
        {game.summary && (
          <div className="mb-3">
            <p className={`text-sm text-slate-300 transition-all duration-300 ${
              isExpanded 
                ? 'line-clamp-none max-h-[200px] overflow-y-auto pr-2 custom-scrollbar' 
                : 'line-clamp-3'
            }`}>
              {game.summary}
            </p>
          </div>
        )}
        
        {!isExpanded && game.platforms && (
          <div className="text-xs text-slate-400 mt-auto">
            <span className="text-slate-300"> 
              {game.platforms.map(p => p.name).join(', ')}
            </span>
          </div>
        )}

        {isExpanded && (
          <>
            <div className="mt-auto">
              <div className="text-center text-sm text-slate-400 mb-2">Official Stores</div>
              <div className="h-px bg-slate-700 mb-3"></div>
              <div className="store-buttons grid grid-cols-5 gap-2">
                {/* Official Website */}
                {game.websites?.map((website) => {
                  if (website.category === 1 && !website.url.includes('youtube.com')) {
                    return (
                      <a
                        key={website.id}
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square hover:bg-slate-900 text-white rounded-[4px] transition-all duration-200 hover:border hover:border-primary hover:shadow-[0_0_20px_6px_rgba(168,85,247,0.8)]
 flex items-center justify-center"
                        title="Official Website"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <FaGlobe className="w-5 h-5" />
                      </a>
                    );
                  }
                  return null;
                })}

                {/* Store Links */}
                {game.external_games?.filter((store, index, self) => {
                  // Filter out entries without URLs
                  if (!store.url) return false;
                  
                  // Filter out YouTube and Amazon links
                  if (store.url.includes('youtube.com') || 
                      store.url.includes('youtube.gaming') || 
                      store.url.includes('amazon.com')) return false;
                  
                  // Remove duplicates by keeping only the first occurrence of each category
                  return index === self.findIndex(s => s.category === store.category);
                }).map((store) => {
                  const icon = getStoreIcon(store.category, store.url);
                  if (icon) {
                    return (
                      <a
                        key={store.id}
                        href={store.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square hover:bg-slate-900 text-white rounded-[4px] transition-all duration-200 hover:border hover:border-primary hover:shadow-[0_0_10px_rgba(124,58,237,0.5)] flex items-center justify-center"
                        title={getStoreName(store.category, store.url)}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {React.cloneElement(icon, { className: "w-5 h-5" })}
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
            
            {/* New Affiliate Links Section with Golden Highlight */}
            <div className="mt-2">
              <div className="text-center text-sm font-medium mb-2 text-amber-400">Discounted Stores</div>
              <div className="h-px bg-amber-500/30 mb-3"></div>
              <div className="affiliate-buttons grid grid-cols-5 gap-2">
                {/* Kinguin - Special handling for cookie */}
                <button
                  onClick={handleKinguinClick}
                  className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-[4px] transition-all duration-200 flex items-center justify-center group relative"
                  title={affiliateLinks.kinguin.name}
                >
                  <affiliateLinks.kinguin.icon />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {affiliateLinks.kinguin.name}
                  </span>
                </button>
                
                {/* GamersGate */}
                <button
                  onClick={(e) => handleLinkClick(e, affiliateLinks.gamersgate.url)}
                  className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-[4px] transition-all duration-200 flex items-center justify-center group relative"
                  title={affiliateLinks.gamersgate.name}
                >
                  <affiliateLinks.gamersgate.icon />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {affiliateLinks.gamersgate.name}
                  </span>
                </button>
                
                {/* Eneba */}
                <button
                  onClick={(e) => handleLinkClick(e, affiliateLinks.eneba.url)}
                  className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-[4px] transition-all duration-200 flex items-center justify-center group relative"
                  title={affiliateLinks.eneba.name}
                >
                  <affiliateLinks.eneba.icon />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {affiliateLinks.eneba.name}
                  </span>
                </button>
                
                {/* G2A */}
                <button
                  onClick={(e) => handleLinkClick(e, affiliateLinks.g2a.url)}
                  className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-[4px] transition-all duration-200 flex items-center justify-center group relative"
                  title={affiliateLinks.g2a.name}
                >
                  <affiliateLinks.g2a.icon />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {affiliateLinks.g2a.name}
                  </span>
                </button>
                
                {/* Instant Gaming */}
                <button
                  onClick={(e) => handleLinkClick(e, affiliateLinks.instantGaming.url)}
                  className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-[4px] transition-all duration-200 flex items-center justify-center group relative"
                  title={affiliateLinks.instantGaming.name}
                >
                  <affiliateLinks.instantGaming.icon />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {affiliateLinks.instantGaming.name}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

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