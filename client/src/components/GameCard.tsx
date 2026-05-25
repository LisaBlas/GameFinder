import React, { useEffect, useRef, useState } from 'react';
// Global analytics variable (if present)
declare const gtag: any;
import { SiAppstore, SiEpicgames, SiGogdotcom, SiGoogleplay, SiItchdotio, SiPlaystation, SiSteam } from 'react-icons/si';
import { FaChevronDown, FaChevronRight, FaExternalLinkAlt, FaGlobe, FaHeart, FaPlay, FaTimes, FaXbox } from 'react-icons/fa';
import { Share2, Check, Gamepad2, KeyRound } from 'lucide-react';
import { useFilterSelection } from '../context/FilterContext';
import { useSavedGames } from '../context/SavedGamesContext';
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

interface SimilarGame {
  id: number;
  name: string;
  cover: { url: string } | null;
  rating: number | null;
}

interface SeedData {
  genres: Array<{ id: number; name: string }>;
  themes: Array<{ id: number; name: string }>;
  keywords: Array<{ id: number; name: string }>;
  similar_games: SimilarGame[];
}

interface GameCardProps {
  game: Game;
  isSelected: boolean;
  onSelect: () => void;
  fullscreen?: boolean;
  highlightFilters?: boolean;
  onOpenSimilar?: (id: number) => void;
}

const encodeGameTitle = (title: string): string => {
  return encodeURIComponent(title.trim().toLowerCase());
};

const getStablePartnerOffset = (gameId: number, gameTitle: string, partnerCount: number): number => {
  if (partnerCount <= 0) return 0;
  const source = `${gameId}-${gameTitle}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % partnerCount;
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
      url: `https://kinguin.net/catalogsearch/result/index/?q=${encodedTitle}&r=6821d3b3a5047`,
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


const GameCard: React.FC<GameCardProps> = ({ game, isSelected, onSelect, fullscreen = false, highlightFilters = false, onOpenSimilar }) => {
  const [videos, setVideos] = useState<Array<{ name?: string; video_id: string }>>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [hasLoadedVideos, setHasLoadedVideos] = useState(false);
  const [steamPrice, setSteamPrice] = useState<{ price: string | null; originalPrice: string | null; discount: number | null; isFree: boolean } | null>(null);
  const [hasLoadedSteamPrice, setHasLoadedSteamPrice] = useState(false);
  const [mediaHeight, setMediaHeight] = useState<number | null>(null);
  const [isMediaSyncedLayout, setIsMediaSyncedLayout] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [partnerStoresExpanded, setPartnerStoresExpanded] = useState(false);
  const [gameCopied, setGameCopied] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [seedData, setSeedData] = useState<SeedData | null>(null);
  const [isFindingSimilar, setIsFindingSimilar] = useState(false);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const tagsRef = useRef<HTMLDivElement | null>(null);
  const { addFilter, removeFilter, isFilterSelected, selectedFilters, seedAndSearch } = useFilterSelection();
  const { isSaved, toggleSaved } = useSavedGames();

  const imageUrl = game.cover?.url
    ? game.cover.url.replace('/t_thumb/', '/t_cover_big/')
    : 'https://via.placeholder.com/300x400?text=No+Image';

  const releaseYear = game.first_release_date
    ? new Date(game.first_release_date * 1000).getFullYear()
    : 'Unknown';

  const isNewRelease = !!game.first_release_date &&
    (Date.now() / 1000 - game.first_release_date) < 60 * 60 * 24 * 183;

  const rating = game.rating ? Math.round(game.rating) / 10 : null;

  const developerName = React.useMemo(() => {
    if (!game.involved_companies || game.involved_companies.length === 0) return undefined;
    const developer = game.involved_companies.find(ic => ic.developer);
    if (developer?.company?.name) return developer.company.name;
    return game.involved_companies[0]?.company?.name;
  }, [game.involved_companies]);

  const affiliateLinks = React.useMemo(() => getAffiliateLinks(game.name), [game.name]);

  useEffect(() => {
    const fetchSteamPrice = async () => {
      if (!isSelected || hasLoadedSteamPrice) return;
      const steamEntry = game.external_games?.find(eg => eg.external_game_source === 1);
      if (!steamEntry?.url) { setHasLoadedSteamPrice(true); return; }
      const match = steamEntry.url.match(/\/app\/(\d+)/);
      if (!match) { setHasLoadedSteamPrice(true); return; }
      try {
        const resp = await fetch(`/api/steam-price?appId=${match[1]}`);
        if (resp.ok) setSteamPrice(await resp.json());
      } catch {
        // silently fail — price is non-critical
      } finally {
        setHasLoadedSteamPrice(true);
      }
    };
    fetchSteamPrice();
  }, [game.external_games, game.id, hasLoadedSteamPrice, isSelected]);

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
    if (!isSelected) setVideoPlaying(false);
  }, [isSelected]);

  // Fetch similar-seed data when the card opens in fullscreen mode.
  // Resets on game change so stale data never shows for a different title.
  useEffect(() => {
    if (!isSelected || !fullscreen) return;
    setSeedData(null);
    fetch(`/api/games/${game.id}/similar-seed`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) setSeedData(data as SeedData); })
      .catch(() => {});
  }, [game.id, isSelected, fullscreen]);

  const handleFindSimilar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!seedData) return;
    setIsFindingSimilar(true);
    try {
      const filters: import('../context/FilterContext').Filter[] = [];
      if (seedData.genres[0]) {
        const g = seedData.genres[0];
        filters.push({ id: g.id, name: g.name, category: 'genres', mode: 'include', compositeId: `genres-${g.id}` });
      }
      if (seedData.themes[0]) {
        const t = seedData.themes[0];
        filters.push({ id: t.id, name: t.name, category: 'themes', mode: 'include', compositeId: `themes-${t.id}` });
      }
      seedData.keywords.slice(0, 2).forEach(kw => {
        filters.push({ id: kw.id, name: kw.name, category: 'Keywords', mode: 'include', compositeId: `Keywords-${kw.id}` });
      });
      seedAndSearch({ id: game.id, name: game.name }, filters);
      onSelect(); // close the modal
    } finally {
      setIsFindingSimilar(false);
    }
  };

  useEffect(() => {
    if (!highlightFilters || !isSelected) return;
    let glowTimer: ReturnType<typeof setTimeout>;
    const initTimer = setTimeout(() => {
      if (!tagsRef.current) return;
      if (window.innerWidth < 768) {
        tagsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      tagsRef.current.classList.add('tags-gold-glow');
      glowTimer = setTimeout(() => {
        tagsRef.current?.classList.remove('tags-gold-glow');
      }, 3000);
    }, 350);
    return () => {
      clearTimeout(initTimer);
      clearTimeout(glowTimer);
    };
  }, [highlightFilters, isSelected]);

  useEffect(() => {
    const updateMediaSyncedLayout = () => {
      setIsMediaSyncedLayout(window.matchMedia('(min-width: 1280px)').matches);
    };

    updateMediaSyncedLayout();
    window.addEventListener('resize', updateMediaSyncedLayout);

    return () => {
      window.removeEventListener('resize', updateMediaSyncedLayout);
    };
  }, []);

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
    if (category === 'Keywords') {
      const existingFilter = selectedFilters.find(f => f.id === tag.id && f.category === category);
      if (existingFilter) {
        removeFilter(tag.id, category, undefined);
      } else {
        addFilter({
          id: tag.id,
          name: tag.name,
          category,
          mode: "include",
          compositeId: `${category}-${tag.id}-${tag.name}`.toLowerCase().replace(/\s+/g, '-')
        });
      }
    } else if (isFilterSelected(tag.id, category)) {
      removeFilter(tag.id, category, undefined);
    } else {
      addFilter({
        id: tag.id,
        name: tag.name,
        category,
        compositeId: `${category}-${tag.id}-${tag.name}`.toLowerCase().replace(/\s+/g, '-')
      });
    }
  };

  const gameDeepLink = `${window.location.origin}${window.location.pathname}?game=${game.id}`;

  const handleGameShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Check out ${game.name} on GameFinder → ${gameDeepLink}`;
    if (navigator.share) {
      await navigator.share({ title: game.name, text, url: gameDeepLink });
    } else {
      await navigator.clipboard.writeText(gameDeepLink);
      setGameCopied(true);
      setTimeout(() => setGameCopied(false), 2000);
    }
  };

  const handleLinkClick = (e: React.MouseEvent, url: string, storeName: string, storeType: 'official' | 'affiliate' = 'official') => {
    e.preventDefault();
    e.stopPropagation();
    trackExternalClick(storeName, storeType, game.name);
    window.open(url, '_blank');
  };

  const selectedTagKeys = React.useMemo(
    () => new Set(selectedFilters.map(f => `${f.category}-${f.id}`)),
    [selectedFilters],
  );

  const keywordCount = game.keywords?.length ?? 0;
  const platformCount = game.platforms?.length ?? 0;

  const tagGroups = React.useMemo(() => [
    {
      label: 'Platforms',
      tags: (game.platforms || []).map(t => ({ ...t, type: 'platform', category: 'platforms' })),
    },
    {
      label: 'Genres',
      tags: (game.genres || []).map(t => ({ ...t, type: 'genre', category: 'genres' })),
    },
    {
      label: 'Themes',
      tags: (game.themes || []).map(t => ({ ...t, type: 'theme', category: 'themes' })),
    },
    {
      label: 'Modes',
      tags: (game.game_modes || []).map(t => ({ ...t, type: 'game_mode', category: 'Game Mode' })),
    },
    {
      label: 'Keywords',
      tags: (game.keywords || [])
        .map(t => ({ ...t, type: 'keyword', category: 'Keywords' }))
        .sort((a, b) => {
          const aSelected = selectedTagKeys.has(`Keywords-${a.id}`) ? 1 : 0;
          const bSelected = selectedTagKeys.has(`Keywords-${b.id}`) ? 1 : 0;
          return bSelected - aSelected;
        }),
      emptyText: 'This game might be too recent, too obscure, or missing detailed keyword data.'
    },
  ].filter(group => group.tags.length > 0 || group.label === 'Keywords'),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [game.platforms, game.genres, game.themes, game.game_modes, game.keywords, selectedTagKeys]);

  const filteredStores = React.useMemo(() =>
    (game.external_games || []).filter((store, index, self) => {
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
    }),
  [game.external_games]);

  const officialWebsites = React.useMemo(
    () => (game.websites || []).filter(w => w.category === 1 && !w.url.includes('youtube.com')),
    [game.websites],
  );

  const renderableOfficialStores = React.useMemo(() =>
    filteredStores
      .map((store) => ({
        ...store,
        icon: getStoreIcon(store.external_game_source),
        storeName: getStoreName(store.external_game_source),
      }))
      .filter((store): store is typeof store & { icon: React.ReactElement } => store.icon !== null)
      .sort((a, b) => Number(b.external_game_source === 1) - Number(a.external_game_source === 1)),
  [filteredStores]);
  const synopsis = game.summary || 'No synopsis available yet.';
  const hasOfficialLinks = renderableOfficialStores.length + officialWebsites.length > 0;
  const storeButtonClass = "game-card-store-button flex w-full min-h-11 min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors";
  const storeIconClass = "game-card-store-icon flex h-5 w-5 flex-shrink-0 items-center justify-center";
  const officialStoreLinks = (
    <>
      {renderableOfficialStores.map((store) => {
        const isSteam = store.external_game_source === 1;
        const priceLabel = isSteam && steamPrice
          ? steamPrice.isFree
            ? 'Free to Play'
            : steamPrice.price
          : null;
        const originalLabel = isSteam && steamPrice?.originalPrice ? steamPrice.originalPrice : null;
        const discountPct = isSteam && steamPrice?.discount ? steamPrice.discount : null;
        const fallbackLabel = priceLabel ? null : 'Check retail price';

        return (
          <a
            key={store.id}
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation(); trackExternalClick(store.storeName, 'official', game.name); }}
            className={storeButtonClass}
            title={store.storeName}
          >
            <span className={storeIconClass}>
              {React.cloneElement(store.icon, { className: 'w-5 h-5' })}
            </span>
            <span className="flex flex-1 min-w-0 flex-col gap-0">
              <span className="truncate leading-tight">{store.storeName}</span>
              {priceLabel && (
                <span className="flex items-center gap-1.5">
                  {originalLabel && <span className="text-[10px] font-normal text-slate-500 line-through">{originalLabel}</span>}
                  {discountPct && <span className="text-[10px] font-bold text-[var(--c-emerald)] bg-[rgba(var(--c-emerald-rgb),0.12)] px-1 rounded">-{discountPct}%</span>}
                  <span className={`text-[10px] font-semibold ${discountPct ? 'text-[var(--c-emerald)]' : 'text-slate-400'}`}>{priceLabel}</span>
                </span>
              )}
              {fallbackLabel && (
                <span className="truncate text-[10px] font-medium leading-tight text-slate-500">{fallbackLabel}</span>
              )}
            </span>
            <FaChevronRight className="h-3 w-3 flex-shrink-0 text-slate-600" />
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
          className={storeButtonClass}
          title="Official Website"
        >
          <span className={storeIconClass}>
            <FaGlobe className="w-4 h-4" />
          </span>
          <span className="flex flex-1 min-w-0 flex-col gap-0">
            <span className="truncate leading-tight">Official site</span>
          </span>
          <FaChevronRight className="h-3 w-3 flex-shrink-0 text-slate-600" />
        </a>
      ))}
    </>
  );

  const partnerStores = [
    {
      key: 'gamersgate',
      name: affiliateLinks.gamersgate.name,
      descriptor: 'Check DRM and current deal',
      icon: <GamersGateIcon />,
      onClick: (e: React.MouseEvent) => handleLinkClick(e, affiliateLinks.gamersgate.url, 'GamersGate', 'affiliate')
    },
    {
      key: 'instantGaming',
      name: affiliateLinks.instantGaming.name,
      descriptor: 'Check region and current deal',
      icon: <InstantGamingIcon />,
      onClick: (e: React.MouseEvent) => handleLinkClick(e, affiliateLinks.instantGaming.url, 'Instant Gaming', 'affiliate')
    },
    {
      key: 'eneba',
      name: affiliateLinks.eneba.name,
      descriptor: 'Compare sellers and region lock',
      icon: <EnebaIcon />,
      onClick: (e: React.MouseEvent) => handleLinkClick(e, affiliateLinks.eneba.url, 'Eneba', 'affiliate')
    },
    {
      key: 'kinguin',
      name: affiliateLinks.kinguin.name,
      descriptor: 'Compare keys and seller ratings',
      icon: <KinguinIcon />,
      onClick: (e: React.MouseEvent) => handleLinkClick(e, affiliateLinks.kinguin.url, 'Kinguin', 'affiliate')
    },
    {
      key: 'g2a',
      name: affiliateLinks.g2a.name,
      descriptor: 'Compare sellers and activation region',
      icon: <G2AIcon />,
      onClick: (e: React.MouseEvent) => handleLinkClick(e, affiliateLinks.g2a.url, 'G2A', 'affiliate')
    }
  ];
  const partnerStoreOffset = getStablePartnerOffset(game.id, game.name, partnerStores.length);
  const rotatedPartnerStores = [
    ...partnerStores.slice(partnerStoreOffset),
    ...partnerStores.slice(0, partnerStoreOffset)
  ];
  const primaryPartnerStore = rotatedPartnerStores[0];
  const alternatePartnerStores = rotatedPartnerStores.slice(1);

  const partnerStoreLinks = (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={primaryPartnerStore.onClick}
        className={storeButtonClass}
        title={primaryPartnerStore.name}
      >
        <span className={storeIconClass}>{primaryPartnerStore.icon}</span>
        <span className="flex flex-1 min-w-0 flex-col gap-0">
          <span className="truncate leading-tight">{primaryPartnerStore.name}</span>
          <span className="truncate text-[10px] font-medium leading-tight text-slate-500">{primaryPartnerStore.descriptor}</span>
        </span>
        <FaChevronRight className="h-3 w-3 flex-shrink-0 text-slate-600" />
      </button>
      {partnerStoresExpanded && alternatePartnerStores.map((store) => (
        <button
          key={store.key}
          type="button"
          onClick={store.onClick}
          className={storeButtonClass}
          title={store.name}
        >
          <span className={storeIconClass}>{store.icon}</span>
          <span className="flex flex-1 min-w-0 flex-col gap-0">
            <span className="truncate leading-tight">{store.name}</span>
            <span className="truncate text-[10px] font-medium leading-tight text-slate-500">{store.descriptor}</span>
          </span>
          <FaChevronRight className="h-3 w-3 flex-shrink-0 text-slate-600" />
        </button>
      ))}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setPartnerStoresExpanded((v) => !v); }}
        className="flex w-full items-center gap-1.5 pt-0.5 pb-1 text-xs text-slate-600 hover:text-slate-400 transition-colors"
        aria-expanded={partnerStoresExpanded}
      >
        <FaChevronDown className={`h-2.5 w-2.5 flex-shrink-0 transition-transform ${partnerStoresExpanded ? 'rotate-180' : ''}`} />
        <span>{partnerStoresExpanded ? 'Hide other stores' : `${alternatePartnerStores.length} more stores`}</span>
      </button>
    </div>
  );

  const renderTagButton = (tag: { id: number; name: string; type: string; category: string }) => {
    const isKeyword = tag.type === 'keyword';
    const isPlatform = tag.type === 'platform';
    const isEmerald = tag.type === 'genre' || tag.type === 'theme';
    const displayName = isKeyword
      ? tag.name.charAt(0).toUpperCase() + tag.name.slice(1)
      : tag.name;
    const isSelectedTag = isFilterSelected(tag.id, tag.category);
    const existingFilter = selectedFilters.find(f => f.id === tag.id && f.category === tag.category);
    const isExcluded = existingFilter?.mode === 'exclude';

    let tagClass: string;
    if (isExcluded) {
      tagClass = 'game-card-tag-excluded';
    } else if (isSelectedTag && isKeyword) {
      tagClass = 'game-card-tag-keyword-selected';
    } else if (isSelectedTag) {
      tagClass = 'game-card-tag-selected';
    } else if (isPlatform) {
      tagClass = 'game-card-tag-platform';
    } else if (isEmerald) {
      tagClass = 'game-card-tag-emerald';
    } else {
      tagClass = 'game-card-tag-muted';
    }

    return (
      <button
        key={`${tag.type}-${tag.id}-${tag.name}`}
        onClick={(e) => handleTagClick(tag, tag.category, e)}
        className={`game-card-tag inline-flex px-2 py-1 text-xs rounded-md transition-all cursor-pointer ${tagClass}`}
        title={isExcluded ? `Click to remove "${displayName}" exclusion` : isSelectedTag ? `Click to remove "${displayName}" filter` : `Click to add "${displayName}" to filters`}
      >
        {displayName}
      </button>
    );
  };

  return (
    <div className={`game-card-shell relative group ${!fullscreen && !isSelected ? 'h-full' : ''} ${fullscreen ? 'game-card-shell-fullscreen pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0' : ''} ${isSelected ? 'game-card-shell-selected widescreen:col-span-2' : ''}`}>
      {fullscreen && (
        <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-slate-700/40 bg-[#111312]/95 px-3 py-2 backdrop-blur-sm md:hidden">
          <h2 className="min-w-0 flex-1 truncate pr-1 text-sm font-semibold text-white">{game.name}</h2>
          <div className="flex flex-shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={handleGameShare}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
              aria-label="Share game"
            >
              {gameCopied ? <Check className="h-4 w-4 text-[var(--c-emerald)]" /> : <Share2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleSaved({ id: game.id, name: game.name, cover: game.cover, rating: game.rating, first_release_date: game.first_release_date }); }}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-slate-700/60 ${isSaved(game.id) ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'}`}
              aria-label={isSaved(game.id) ? 'Remove from saved' : 'Save game'}
            >
              <FaHeart className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/50 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
              aria-label="Close game details"
            >
              <FaTimes className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      {fullscreen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="absolute right-3 top-3 z-20 hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-950/85 text-slate-300 shadow-lg backdrop-blur transition-colors hover:bg-slate-800 hover:text-white md:flex"
          aria-label="Close game details"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      )}

      <article
        className={`game-card ${!fullscreen && !isSelected ? 'h-full' : ''} ${isSelected ? 'game-card-selected' : 'game-card-compact'} ${fullscreen ? 'game-card-fullscreen bg-[#111312]' : 'bg-slate-900/95'} transition-[background-color,box-shadow] duration-300 cursor-pointer ${
          fullscreen && isSelected
            ? 'rounded-none shadow-none md:rounded-lg md:shadow-[0_0_0_1px_rgba(112,124,116,0.18),0_22px_70px_rgba(0,0,0,0.36)]'
            : isSelected
              ? 'shadow-[0_0_0_1px_rgba(112,124,116,0.18),0_22px_70px_rgba(0,0,0,0.36)]'
              : 'shadow-[0_1px_0_rgba(255,255,255,0.035),0_14px_42px_rgba(0,0,0,0.18)] hover:bg-slate-900 hover:shadow-[0_0_0_1px_rgba(112,124,116,0.14),0_18px_55px_rgba(0,0,0,0.32)]'
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
        <div className={`flex flex-col md:flex-row ${!fullscreen && !isSelected ? 'h-full' : ''}`}>
          <div className={`game-card-cover relative w-full h-56 md:w-40 lg:w-44 md:h-auto md:min-h-[230px] self-stretch flex-shrink-0 overflow-hidden bg-slate-950 ${isSelected ? 'hidden' : ''}`}>
            <img
              src={imageUrl}
              alt={`${game.name} cover`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
              loading="lazy"
              decoding="async"
            />
            {!isSelected && (
              <div className="absolute right-3 top-3 z-10 flex items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={handleGameShare}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/75 text-white shadow-[0_10px_26px_rgba(0,0,0,0.45)] ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-slate-900/85"
                  aria-label="Share game"
                >
                  {gameCopied
                    ? <Check className="h-4 w-4 text-emerald-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]" />
                    : <Share2 className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleSaved({ id: game.id, name: game.name, cover: game.cover, rating: game.rating, first_release_date: game.first_release_date }); }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/75 shadow-[0_10px_26px_rgba(0,0,0,0.45)] ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-slate-900/85 ${isSaved(game.id) ? 'text-rose-300' : 'text-white hover:text-rose-300'}`}
                  aria-label={isSaved(game.id) ? 'Remove from saved' : 'Save game'}
                >
                  <FaHeart className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]" />
                </button>
              </div>
            )}
            {!isSelected && (
              <div className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Open details</span>
                  <FaChevronDown className="h-3 w-3 -rotate-90" />
                </div>
              </div>
            )}
          </div>

          <div className={`flex-1 min-w-0 ${fullscreen && isSelected ? 'px-4 pt-3 pb-4 md:p-5' : 'p-4 md:p-5'}`}>
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className={`flex gap-2 ${isSelected ? 'items-center flex-wrap' : 'items-start flex-nowrap'} ${fullscreen && isSelected ? 'hidden md:flex' : ''}`}>
                    <h3 className={`min-w-0 flex-1 text-xl font-bold text-white leading-tight ${!isSelected ? 'line-clamp-2' : ''}`}>{game.name}</h3>
                    {rating && (
                      <span className="game-card-rating flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-md">
                        {rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`flex items-center gap-1 flex-shrink-0 ${fullscreen ? 'hidden md:flex' : ''}`}>
                  {!isSelected && (
                    <FaChevronRight className="mt-1 h-5 w-5 text-amber-300/70 md:hidden" />
                  )}
                  <button
                    type="button"
                    onClick={handleGameShare}
                    className={`h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800/70 hover:text-slate-300 ${!isSelected ? 'hidden md:flex' : 'flex'}`}
                    aria-label="Share game"
                  >
                    {gameCopied
                      ? <Check className="h-4 w-4 text-[var(--c-emerald)]" />
                      : <Share2 className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSaved({ id: game.id, name: game.name, cover: game.cover, rating: game.rating, first_release_date: game.first_release_date }); }}
                    className={`h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-800/70 ${!isSelected ? 'hidden md:flex' : 'flex'} ${isSaved(game.id) ? 'text-rose-400' : 'text-slate-500 hover:text-rose-400'}`}
                    aria-label={isSaved(game.id) ? 'Remove from saved' : 'Save game'}
                  >
                    <FaHeart className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {!isSelected && (
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className="game-card-compact-stat"
                    title={`${keywordCount} ${keywordCount === 1 ? 'keyword' : 'keywords'}`}
                    aria-label={`${keywordCount} ${keywordCount === 1 ? 'keyword' : 'keywords'}`}
                  >
                    <KeyRound className="h-3 w-3" aria-hidden="true" />
                    {keywordCount}
                  </span>
                  {platformCount > 0 && (
                    <span
                      className="game-card-compact-stat"
                      title={`${platformCount} ${platformCount === 1 ? 'platform' : 'platforms'}`}
                      aria-label={`${platformCount} ${platformCount === 1 ? 'platform' : 'platforms'}`}
                    >
                      <Gamepad2 className="h-3 w-3" aria-hidden="true" />
                      {platformCount}
                    </span>
                  )}
                </div>
              )}

              <div className={isSelected ? 'game-card-summary-panel rounded-lg px-4 py-3' : ''}>
                <div className="text-xs text-slate-400">
                  {developerName && <span className="text-slate-300">{developerName}</span>}
                  {developerName && releaseYear && <span className="px-1.5 text-slate-600">/</span>}
                  <span>{releaseYear}</span>
                </div>

                <div className={isSelected ? 'mt-2' : 'mt-1'}>
                  <p className={`text-sm leading-relaxed text-slate-300 ${isSelected && !synopsisExpanded ? 'line-clamp-3' : !isSelected ? 'line-clamp-2' : ''}`}>
                    {synopsis}
                  </p>
                  {!isSelected && (steamPrice?.isFree || (steamPrice?.discount ?? 0) > 0 || isNewRelease) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {steamPrice?.isFree && (
                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-amber-400/40 bg-amber-400/10">
                          Free
                        </span>
                      )}
                      {!steamPrice?.isFree && (steamPrice?.discount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-amber-400/40 bg-amber-400/10">
                          -{steamPrice!.discount}% on Steam
                        </span>
                      )}
                      {isNewRelease && (
                        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-amber-400/40 bg-amber-400/10">
                          New
                        </span>
                      )}
                    </div>
                  )}
                  {isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSynopsisExpanded(v => !v); }}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/5 transition-colors"
                    >
                      {synopsisExpanded ? 'Read less' : 'Read more'}
                      <FaChevronDown className={`h-2.5 w-2.5 transition-transform ${synopsisExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="grid gap-4 pt-1">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
                    <div ref={mediaRef} className="aspect-video overflow-hidden rounded-lg bg-black">
                      {isVideoLoading && (
                        <div className="w-full h-full bg-slate-800 animate-pulse" />
                      )}
                      {!isVideoLoading && videos.length > 0 && (
                        videoPlaying ? (
                          <iframe
                            title={videos[0]?.name || `${game.name} video`}
                            src={`https://www.youtube.com/embed/${videos[0].video_id}?rel=0&autoplay=1`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <button
                            type="button"
                            className="relative w-full h-full group overflow-hidden"
                            onClick={(e) => { e.stopPropagation(); setVideoPlaying(true); }}
                            aria-label={`Play ${game.name} trailer`}
                          >
                            <img
                              src={`https://i.ytimg.com/vi/${videos[0].video_id}/maxresdefault.jpg`}
                              onError={(e) => { (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${videos[0].video_id}/hqdefault.jpg`; }}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-200" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-2xl transition-transform duration-200 group-hover:scale-110">
                                <FaPlay className="ml-1 h-4 w-4 text-slate-900" />
                              </div>
                            </div>
                          </button>
                        )
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
                      className="game-card-panel game-card-panel-stores flex min-h-0 flex-col rounded-lg border px-4 pb-4 pt-2.5"
                      style={mediaHeight && isMediaSyncedLayout ? { height: `${mediaHeight}px` } : undefined}
                    >
                      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                        <div className="grid gap-4">
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Stores</span>
                            <div className="mt-2">
                              {hasOfficialLinks ? (
                                <div className="flex flex-col gap-1.5">
                                  {officialStoreLinks}
                                </div>
                              ) : (
                                <span className="game-card-empty-state px-1 text-xs leading-relaxed">
                                  No official links found. This game may be too old, delisted, or missing current store links.
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Marketplaces</span>
                            <div className="mt-2">
                              {partnerStoreLinks}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div ref={tagsRef} className="game-card-panel game-card-panel-keywords rounded-lg border px-4 pb-4 pt-2.5">
                    <div>
                      {tagGroups.length > 0 ? (
                        <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
                          {tagGroups.map(group => (
                            <div key={group.label} className="min-w-0">
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{group.label}</span>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {group.tags.length > 0
                                  ? group.tags.map(renderTagButton)
                                  : <span className="game-card-keyword-empty">{group.emptyText}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">No tags found</span>
                      )}
                    </div>
                  </div>

                  {/* ── Similar games panel — modal only ── */}
                  {fullscreen && <div className="game-card-panel rounded-lg border px-4 pb-4 pt-3">
                    {/* "Find games like this" CTA */}
                    <button
                      type="button"
                      onClick={handleFindSimilar}
                      disabled={!seedData || isFindingSimilar}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[rgba(var(--c-emerald-rgb),0.25)] bg-[rgba(var(--c-emerald-rgb),0.08)] px-4 py-3 text-sm font-semibold text-[var(--c-emerald)] transition-all hover:bg-[rgba(var(--c-emerald-rgb),0.15)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Gamepad2 className="h-4 w-4 flex-shrink-0" />
                      {isFindingSimilar ? 'Finding…' : `Find games like ${game.name}`}
                    </button>

                    {/* "More like this" carousel — IGDB curated similar_games */}
                    {seedData && seedData.similar_games.length > 0 && (
                      <div className="mt-4">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">More like this</span>
                        <div className="mt-2 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {seedData.similar_games.map(sg => (
                            <button
                              key={sg.id}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onOpenSimilar?.(sg.id); }}
                              className="group/sim w-[72px] flex-shrink-0 text-left"
                            >
                              <div className="h-[96px] w-[72px] overflow-hidden rounded-md bg-slate-800 ring-1 ring-white/5 transition-all group-hover/sim:ring-[rgba(var(--c-emerald-rgb),0.4)]">
                                {sg.cover ? (
                                  <img
                                    src={sg.cover.url}
                                    alt={sg.name}
                                    className="h-full w-full object-cover transition-transform duration-200 group-hover/sim:scale-105"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-600">
                                    <Gamepad2 className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-500 transition-colors group-hover/sim:text-slate-300">
                                {sg.name}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skeleton state while seed data loads */}
                    {!seedData && (
                      <div className="mt-4">
                        <div className="h-2.5 w-24 animate-pulse rounded bg-slate-800" />
                        <div className="mt-2 flex gap-2.5">
                          {[0, 1, 2, 3].map(i => (
                            <div key={i} className="h-[96px] w-[72px] flex-shrink-0 animate-pulse rounded-md bg-slate-800" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>}
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

// onSelect and onOpenSimilar are intentionally excluded from the comparator.
// They are inline arrow functions recreated on every parent render, but their
// logic is always equivalent (toggle/open by game.id). Skipping them prevents
// cascading re-renders from SearchResults state changes (e.g. hideMobileControls
// toggling on scroll direction change) from reaching all 50+ mounted cards.
const areEqual = (prev: GameCardProps, next: GameCardProps): boolean =>
  prev.game === next.game &&
  prev.isSelected === next.isSelected &&
  prev.fullscreen === next.fullscreen &&
  (prev.highlightFilters ?? false) === (next.highlightFilters ?? false);

export default React.memo(GameCard, areEqual);
