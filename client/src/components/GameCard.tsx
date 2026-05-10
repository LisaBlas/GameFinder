import React, { useState, useEffect } from 'react';
// Global analytics variable (if present)
declare const gtag: any;
import { SiSteam, SiEpicgames, SiGogdotcom, SiItchdotio, SiAppstore, SiGoogleplay, SiPlaystation } from 'react-icons/si';
import { FaGamepad, FaGlobe, FaXbox, FaInfoCircle } from 'react-icons/fa';
import { useFilters } from '../context/FilterContext';
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
}

const encodeGameTitle = (title: string): string => {
  return encodeURIComponent(title.trim().toLowerCase());
};

const KinguinIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src={KinguinIconImg} alt="Kinguin-Store-Icon" {...props} className={`w-5 h-5 object-contain ${props.className || ''}`} />
);

const GamersGateIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src={GamersGateIconImg} alt="GamersGate-Store-Icon" {...props} className={`w-5 h-5 object-contain ${props.className || ''}`} />
);

const EnebaIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src={EnebaIconImg} alt="Eneba-Store-Icon" {...props} className={`w-5 h-5 object-contain ${props.className || ''}`} />
);

const G2AIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src={G2AIconImg} alt="G2A-Store-Icon" {...props} className={`w-5 h-5 object-contain ${props.className || ''}`} />
);

const InstantGamingIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src={InstantGamingIconImg} alt="Instant-Gaming-Store-Icon" {...props} className={`w-5 h-5 object-contain ${props.className || ''}`} />
);

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

const useKinguinRedirect = (gameTitle: string) => {
  const [hasVisitedKinguin, setHasVisitedKinguin] = useState(() => {
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
    trackExternalClick('Kinguin', 'affiliate', gameTitle);
    const encodedTitle = encodeGameTitle(gameTitle);

    if (!hasVisitedKinguin) {
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;';

      const message = document.createElement('div');
      message.style.cssText = 'color:white;margin-bottom:20px;text-align:center;max-width:80%;';
      message.innerHTML = `<p style="font-size:18px;margin-bottom:10px;">Setting affiliate cookie for Kinguin...</p><p style="font-size:14px;">You'll be redirected to search results for "${gameTitle}" in a few seconds.</p>`;
      modal.appendChild(message);

      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'width:1px;height:1px;border:none;position:absolute;left:-9999px;';
      iframe.src = kinguin.url;
      modal.appendChild(iframe);

      const spinner = document.createElement('div');
      spinner.style.cssText = 'border:4px solid rgba(255,255,255,0.3);border-top:4px solid white;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;';
      modal.appendChild(spinner);

      const style = document.createElement('style');
      style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);

      document.body.appendChild(modal);

      setTimeout(() => {
        try {
          localStorage.setItem('kinguin_cookie_set', 'true');
          setHasVisitedKinguin(true);
        } catch (e) {
          console.error('Could not save to localStorage:', e);
        }
        document.body.removeChild(modal);
        window.open(kinguin.searchUrl, '_blank');
      }, 3000);
    } else {
      window.open(kinguin.searchUrl, '_blank');
    }
  };

  return { handleKinguinClick };
};

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const [videos, setVideos] = useState<Array<{ name?: string; video_id: string }>>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [hasLoadedVideos, setHasLoadedVideos] = useState(false);
  const { handleKinguinClick } = useKinguinRedirect(game.name);
  const { addFilter, isFilterSelected } = useFilters();

  const imageUrl = game.cover?.url
    ? game.cover.url.replace('/t_thumb/', '/t_cover_big/')
    : 'https://via.placeholder.com/300x400?text=No+Image';

  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : 'Unknown';

  const rating = game.rating ? Math.round(game.rating) / 10 : null;

  const developerName = React.useMemo(() => {
    if (!game.involved_companies || game.involved_companies.length === 0) return undefined;
    const developer = game.involved_companies.find(ic => ic.developer);
    if (developer?.company?.name) return developer.company.name;
    return game.involved_companies[0]?.company?.name;
  }, [game.involved_companies]);

  const affiliateLinks = getAffiliateLinks(game.name);

  useEffect(() => {
    const fetchVideos = async () => {
      if (hasLoadedVideos) return;
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
  }, [game.id]);

  const handleTagClick = (tag: { id: number; name: string }, category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isFilterSelected(tag.id, category)) {
      addFilter({
        id: tag.id,
        name: tag.name,
        category,
        compositeId: `${category}-${tag.id}-${tag.name}`.toLowerCase().replace(/\s+/g, '-')
      });
    }
  };

  const handleLinkClick = (e: React.MouseEvent, url: string, storeName: string, storeType: 'official' | 'affiliate' = 'official') => {
    e.preventDefault();
    e.stopPropagation();
    trackExternalClick(storeName, storeType, game.name);
    window.open(url, '_blank');
  };

  const allTags = [
    ...(game.genres || []).slice(0, 2).map(t => ({ ...t, type: 'genre', category: 'genres' })),
    ...(game.themes || []).slice(0, 2).map(t => ({ ...t, type: 'theme', category: 'themes' })),
    ...(game.keywords || []).slice(0, 3).map(t => ({ ...t, type: 'keyword', category: 'Keywords' })),
  ];

  const filteredStores = (game.external_games || []).filter((store, index, self) => {
    if (!store.url) return false;
    if (store.url.includes('youtube.com') || store.url.includes('youtube.gaming') || store.url.includes('amazon.com')) return false;
    if (store.url.includes('marketplace.xbox.com')) return false;
    const xboxSources = [11, 31, 54];
    const isXbox = xboxSources.includes(store.external_game_source);
    if (isXbox) {
      const firstXboxIndex = self.findIndex(s => xboxSources.includes(s.external_game_source) && s.url && !s.url.includes('marketplace.xbox.com'));
      return index === firstXboxIndex;
    }
    return index === self.findIndex(s => s.external_game_source === store.external_game_source);
  });

  const officialWebsites = (game.websites || []).filter(w => w.category === 1 && !w.url.includes('youtube.com'));

  return (
    <div className="game-card rounded-lg overflow-hidden">
      {/* Cover image */}
      <div className="relative w-full h-48 flex-shrink-0">
        <img
          src={imageUrl}
          alt={`${game.name}-game-cover-image`}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {rating && (
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-md">
            {rating.toFixed(1)} ⭐
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Title + meta */}
        <div>
          <h3 className="text-base font-semibold text-white leading-snug">{game.name}</h3>
          <div className="text-xs text-slate-400 mt-0.5">
            {releaseYear}
            {developerName && (
              <> • <span className="text-slate-300">{developerName}</span></>
            )}
          </div>
        </div>

        {/* YouTube video */}
        {isVideoLoading && (
          <div className="w-full aspect-video bg-slate-700 rounded-md animate-pulse" />
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

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
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
          </div>
        )}

        {/* Purchase links */}
        <div className="flex flex-col gap-2 pt-1 border-t border-slate-700/50">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Where to buy</span>

          {/* Official stores */}
          {(filteredStores.length > 0 || officialWebsites.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {filteredStores.map((store) => {
                const icon = getStoreIcon(store.external_game_source);
                if (!icon) return null;
                const storeName = getStoreName(store.external_game_source);
                return (
                  <a
                    key={store.id}
                    href={store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); trackExternalClick(storeName, 'official', game.name); }}
                    className="w-9 h-9 bg-slate-700/50 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center transition-colors"
                    title={storeName}
                  >
                    {React.cloneElement(icon, { className: 'w-5 h-5' })}
                  </a>
                );
              })}
              {officialWebsites.map((website) => (
                <a
                  key={website.id}
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { e.stopPropagation(); trackExternalClick('Official Website', 'official', game.name); }}
                  className="w-9 h-9 bg-slate-700/50 hover:bg-blue-700/50 text-white rounded-lg flex items-center justify-center transition-colors"
                  title="Official Website"
                >
                  <FaGlobe className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}

          {/* Resellers */}
          <div className="flex flex-wrap gap-2">
            <span className="w-full text-[10px] text-slate-600">Resellers</span>
            <button
              onClick={handleKinguinClick}
              className="w-9 h-9 bg-slate-800/60 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors"
              title="Kinguin"
            >
              <KinguinIcon />
            </button>
            <button
              onClick={(e) => handleLinkClick(e, affiliateLinks.gamersgate.url, 'GamersGate', 'affiliate')}
              className="w-9 h-9 bg-slate-800/60 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors"
              title="GamersGate"
            >
              <GamersGateIcon />
            </button>
            <button
              onClick={(e) => handleLinkClick(e, affiliateLinks.eneba.url, 'Eneba', 'affiliate')}
              className="w-9 h-9 bg-slate-800/60 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors"
              title="Eneba"
            >
              <EnebaIcon />
            </button>
            <button
              onClick={(e) => handleLinkClick(e, affiliateLinks.g2a.url, 'G2A', 'affiliate')}
              className="w-9 h-9 bg-slate-800/60 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors"
              title="G2A"
            >
              <G2AIcon />
            </button>
            <button
              onClick={(e) => handleLinkClick(e, affiliateLinks.instantGaming.url, 'Instant Gaming', 'affiliate')}
              className="w-9 h-9 bg-slate-800/60 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors"
              title="Instant Gaming"
            >
              <InstantGamingIcon />
            </button>
          </div>
        </div>

        {/* Trust disclosure */}
        <div className="flex items-start gap-1.5 text-xs text-slate-500">
          <FaInfoCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>We only list reputable sellers. Prices may vary — check seller ratings before purchase.</span>
        </div>
      </div>
    </div>
  );
};

// IGDB external_games category enum
const getStoreIcon = (category: number) => {
  switch (category) {
    case 1: return <SiSteam className="w-5 h-5" />;
    case 5: return <SiGogdotcom className="w-5 h-5" />;
    case 11:
    case 31:
    case 54: return <FaXbox className="w-5 h-5" />;
    case 13: return <SiAppstore className="w-5 h-5" />;
    case 15: return <SiGoogleplay className="w-5 h-5" />;
    case 26: return <SiEpicgames className="w-5 h-5" />;
    case 30: return <SiItchdotio className="w-5 h-5" />;
    case 36: return <SiPlaystation className="w-5 h-5" />;
    default: return null;
  }
};

const getStoreName = (category: number): string => {
  switch (category) {
    case 1: return 'Steam';
    case 5: return 'GOG';
    case 11:
    case 31:
    case 54: return 'Xbox';
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
