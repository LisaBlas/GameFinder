import React from 'react';

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
}

interface GameCardProps {
  game: Game;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
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
    <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-500 transition-colors duration-200 flex flex-col h-full">
      <div className="relative aspect-[16/9] bg-slate-900">
        <img 
          src={imageUrl}
          alt={`${game.name} cover`} 
          className="w-full h-full object-cover"
        />
        {rating && (
          <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs font-medium px-2 py-1 rounded-md">
            Rating: {rating.toFixed(1)}
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-medium text-white mb-1">{game.name}</h3>
        
        <div className="text-xs text-slate-400 mb-3">
          {releaseYear}
        </div>
        
        {game.summary && (
          <p className="text-sm text-slate-300 line-clamp-3 mb-3">
            {game.summary}
          </p>
        )}
        
        <div className="mt-auto">
          {(game.genres || game.themes) && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {game.genres?.slice(0, 2).map(genre => (
                <span key={`genre-${genre.id}`} className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                  {genre.name}
                </span>
              ))}
              {game.themes?.slice(0, 1).map(theme => (
                <span key={`theme-${theme.id}`} className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                  {theme.name}
                </span>
              ))}
            </div>
          )}
          
          {game.platforms && (
            <div className="text-xs text-slate-400">
              Platforms: 
              <span className="text-slate-300"> 
                {game.platforms.map(p => p.name).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameCard;
