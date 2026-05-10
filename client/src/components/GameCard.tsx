import React, { useEffect, useRef, useState } from 'react';
// Global analytics variable (if present)
declare const gtag: any;
import { SiAppstore, SiEpicgames, SiGogdotcom, SiGoogleplay, SiItchdotio, SiPlaystation, SiSteam } from 'react-icons/si';
import { FaChevronDown, FaExternalLinkAlt, FaGamepad, FaGlobe, FaPlay, FaXbox } from 'react-icons/fa';
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
  isSelected: boolean;
  onSelect: () => void;
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

const GameCard: React.FC<GameCardProps> = ({ game, isSelected, onSelect }) => {
  const [videos, setVideos] = useState<Array<{ name?: string; video_id: string }>>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [hasLoadedVideos, setHasLoadedVideos] = useState(false);
  const [mediaHeight, setMediaHeight] = useState<number | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const { handleKinguinClick } = useKinguinRedirect(game.name);
  const { addFilter, isFilterSelected, selectedFilters } = useFilters();

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
      if (!isSelected || hasLoadedVideos) return;
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
  }, [game.id, hasLoadedVideos, isSelected]);

  useEffect(() => {
    if (!isSelected || !mediaRef.current) {
      setMediaHeight(null);
      return;
    }

    const mediaEl = mediaRef.current;
    const updateMediaHeight = () => {
      setMediaHeight(mediaEl.getBoundingClientRect().height);
    };

    updateMediaHeight();

    const resizeObserver = new ResizeObserver(updateMediaHeight);
    resizeObserver.observe(mediaEl);
    window.addEventListener('resize', updateMediaHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateMediaHeight);
    };
  }, [isSelected]);

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

  const selectedTagKeys = new Set(selectedFilters.map(f => `${f.category}-${f.id}`));

  const selectedKeywords = (game.keywords || [])
    .filter(t => selectedTagKeys.has(`Keywords-${t.id}`))
    .map(t => ({ ...t, type: 'keyword', category: 'Keywords' }));

  const previewTags = [
    ...selectedKeywords,
    ...[
      ...(game.genres || []).map(t => ({ ...t, type: 'genre', category: 'genres' })),
      ...(game.themes || []).map(t => ({ ...t, type: 'theme', category: 'themes' })),
    ].sort((a, b) => {
      const aSelected = selectedTagKeys.has(`${a.category}-${a.id}`) ? 1 : 0;
      const bSelected = selectedTagKeys.has(`${b.category}-${b.id}`) ? 1 : 0;
      return bSelected - aSelected;
    }),
  ].slice(0, 5);

  const expandedTags = (game.keywords || []).map(t => ({ ...t, type: 'keyword', category: 'Keywords' })).sort((a, b) => {
    const aSelected = selectedTagKeys.has(`Keywords-${a.id}`) ? 1 : 0;
    const bSelected = selectedTagKeys.has(`Keywords-${b.id}`) ? 1 : 0;
    return bSelected - aSelected;
  });

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
  const synopsis = game.summary || 'No synopsis available yet.';
  const hasOfficialLinks = filteredStores.length + officialWebsites.length > 0;
  const storeIconClass = "w-9 h-9 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors";

  const officialStoreLinks = (
    <>
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
            className={storeIconClass}
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
          className={`${storeIconClass} hover:bg-blue-700/60`}
          title="Official Website"
        >
          <FaGlobe className="w-4 h-4" />
        </a>
      ))}
    </>
  );

  const resellerLinks = (
    <>
      <button onClick={handleKinguinClick} className={storeIconClass} title="Kinguin">
        <KinguinIcon />
      </button>
      <button onClick={(e) => handleLinkClick(e, affiliateLinks.gamersgate.url, 'GamersGate', 'affiliate')} className={storeIconClass} title="GamersGate">
        <GamersGateIcon />
      </button>
      <button onClick={(e) => handleLinkClick(e, affiliateLinks.eneba.url, 'Eneba', 'affiliate')} className={storeIconClass} title="Eneba">
        <EnebaIcon />
      </button>
      <button onClick={(e) => handleLinkClick(e, affiliateLinks.g2a.url, 'G2A', 'affiliate')} className={storeIconClass} title="G2A">
        <G2AIcon />
      </button>
      <button onClick={(e) => handleLinkClick(e, affiliateLinks.instantGaming.url, 'Instant Gaming', 'affiliate')} className={storeIconClass} title="Instant Gaming">
        <InstantGamingIcon />
      </button>
    </>
  );

  const renderTagButton = (tag: { id: number; name: string; type: string; category: string }) => {
    const isKeyword = tag.type === 'keyword';
    const isPurple = tag.type === 'genre' || tag.type === 'theme';
    const displayName = isKeyword
      ? tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
      : tag.name;
    const isSelectedTag = isFilterSelected(tag.id, tag.category);

    return (
      <button
        key={`${tag.type}-${tag.id}-${tag.name}`}
        onClick={(e) => handleTagClick(tag, tag.category, e)}
        className={`inline-flex px-2 py-1 text-xs rounded-md transition-all cursor-pointer ${
          isPurple
            ? isSelectedTag
              ? 'bg-purple-500/30 text-purple-100 ring-2 ring-purple-400/50'
              : 'bg-purple-900/20 text-purple-200 hover:bg-purple-800/30'
            : isSelectedTag
              ? 'bg-amber-500/30 text-amber-100 ring-2 ring-amber-400/50'
              : 'bg-amber-900/20 text-amber-200 hover:bg-amber-800/30'
        }`}
        title={`Click to add "${displayName}" to filters`}
      >
        {displayName}
      </button>
    );
  };

  return (
    <div className="relative group">
      <div
        className={`absolute inset-0 -z-10 scale-[1.08] transition-opacity duration-700 blur-2xl ${isSelected ? 'opacity-45' : 'opacity-20 group-hover:opacity-35'}`}
        aria-hidden="true"
      >
        <img src={imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>

      <article
        className={`game-card bg-slate-900/95 border transition-all duration-300 cursor-pointer ring-1 ring-inset ${
          isSelected
            ? 'border-amber-400/45 ring-amber-300/20 shadow-[0_0_0_1px_rgba(251,191,36,0.16),0_22px_70px_rgba(0,0,0,0.36)]'
            : 'border-slate-600/35 ring-white/[0.045] shadow-[0_1px_0_rgba(255,255,255,0.035),0_14px_42px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 hover:border-amber-300/35 hover:bg-slate-900 hover:ring-amber-200/12 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.10),0_18px_55px_rgba(0,0,0,0.32)]'
        }`}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        aria-expanded={isSelected}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full h-56 md:w-40 lg:w-44 md:h-auto md:min-h-[230px] self-stretch flex-shrink-0 overflow-hidden bg-slate-950">
            <img
              src={imageUrl}
              alt={`${game.name} cover`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
              loading="lazy"
              decoding="async"
            />
            {!isSelected && (
              <div className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Open details</span>
                  <FaChevronDown className="h-3 w-3 -rotate-90" />
                </div>
              </div>
            )}
            {rating && (
              <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-md">
                {rating.toFixed(1)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 p-4 md:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-white leading-tight">{game.name}</h3>
                  <div className="text-xs text-slate-400 mt-1">
                    {developerName && <span className="text-slate-300">{developerName}</span>}
                    {developerName && releaseYear && <span className="px-1.5 text-slate-600">/</span>}
                    <span>{releaseYear}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {rating && (
                    <div className="hidden sm:flex h-9 items-center rounded-lg bg-slate-800/80 px-3 text-sm font-semibold text-amber-200">
                      {rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>

              <p className={`text-sm leading-relaxed text-slate-300 ${isSelected ? '' : 'line-clamp-2'}`}>
                {synopsis}
              </p>

              {previewTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {previewTags.map(renderTagButton)}
                </div>
              )}

              {!isSelected && (
                <div className="flex items-center justify-between rounded-lg border border-slate-700/40 bg-slate-950/45 px-3 py-2 text-xs font-semibold text-slate-300 md:hidden">
                  <span>Tap card for trailer, stores, and details</span>
                  <FaChevronDown className="h-3 w-3 -rotate-90 text-amber-300" />
                </div>
              )}

              {isSelected && (
                <div className="grid gap-4 pt-1">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
                    <div ref={mediaRef} className="aspect-video overflow-hidden rounded-lg bg-black">
                      {isVideoLoading && (
                        <div className="w-full h-full bg-slate-800 animate-pulse" />
                      )}
                      {!isVideoLoading && videos.length > 0 && (
                        <iframe
                          title={videos[0]?.name || `${game.name} video`}
                          src={`https://www.youtube.com/embed/${videos[0].video_id}?rel=0`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      )}
                      {!isVideoLoading && hasLoadedVideos && videos.length === 0 && (
                        <div className="relative flex h-full items-center justify-center overflow-hidden">
                          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-md" loading="lazy" />
                          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950/80 text-slate-200">
                              <FaPlay className="ml-0.5 h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">No trailer found</p>
                              <p className="mt-1 text-xs text-slate-400">Use gameplay search or store links to inspect it.</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleLinkClick(e, `https://www.youtube.com/results?search_query=${encodeURIComponent(`${game.name} gameplay`)}`, 'YouTube Gameplay Search', 'official')}
                              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
                            >
                              Search gameplay
                              <FaExternalLinkAlt className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className="flex min-h-0 flex-col rounded-lg border border-slate-700/40 bg-slate-950/45 p-4"
                      style={mediaHeight ? { height: `${mediaHeight}px` } : undefined}
                    >
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Keywords and tags</h4>
                      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                        {expandedTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {expandedTags.map(renderTagButton)}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">No tags found</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-700/40 bg-slate-950/45 p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Quick actions</h4>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Official</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {hasOfficialLinks ? officialStoreLinks : (
                            <span className="text-xs text-slate-500">No official links found</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Resellers</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {resellerLinks}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
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
