export interface SeoFilter {
  category: "Keywords" | "genres" | "platforms" | "themes" | "Game Mode" | "Perspective";
  id: number;
  name: string;
  mode?: "include" | "exclude";
}

export interface SeoPage {
  slug: string;
  title: string;
  description: string;
  intro: string;
  filters: SeoFilter[];
  relatedSlugs: string[];
  searchLabel?: string;
}

const toSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export function buildAppUrl(filters: SeoFilter[], sort = "relevance"): string {
  const params = new URLSearchParams();

  const kwInclude = filters
    .filter((f) => f.category === "Keywords" && f.mode !== "exclude")
    .map((f) => toSlug(f.name));
  const kwExclude = filters
    .filter((f) => f.category === "Keywords" && f.mode === "exclude")
    .map((f) => toSlug(f.name));

  if (kwInclude.length) params.set("kw", kwInclude.join(","));
  if (kwExclude.length) params.set("kw-ex", kwExclude.join(","));

  const categoryParams: Record<string, string> = {
    genres: "genre",
    platforms: "platform",
    themes: "theme",
    "Game Mode": "mode",
    Perspective: "perspective",
  };

  for (const [cat, key] of Object.entries(categoryParams)) {
    const f = filters.find((f) => f.category === cat);
    if (f) params.set(key, String(f.id));
  }

  if (sort && sort !== "relevance") params.set("sort", sort);

  return `/?${params.toString()}`;
}

export const SEO_PAGES: SeoPage[] = [
  {
    slug: "cozy-farming-games",
    title: "Best Cozy Farming Games - Find Your Next Feel-Good Farm",
    description:
      "Discover the best cozy farming games. Filter by mood, mechanics, and platform to find relaxing farm sims, hidden indie gems, and games like Stardew Valley.",
    intro:
      "Looking for a peaceful place to tend crops, raise animals, and build something of your own? Cozy farming games let you unwind at your own pace - no death timers, no pressure, just seasons and soil.",
    filters: [
      { category: "Keywords", id: 24685, name: "cozy" },
      { category: "Keywords", id: 18437, name: "Farming" },
      { category: "Keywords", id: 2084, name: "Relaxing" },
      { category: "genres", id: 13, name: "Simulator" },
    ],
    relatedSlugs: ["cozy-games", "relaxing-simulation-games", "cute-wholesome-games"],
    searchLabel: "Find cozy farming games",
  },
  {
    slug: "cozy-games",
    title: "Best Cozy Games - Wholesome, Relaxing Games to Unwind With",
    description:
      "Find the best cozy games: wholesome, relaxing, and atmospheric titles across every genre. Use GameFinder's keyword filters to discover your perfect comfort game.",
    intro:
      "Cozy games aren't a genre - they're a feeling. Soft palettes, gentle loops, low stakes, and a world that feels good to inhabit. Whether you want to knit, fish, brew potions, or just wander, there's a cozy game for that.",
    filters: [
      { category: "Keywords", id: 24685, name: "cozy" },
      { category: "Keywords", id: 23931, name: "Wholesome" },
      { category: "Keywords", id: 2084, name: "Relaxing" },
      { category: "Keywords", id: 1697, name: "Atmospheric" },
    ],
    relatedSlugs: ["cozy-farming-games", "cute-wholesome-games", "relaxing-simulation-games"],
    searchLabel: "Find cozy games",
  },
  {
    slug: "survival-crafting-games",
    title: "Best Survival Crafting Games - Build, Gather, Survive",
    description:
      "Find the best survival crafting games on PC and console. Filter by keywords like crafting, exploration, and resource management to discover your next base-building obsession.",
    intro:
      "From forest hideouts to space stations, survival crafting games put you against the world with nothing but your wits and a stone axe. Gather, build, explore, and outlast - on your terms.",
    filters: [
      { category: "Keywords", id: 510, name: "Crafting" },
      { category: "Keywords", id: 606, name: "Resource Management" },
      { category: "Keywords", id: 72, name: "Exploration" },
      { category: "themes", id: 21, name: "Survival" },
    ],
    relatedSlugs: ["open-world-exploration-games", "colony-builder-games", "base-building-strategy-games"],
    searchLabel: "Find survival crafting games",
  },
  {
    slug: "roguelike-games",
    title: "Best Roguelike Games - Permadeath, Procedural, Pure Replayability",
    description:
      "Discover the best roguelike games with true permadeath and procedurally generated levels. GameFinder lets you filter by mechanics, setting, and mood to find your perfect run.",
    intro:
      "Every run is different. Every death is a lesson. Roguelikes are built on consequence, discovery, and the dopamine hit of finally clearing that floor you've failed thirty times.",
    filters: [
      { category: "Keywords", id: 416, name: "Roguelike" },
      { category: "Keywords", id: 2228, name: "Dungeon Crawler" },
    ],
    relatedSlugs: ["roguelite-games", "permadeath-games", "dungeon-crawler-rpg-games"],
    searchLabel: "Find roguelike games",
  },
  {
    slug: "roguelite-games",
    title: "Best Roguelite Games - Run-Based Games with Persistent Progress",
    description:
      "Find the best roguelite games where each run builds toward long-term progression. From deck-builders to action games, discover titles with just the right amount of permanent unlock.",
    intro:
      "Roguelites keep the random runs and punishing loops of roguelikes, but add a hook that keeps you coming back: permanent upgrades, unlockable characters, and a meta-layer that rewards persistence.",
    filters: [
      { category: "Keywords", id: 17292, name: "Roguelite" },
      { category: "Keywords", id: 2228, name: "Dungeon Crawler" },
    ],
    relatedSlugs: ["roguelike-games", "dungeon-crawler-rpg-games", "metroidvania-games"],
    searchLabel: "Find roguelite games",
  },
  {
    slug: "open-world-exploration-games",
    title: "Best Open World Exploration Games - Discover Vast, Living Worlds",
    description:
      "Find the best open world exploration games. Filter by keywords like exploration, atmospheric, and open world to find games that reward wandering off the beaten path.",
    intro:
      "Some of the best gaming moments happen when you ignore the quest marker and just walk. Open world exploration games are built for that feeling - hidden caves, unexpected vistas, and worlds that feel alive.",
    filters: [
      { category: "Keywords", id: 72, name: "Exploration" },
      { category: "Keywords", id: 1697, name: "Atmospheric" },
      { category: "themes", id: 38, name: "Open world" },
    ],
    relatedSlugs: ["survival-crafting-games", "space-exploration-games", "story-rich-narrative-games"],
    searchLabel: "Find open world games",
  },
  {
    slug: "dark-fantasy-rpg-games",
    title: "Best Dark Fantasy RPG Games - Grim Worlds, Deep Lore, Hard Choices",
    description:
      "Discover the best dark fantasy RPGs. Find games with dark atmosphere, rich magic systems, and morally complex worlds using GameFinder's curated keyword filters.",
    intro:
      "No chosen ones, no happy endings - just a brutal world soaked in lore and consequence. Dark fantasy RPGs reward players who lean into the darkness and dig deep into systems that actually mean something.",
    filters: [
      { category: "Keywords", id: 537, name: "Dark Fantasy" },
      { category: "Keywords", id: 226, name: "Magic" },
      { category: "Keywords", id: 223, name: "Dark" },
      { category: "genres", id: 12, name: "Role-playing (RPG)" },
      { category: "themes", id: 17, name: "Fantasy" },
    ],
    relatedSlugs: ["fantasy-rpg-games", "souls-like-games", "medieval-rpg-games"],
    searchLabel: "Find dark fantasy RPGs",
  },
  {
    slug: "horror-games",
    title: "Best Horror Games - Psychological, Survival, and Atmospheric Scares",
    description:
      "Find the best horror games across every subgenre. From psychological horror to survival horror, use GameFinder's mood and mechanic filters to find something genuinely frightening.",
    intro:
      "The best horror games don't just startle you - they get under your skin and stay there. Whether it's the dread of unseen threats, the slow creep of madness, or a monster that learns your patterns, good horror lingers.",
    filters: [
      { category: "Keywords", id: 131, name: "Psychological horror" },
      { category: "Keywords", id: 1836, name: "Survival Horror" },
      { category: "Keywords", id: 223, name: "Dark" },
      { category: "themes", id: 19, name: "Horror" },
    ],
    relatedSlugs: ["cozy-horror-games", "atmospheric-horror-games", "dark-fantasy-rpg-games"],
    searchLabel: "Find horror games",
  },
  {
    slug: "city-builder-games",
    title: "Best City Builder Games - Plan, Build, and Manage Thriving Cities",
    description:
      "Discover the best city builder games. Filter by strategy mechanics, simulation depth, and setting to find your next urban planning obsession - from medieval towns to sci-fi megacities.",
    intro:
      "Few things are as satisfying as watching a city come to life under your hand. City builders reward patience, planning, and the compulsive urge to optimize one more district before you log off.",
    filters: [
      { category: "Keywords", id: 3533, name: "City Builder" },
      { category: "Keywords", id: 606, name: "Resource Management" },
      { category: "genres", id: 15, name: "Strategy" },
    ],
    relatedSlugs: ["colony-builder-games", "base-building-strategy-games", "turn-based-strategy-games"],
    searchLabel: "Find city builder games",
  },
  {
    slug: "puzzle-mystery-games",
    title: "Best Puzzle Mystery Games - Investigate, Deduce, Uncover the Truth",
    description:
      "Find the best mystery puzzle games. Use keyword filters for detective, investigation, and narrative-driven to discover compelling whodunits and mind-bending mystery adventures.",
    intro:
      "The best mystery games treat you as an equal - they lay out the evidence and trust you to piece it together. Whether you're a detective, an amateur sleuth, or just someone who stumbled into a crime, the satisfaction of the solve is real.",
    filters: [
      { category: "Keywords", id: 215, name: "detective" },
      { category: "Keywords", id: 1439, name: "Narrative Driven" },
      { category: "genres", id: 9, name: "Puzzle" },
      { category: "themes", id: 43, name: "Mystery" },
    ],
    relatedSlugs: ["story-rich-narrative-games", "mystery-adventure-games", "point-and-click-adventure-games"],
    searchLabel: "Find mystery puzzle games",
  },
  {
    slug: "pixel-art-games",
    title: "Best Pixel Art Games - Stunning Indie Games with Retro Aesthetics",
    description:
      "Discover the best pixel art games across every genre. From action platformers to RPGs and cozy sims, find beautiful pixel games using GameFinder's art style filters.",
    intro:
      "Pixel art isn't nostalgia - it's craft. The best pixel art games use the constraint as a canvas, building worlds with a single tile that other games need a polygon budget to match.",
    filters: [
      { category: "Keywords", id: 1705, name: "Pixel Art" },
      { category: "genres", id: 32, name: "Indie" },
    ],
    relatedSlugs: ["2d-platformer-games", "metroidvania-games", "roguelike-games"],
    searchLabel: "Find pixel art games",
  },
  {
    slug: "cyberpunk-games",
    title: "Best Cyberpunk Games - Neon Dystopias, Hackers, and Corporate Shadows",
    description:
      "Find the best cyberpunk games: neon-lit cities, corporate corruption, and renegade tech. Use GameFinder to filter by setting, atmosphere, and mechanics for your next dystopian fix.",
    intro:
      "Rain-slicked streets, implanted chrome, surveillance capitalism taken to its logical end. Cyberpunk games are about power, identity, and what it means to be human when humanity has a price tag.",
    filters: [
      { category: "Keywords", id: 103, name: "Cyberpunk" },
      { category: "themes", id: 18, name: "Science fiction" },
    ],
    relatedSlugs: ["sci-fi-games", "space-exploration-games", "story-rich-narrative-games"],
    searchLabel: "Find cyberpunk games",
  },
  {
    slug: "souls-like-games",
    title: "Best Souls-like Games - Punishing Combat, Rich Lore, Earned Victory",
    description:
      "Discover the best souls-like games. Filter by combat mechanics, dark atmosphere, and difficulty to find games that punish and reward in equal measure.",
    intro:
      "Souls-likes don't meet you halfway. They demand attention, patience, and a willingness to die until you understand. The reward isn't just progress - it's the satisfaction of finally understanding a world that wanted you to quit.",
    filters: [
      { category: "Keywords", id: 17326, name: "Souls-like" },
      { category: "Keywords", id: 223, name: "Dark" },
      { category: "genres", id: 12, name: "Role-playing (RPG)" },
    ],
    relatedSlugs: ["dark-fantasy-rpg-games", "dungeon-crawler-rpg-games", "parry-games"],
    searchLabel: "Find souls-like games",
  },
  {
    slug: "cozy-horror-games",
    title: "Best Cozy Horror Games - Spooky Vibes Without the Trauma",
    description:
      "Find the best cozy horror games: atmospheric, slightly spooky titles that are more unsettling than terrifying. Perfect for players who love Halloween vibes without jump scares.",
    intro:
      "Not all horror has to be harrowing. Cozy horror games sit in the sweet spot between eerie and inviting - a little spooky, a little melancholy, deeply atmospheric. Think haunted cottages, spirit shops, and autumnal dread.",
    filters: [
      { category: "Keywords", id: 44167, name: "cozy horror" },
      { category: "Keywords", id: 1697, name: "Atmospheric" },
      { category: "themes", id: 19, name: "Horror" },
    ],
    relatedSlugs: ["cozy-games", "horror-games", "atmospheric-horror-games"],
    searchLabel: "Find cozy horror games",
  },
  {
    slug: "medieval-rpg-games",
    title: "Best Medieval RPG Games - Swords, Magic, and Kingdom Intrigue",
    description:
      "Discover the best medieval RPG games. Filter by setting, mechanics, and mood to find knightly epics, dark sorcery tales, and gritty historical fantasy adventures.",
    intro:
      "Cobblestone streets, flickering torches, feudal politics, and magic that costs something. Medieval RPGs offer a particular kind of weight - history-adjacent worlds with rules that feel earned.",
    filters: [
      { category: "Keywords", id: 151, name: "Medieval" },
      { category: "Keywords", id: 226, name: "Magic" },
      { category: "genres", id: 12, name: "Role-playing (RPG)" },
      { category: "themes", id: 17, name: "Fantasy" },
    ],
    relatedSlugs: ["dark-fantasy-rpg-games", "fantasy-rpg-games", "souls-like-games"],
    searchLabel: "Find medieval RPGs",
  },
  {
    slug: "metroidvania-games",
    title: "Best Metroidvania Games - Interconnected Worlds, Gated Secrets",
    description:
      "Find the best metroidvania games. Filter by exploration mechanics, platform style, and atmosphere to discover games that reward curiosity and backtracking with new paths.",
    intro:
      "A metroidvania is a promise: somewhere behind that locked door is something worth the wait. These games are architectural puzzles disguised as action games, built for players who map as they go.",
    filters: [
      { category: "Keywords", id: 477, name: "Metroidvania" },
      { category: "Keywords", id: 72, name: "Exploration" },
      { category: "genres", id: 8, name: "Platform" },
    ],
    relatedSlugs: ["2d-platformer-games", "roguelike-games", "pixel-art-games"],
    searchLabel: "Find metroidvania games",
  },
  {
    slug: "story-rich-narrative-games",
    title: "Best Story-Rich Narrative Games - Games That Stay With You",
    description:
      "Discover the best story-rich games with strong narratives, complex characters, and emotional depth. Use GameFinder to filter by tone, setting, and storytelling style.",
    intro:
      "The games that hit hardest are the ones that trust you with a real story. Narrative-driven games treat player choice and emotional investment as first-class mechanics - and the best ones you don't forget.",
    filters: [
      { category: "Keywords", id: 1439, name: "Narrative Driven" },
      { category: "Keywords", id: 1697, name: "Atmospheric" },
      { category: "genres", id: 31, name: "Adventure" },
    ],
    relatedSlugs: ["mystery-adventure-games", "puzzle-mystery-games", "cyberpunk-games"],
    searchLabel: "Find story-rich games",
  },
  {
    slug: "space-exploration-games",
    title: "Best Space Exploration Games - Infinite Universes to Discover",
    description:
      "Find the best space exploration games. From survival in the void to galaxy-spanning empires, use GameFinder to filter by setting, mechanics, and mood.",
    intro:
      "Space is the ultimate open world - infinite, hostile, and full of things no one has named yet. Space exploration games bottle that feeling: the loneliness, the wonder, and the rare thrill of first contact.",
    filters: [
      { category: "Keywords", id: 974, name: "Space" },
      { category: "Keywords", id: 72, name: "Exploration" },
      { category: "themes", id: 18, name: "Science fiction" },
    ],
    relatedSlugs: ["sci-fi-games", "cyberpunk-games", "open-world-exploration-games"],
    searchLabel: "Find space exploration games",
  },
  {
    slug: "colony-builder-games",
    title: "Best Colony Builder Games - Grow Your Settlement From Scratch",
    description:
      "Discover the best colony builder games. Filter by management depth, setting, and survival challenge to find your next settlement sim addiction.",
    intro:
      "You start with nothing and end with a city. Colony builders are about systems talking to systems - food supply, morale, housing, disease - and the satisfaction of watching a civilization emerge from your decisions.",
    filters: [
      { category: "Keywords", id: 31089, name: "colony builder" },
      { category: "Keywords", id: 606, name: "Resource Management" },
      { category: "genres", id: 15, name: "Strategy" },
    ],
    relatedSlugs: ["city-builder-games", "base-building-strategy-games", "survival-crafting-games"],
    searchLabel: "Find colony builder games",
  },
  {
    slug: "relaxing-simulation-games",
    title: "Best Relaxing Simulation Games - Low Stakes, High Satisfaction",
    description:
      "Find the best relaxing simulation games. Whether it's farming, fishing, decorating, or running a shop, use GameFinder to discover sims that feel like a warm cup of tea.",
    intro:
      "Not every game needs to challenge you. The best relaxing sims offer a different kind of engagement: mastery through repetition, satisfaction through small completions, and a world that runs at your speed.",
    filters: [
      { category: "Keywords", id: 2084, name: "Relaxing" },
      { category: "Keywords", id: 43, name: "Life" },
      { category: "Keywords", id: 1697, name: "Atmospheric" },
      { category: "genres", id: 13, name: "Simulator" },
    ],
    relatedSlugs: ["cozy-farming-games", "cozy-games", "cute-wholesome-games"],
    searchLabel: "Find relaxing simulation games",
  },
  {
    slug: "base-building-strategy-games",
    title: "Best Base Building Strategy Games - Fortify, Expand, Defend",
    description:
      "Find the best base building strategy games. Filter by RTS, survival, or tower defense mechanics to discover games that reward planning, expansion, and resilient defense.",
    intro:
      "A good base starts with a plan and ends with a fortress. Base building strategy games are about controlled expansion under pressure - the satisfaction of a well-defended perimeter or a perfectly optimized production line.",
    filters: [
      { category: "Keywords", id: 606, name: "Resource Management" },
      { category: "Keywords", id: 72, name: "Exploration" },
      { category: "genres", id: 15, name: "Strategy" },
      { category: "themes", id: 21, name: "Survival" },
    ],
    relatedSlugs: ["colony-builder-games", "city-builder-games", "survival-crafting-games"],
    searchLabel: "Find base building games",
  },
  {
    slug: "mystery-adventure-games",
    title: "Best Mystery Adventure Games - Suspense, Secrets, and Sharp Deduction",
    description:
      "Discover the best mystery adventure games. From noir investigations to supernatural whodunits, filter by theme, tone, and mechanics to find the mystery that pulls you in.",
    intro:
      "Every mystery adventure game is an invitation: here's a world with something hidden, now find it. The best ones don't just deliver a plot - they make you feel the weight of each revelation.",
    filters: [
      { category: "Keywords", id: 215, name: "detective" },
      { category: "Keywords", id: 1697, name: "Atmospheric" },
      { category: "genres", id: 31, name: "Adventure" },
      { category: "themes", id: 43, name: "Mystery" },
    ],
    relatedSlugs: ["puzzle-mystery-games", "story-rich-narrative-games", "point-and-click-adventure-games"],
    searchLabel: "Find mystery adventure games",
  },
  {
    slug: "fantasy-rpg-games",
    title: "Best Fantasy RPG Games - Epic Quests, Deep Lore, Endless Magic",
    description:
      "Find the best fantasy RPGs. Use GameFinder to filter by magic systems, setting, combat style, and tone - from high fantasy epics to low-magic character studies.",
    intro:
      "Fantasy RPGs are built on the oldest genre contract: here is a world more interesting than this one, and you matter in it. From sprawling open worlds to intimate party-based journeys, the magic never gets old.",
    filters: [
      { category: "Keywords", id: 226, name: "Magic" },
      { category: "genres", id: 12, name: "Role-playing (RPG)" },
      { category: "themes", id: 17, name: "Fantasy" },
    ],
    relatedSlugs: ["dark-fantasy-rpg-games", "medieval-rpg-games", "souls-like-games"],
    searchLabel: "Find fantasy RPGs",
  },
  {
    slug: "turn-based-strategy-games",
    title: "Best Turn-Based Strategy Games - Think First, Strike Second",
    description:
      "Discover the best turn-based strategy games. Filter by combat style, setting, and depth to find tactical gems that reward planning over reflexes.",
    intro:
      "Turn-based strategy is chess with consequences. Every decision compounds - the unit you moved two turns ago determines what's possible now. These games reward deliberate thinkers over fast fingers.",
    filters: [
      { category: "genres", id: 16, name: "Turn-based strategy (TBS)" },
      { category: "genres", id: 15, name: "Strategy" },
    ],
    relatedSlugs: ["base-building-strategy-games", "colony-builder-games", "city-builder-games"],
    searchLabel: "Find turn-based strategy games",
  },
  {
    slug: "atmospheric-horror-games",
    title: "Best Atmospheric Horror Games - Dread Without Jump Scares",
    description:
      "Find the best atmospheric horror games that build tension through environment, sound, and psychological unease rather than cheap scares. Filtered by mood and mechanic.",
    intro:
      "The scariest games never show you the monster. Atmospheric horror works through creeping dread - the sound design that makes you afraid to open a door, the level geometry that implies something wrong, the silence before.",
    filters: [
      { category: "Keywords", id: 1697, name: "Atmospheric" },
      { category: "Keywords", id: 223, name: "Dark" },
      { category: "Keywords", id: 131, name: "Psychological horror" },
      { category: "themes", id: 19, name: "Horror" },
    ],
    relatedSlugs: ["horror-games", "cozy-horror-games", "story-rich-narrative-games"],
    searchLabel: "Find atmospheric horror games",
  },
  {
    slug: "2d-platformer-games",
    title: "Best 2D Platformer Games - Sharp Controls, Handcrafted Levels",
    description:
      "Discover the best 2D platformer games. From tight precision runs to expansive metroidvania-style explorations, find platformers that feel great to play using GameFinder.",
    intro:
      "A great 2D platformer is about feel as much as design. Every jump should land right, every obstacle should be legible, and the satisfaction of a clean run should make you immediately want to do it again.",
    filters: [
      { category: "Keywords", id: 3014, name: "2D Platformer" },
      { category: "genres", id: 8, name: "Platform" },
    ],
    relatedSlugs: ["metroidvania-games", "parkour-games", "pixel-art-games"],
    searchLabel: "Find 2D platformer games",
  },
  {
    slug: "cute-wholesome-games",
    title: "Best Cute & Wholesome Games - Feel-Good Games for Every Mood",
    description:
      "Find the best cute and wholesome games. Filter by art style, atmosphere, and genre to discover adorable, uplifting games that make you feel good playing them.",
    intro:
      "Sometimes you don't want challenge or story - you want a world that feels safe and kind. Cute and wholesome games offer exactly that: charming art, gentle mechanics, and the uncomplicated joy of a world rooting for you.",
    filters: [
      { category: "Keywords", id: 1387, name: "Cute" },
      { category: "Keywords", id: 23931, name: "Wholesome" },
      { category: "Keywords", id: 2084, name: "Relaxing" },
      { category: "genres", id: 32, name: "Indie" },
    ],
    relatedSlugs: ["cozy-games", "cozy-farming-games", "relaxing-simulation-games"],
    searchLabel: "Find cute wholesome games",
  },
  {
    slug: "dungeon-crawler-rpg-games",
    title: "Best Dungeon Crawler RPG Games - Loot Deep, Die Memorably",
    description:
      "Find the best dungeon crawler RPGs. Filter by combat, loot systems, and depth to discover turn-based classics, action dungeon crawlers, and everything between.",
    intro:
      "Dungeon crawlers are about descending - deeper floors, better loot, harder enemies, and the ever-present question of how far you can push your luck before you need to head back up.",
    filters: [
      { category: "Keywords", id: 2228, name: "Dungeon Crawler" },
      { category: "genres", id: 12, name: "Role-playing (RPG)" },
    ],
    relatedSlugs: ["roguelike-games", "roguelite-games", "dark-fantasy-rpg-games"],
    searchLabel: "Find dungeon crawler RPGs",
  },
  {
    slug: "sci-fi-games",
    title: "Best Sci-Fi Games - Futures Worth Exploring",
    description:
      "Discover the best science fiction games across every genre. From space operas to hard sci-fi simulations, use GameFinder to filter by setting, tone, and gameplay style.",
    intro:
      "Science fiction games ask the best questions. What does humanity look like with a few more centuries of hubris? What happens when the universe is bigger than our comprehension? What does it cost to survive the future?",
    filters: [
      { category: "Keywords", id: 974, name: "Space" },
      { category: "Keywords", id: 1697, name: "Atmospheric" },
      { category: "themes", id: 18, name: "Science fiction" },
    ],
    relatedSlugs: ["cyberpunk-games", "space-exploration-games", "open-world-exploration-games"],
    searchLabel: "Find sci-fi games",
  },
  {
    slug: "point-and-click-adventure-games",
    title: "Best Point-and-Click Adventure Games - Classic Puzzles, Timeless Stories",
    description:
      "Find the best point-and-click adventure games. From golden-era classics to modern narrative adventures, discover games where story and puzzle design take center stage.",
    intro:
      "Point-and-click adventures are built on patience, observation, and the particular pleasure of combining the right two things in the right order. Old genre, timeless appeal - especially when the writing is sharp.",
    filters: [
      { category: "Keywords", id: 1439, name: "Narrative Driven" },
      { category: "genres", id: 2, name: "Point-and-click" },
      { category: "themes", id: 43, name: "Mystery" },
    ],
    relatedSlugs: ["mystery-adventure-games", "puzzle-mystery-games", "story-rich-narrative-games"],
    searchLabel: "Find point-and-click adventures",
  },
  // --- Priority 2: Mechanic-Based Pages ---
  {
    slug: "parry-games",
    title: "Best Parry Games - Master Timing, Punish Every Attack",
    description:
      "Find the best parry games where reading and countering attacks is the core skill. From tight action games to deep combat systems, discover titles built around the perfect parry.",
    intro:
      "A well-timed parry is one of gaming's best feelings - the precise moment of reading an attack, committing to the window, and turning your enemy's aggression against them. Parry games build entire combat philosophies around this single mechanic.",
    filters: [
      { category: "Keywords", id: 5019, name: "Parry" },
    ],
    relatedSlugs: ["souls-like-games", "melee-games", "duels-games"],
    searchLabel: "Find parry games",
  },
  {
    slug: "ragdoll-physics-games",
    title: "Best Ragdoll Physics Games - Gloriously Unpredictable",
    description:
      "Discover the best ragdoll physics games where real-time physics simulation drives the action. From comedy chaos to precision challenges, find games where no two moments ever play the same.",
    intro:
      "Ragdoll physics games are honest about what they are: a love letter to beautiful chaos. When a body flails perfectly off a ledge or a stack of enemies collapses in just the right way, no animation could ever plan it. The best ones build challenge and comedy in equal measure around that unpredictability.",
    filters: [
      { category: "Keywords", id: 4770, name: "Ragdoll Physics" },
      { category: "Keywords", id: 287, name: "Physics-Focus" },
    ],
    relatedSlugs: ["physics-games", "physics-puzzle-games", "parkour-games"],
    searchLabel: "Find ragdoll physics games",
  },
  {
    slug: "bullet-time-games",
    title: "Best Bullet Time Games - Slow Time, Own the Moment",
    description:
      "Find the best bullet time games where slowing time is a core combat mechanic. Discover action games that turn chaos into choreography when the world grinds to a halt.",
    intro:
      "Bullet time turns panic into mastery. When the world slows to a crawl and you have just enough time to see every bullet, line up every shot, and step between the gaps - that's when action games feel like ballet. These titles were built around that specific power fantasy.",
    filters: [
      { category: "Keywords", id: 1309, name: "Bullet Time" },
    ],
    relatedSlugs: ["parry-games", "melee-games", "souls-like-games"],
    searchLabel: "Find bullet time games",
  },
  {
    slug: "parkour-games",
    title: "Best Parkour Games - Flow State, Open Cities, Mastered Movement",
    description:
      "Discover the best parkour games. Filter by setting, movement system, and platform to find games that make traversal feel like an art form worth mastering.",
    intro:
      "Parkour games are about flow state - reading a rooftop and moving through it without breaking stride. At their best, the city becomes a canvas and the movement system is your brush. These are games where getting from A to B is the whole point.",
    filters: [
      { category: "Keywords", id: 390, name: "Parkour" },
    ],
    relatedSlugs: ["wall-jump-games", "grapple-games", "2d-platformer-games"],
    searchLabel: "Find parkour games",
  },
  {
    slug: "wall-jump-games",
    title: "Best Wall Jump Games - Defy Gravity, Master the Climb",
    description:
      "Find the best wall jump games where vertical movement and wall-based traversal are core mechanics. Discover platformers and action games that turn every surface into a launchpad.",
    intro:
      "Wall jumping is the platformer's second language. It opens vertical space, rewards mastery, and reframes every surface as a possibility. The best wall jump games design entire levels around this extra dimension - teaching you to think in angles, not just directions.",
    filters: [
      { category: "Keywords", id: 2155, name: "Wall Jump" },
    ],
    relatedSlugs: ["parkour-games", "grapple-games", "metroidvania-games"],
    searchLabel: "Find wall jump games",
  },
  {
    slug: "grapple-games",
    title: "Best Grapple Hook Games - Swing, Pull, Own the Space",
    description:
      "Find the best grapple hook games where mobility and momentum define the experience. Discover games where mastering the grapple transforms every level into a physics playground.",
    intro:
      "A good grapple hook changes how you read space. Every surface becomes a possible anchor, every gap a trajectory to solve. Grapple games reward spatial instinct and the specific thrill of a perfectly timed swing - or a perfectly timed yank.",
    filters: [
      { category: "Keywords", id: 4903, name: "Grapple" },
      { category: "Keywords", id: 390, name: "Parkour" },
    ],
    relatedSlugs: ["parkour-games", "wall-jump-games", "2d-platformer-games"],
    searchLabel: "Find grapple hook games",
  },
  {
    slug: "music-rhythm-games",
    title: "Best Music & Rhythm Games - Play the Beat, Feel the Music",
    description:
      "Discover the best music and rhythm games. From high-precision arcade challenges to story-driven musical experiences, find games where the soundtrack is the mechanic.",
    intro:
      "Rhythm games collapse the distance between listener and player. When inputs lock to the beat, every note you hit feels musical and every miss feels physical. The best ones don't just play music at you - they teach you to hear it in a completely new way.",
    filters: [
      { category: "Keywords", id: 4137, name: "Music & Rhythm" },
      { category: "Keywords", id: 1687, name: "Music Based" },
    ],
    relatedSlugs: ["bullet-time-games", "relaxing-simulation-games", "pixel-art-games"],
    searchLabel: "Find music rhythm games",
  },
  {
    slug: "permadeath-games",
    title: "Best Permadeath Games - Every Life Counts, Every Death Is Final",
    description:
      "Find the best permadeath games where dying means starting over. Discover roguelikes, survival games, and tactical titles where permanent consequences sharpen every decision.",
    intro:
      "Permadeath makes everything matter. When a death ends the run, each resource becomes precious, each piece of information becomes currency, and every room you enter is a genuine risk assessment. These games demand respect from the player - and return it in full.",
    filters: [
      { category: "Keywords", id: 578, name: "Permadeath" },
    ],
    relatedSlugs: ["roguelike-games", "roguelite-games", "souls-like-games"],
    searchLabel: "Find permadeath games",
  },
  {
    slug: "gore-games",
    title: "Best Gore Games - Visceral, Brutal, Unfiltered Combat",
    description:
      "Find the best gore games with intense, visceral violence and brutal combat. Discover games that use gore as meaningful feedback, not just spectacle.",
    intro:
      "The best gore games use violence as a feedback system. The visual crunch of a well-landed blow, the consequence of a perfectly placed shot, the reminder that the world has weight and your actions have impact. These are games that take their violence seriously as a mechanic.",
    filters: [
      { category: "Keywords", id: 1308, name: "Gore" },
      { category: "Keywords", id: 129, name: "Bloody" },
    ],
    relatedSlugs: ["souls-like-games", "dark-fantasy-rpg-games", "horror-games"],
    searchLabel: "Find gore games",
  },
  {
    slug: "physics-games",
    title: "Best Physics Games - Where Simulation Is the Mechanic",
    description:
      "Discover the best physics-driven games. Find sandbox, simulation, and action titles where realistic physics isn't just visual polish - it's the core system you play with.",
    intro:
      "In the best physics games, the engine is the designer. Mass, friction, and momentum create emergent scenarios no level designer could script. These are games where you prod the system and then ride whatever chaos comes back at you.",
    filters: [
      { category: "Keywords", id: 287, name: "Physics-Focus" },
    ],
    relatedSlugs: ["ragdoll-physics-games", "physics-puzzle-games", "destructible-environment-games"],
    searchLabel: "Find physics games",
  },
  {
    slug: "physics-puzzle-games",
    title: "Best Physics Puzzle Games - Think in Forces, Solve with Gravity",
    description:
      "Find the best physics puzzle games. Discover titles where mass, momentum, and gravity are your tools - and the solution only reveals itself once you understand the underlying system.",
    intro:
      "Physics puzzle games make you think in forces. Every object has mass, every surface has friction, and the gap between your current state and the solution is an equation waiting to be solved intuitively. The moment it clicks feels less like solving a puzzle and more like understanding a rule of the universe.",
    filters: [
      { category: "Keywords", id: 2451, name: "Physics" },
      { category: "Keywords", id: 287, name: "Physics-Focus" },
    ],
    relatedSlugs: ["physics-games", "ragdoll-physics-games", "puzzle-mystery-games"],
    searchLabel: "Find physics puzzle games",
  },
  {
    slug: "destructible-environment-games",
    title: "Best Destructible Environment Games - Wreck It, Reroute Everything",
    description:
      "Find the best games with destructible environments. Discover action, strategy, and sandbox titles where breaking the world open is as important as navigating it.",
    intro:
      "Destructible environments change the contract. When walls can be broken, cover is temporary, and every path is one explosion away from a new shortcut. The best games with destructible environments reward creativity - sometimes the most powerful move is just making a new door.",
    filters: [
      { category: "Keywords", id: 5453, name: "Destructible Environment" },
    ],
    relatedSlugs: ["physics-games", "physics-puzzle-games", "ragdoll-physics-games"],
    searchLabel: "Find destructible environment games",
  },
  {
    slug: "time-travel-games",
    title: "Best Time Travel Games - Rewrite the Timeline, Unravel the Past",
    description:
      "Discover the best time travel games. From puzzle mechanics built on rewinding seconds to narrative epics about reshaping history, find games that make time a first-class design element.",
    intro:
      "Time travel games ask an impossible question and then dare you to answer it. Whether you're rewinding a few seconds to undo a mistake or reshaping an entire timeline, the best ones use the mechanic to make choices feel consequential in ways linear games can't reach.",
    filters: [
      { category: "Keywords", id: 170, name: "Time Travel" },
    ],
    relatedSlugs: ["puzzle-mystery-games", "story-rich-narrative-games", "physics-puzzle-games"],
    searchLabel: "Find time travel games",
  },
  {
    slug: "melee-games",
    title: "Best Melee Combat Games - Up Close, No Distance, Pure Skill",
    description:
      "Find the best melee combat games. Filter by combat system, setting, and difficulty to discover games that make close-quarters fighting feel real, readable, and deeply satisfying.",
    intro:
      "Melee combat strips away distance and forces a direct confrontation with design. Hitboxes, timing windows, combo systems, and the geometry of positioning - when it works, close-quarters combat is one of the most readable and satisfying feedback loops in all of games.",
    filters: [
      { category: "Keywords", id: 4891, name: "Melee" },
    ],
    relatedSlugs: ["parry-games", "duels-games", "souls-like-games"],
    searchLabel: "Find melee combat games",
  },
  {
    slug: "martial-arts-games",
    title: "Best Martial Arts Games - Discipline, Technique, and Controlled Violence",
    description:
      "Discover the best martial arts games. From stylized brawlers to grounded technical fighters, find games where martial arts is the core identity - not just a skin on generic combat.",
    intro:
      "The best martial arts games understand that technique is the point. Not just button chains, but the weight of a well-executed throw, the satisfaction of a counter that lands exactly right, and worlds built around the culture and discipline behind the fighting style.",
    filters: [
      { category: "Keywords", id: 61, name: "Martial Arts" },
      { category: "Keywords", id: 4891, name: "Melee" },
    ],
    relatedSlugs: ["melee-games", "parry-games", "duels-games"],
    searchLabel: "Find martial arts games",
  },
  {
    slug: "duels-games",
    title: "Best Dueling Games - One on One, Every Move Counts",
    description:
      "Find the best dueling games where one-on-one combat is the core experience. From swordfighting sims to honor-based showdowns, discover games that make every duel feel like chess at speed.",
    intro:
      "A duel is the purest form of combat: no allies, no cover, just two opponents reading each other until one makes the decisive mistake. The best dueling games build entire philosophies around that dynamic - the tension of the standoff, the commitment of the first move, and the earned finality of the last.",
    filters: [
      { category: "Keywords", id: 4860, name: "Duels" },
      { category: "Keywords", id: 4891, name: "Melee" },
    ],
    relatedSlugs: ["parry-games", "melee-games", "martial-arts-games"],
    searchLabel: "Find dueling games",
  },
];

export const SEO_PAGE_MAP = new Map<string, SeoPage>(
  SEO_PAGES.map((p) => [p.slug, p])
);
