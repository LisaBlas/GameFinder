import React, { useState } from 'react';
import { SiSteam, SiEpicgames, SiGogdotcom, SiHumblebundle, SiItchdotio, SiAppstore, SiGoogleplay, SiNintendo, SiPlaystation } from 'react-icons/si';
import { FaGamepad, FaShoppingCart, FaGlobe, FaXbox } from 'react-icons/fa';

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

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <div 
      className={`game-card bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-500 transition-all duration-300 flex flex-col h-full cursor-pointer ${isExpanded ? 'expanded' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className={`relative bg-slate-900 transition-all duration-300 ${isExpanded ? 'h-0' : 'h-[300px]'}`}>
        <img 
          src={imageUrl}
          alt={`${game.name} cover`} 
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
          <div className="mt-auto">
            <div className="text-center text-sm text-slate-400 mb-2">Find on</div>
            <div className="h-px bg-slate-700 mb-3"></div>
            <div className="store-buttons grid grid-cols-4 gap-2">
              {/* Official Website */}
              {game.websites?.map((website) => {
                if (website.category === 1 && !website.url.includes('youtube.com')) {
                  return (
                    <a
                      key={website.id}
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square hover:bg-slate-900 text-white rounded-[4px] transition-all duration-200 hover:border hover:border-primary hover:shadow-[0_0_10px_rgba(124,58,237,0.5)] flex items-center justify-center"
                      title="Official Website"
                    >
                      <FaGlobe className="w-6 h-6" />
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
                console.log('Store:', store.name, 'Category:', store.category, 'URL:', store.url);
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
                    >
                      {icon}
                    </a>
                  );
                }
                return null;
              })}
            </div>
          </div>
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
  console.log('Getting icon for category:', category, 'URL:', url);
  
  // Special case for GOG links that come in as category 5
  if (category === 5 && url?.includes('gog.com')) {
    return <SiGogdotcom className="w-6 h-6" />;
  }
  
  switch (category) {
    case 1: // Steam
      return <SiSteam className="w-6 h-6" />;
    case 2: // GOG
      return <SiGogdotcom className="w-6 h-6" />;
    case 3: // Epic Games
      return <SiEpicgames className="w-6 h-6" />;
    case 4: // App Store
      return <SiAppstore className="w-6 h-6" />;
    case 5: // Google Play
      return <SiGoogleplay className="w-6 h-6" />;
    case 6: // Nintendo eShop
      return <SiNintendo className="w-6 h-6" />;
    case 7: // Xbox Store
      return <FaXbox className="w-6 h-6" />;
    case 8: // PlayStation Store
      return <SiPlaystation className="w-6 h-6" />;
    case 9: // itch.io
      return <SiItchdotio className="w-6 h-6" />;
    case 10: // Humble Bundle
      return <SiHumblebundle className="w-6 h-6" />;
    case 11: // Microsoft Store
      return <FaXbox className="w-6 h-6" />;
    default:
      console.log('No icon found for category:', category);
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
