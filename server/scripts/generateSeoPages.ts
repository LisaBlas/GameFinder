import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { KEYWORD_CONFIGS, type TemplateCategory } from './seoKeywords.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Slugs already covered by hand-written pages in seoPages.ts
const COVERED_SLUGS = new Set([
  'cozy-farming-games', 'cozy-games', 'survival-crafting-games', 'roguelike-games',
  'roguelite-games', 'open-world-exploration-games', 'dark-fantasy-rpg-games', 'horror-games',
  'city-builder-games', 'puzzle-mystery-games', 'pixel-art-games', 'cyberpunk-games',
  'souls-like-games', 'cozy-horror-games', 'medieval-rpg-games', 'metroidvania-games',
  'story-rich-narrative-games', 'space-exploration-games', 'colony-builder-games',
  'relaxing-simulation-games', 'base-building-strategy-games', 'mystery-adventure-games',
  'fantasy-rpg-games', 'turn-based-strategy-games', 'atmospheric-horror-games',
  '2d-platformer-games', 'cute-wholesome-games', 'dungeon-crawler-rpg-games', 'sci-fi-games',
  'point-and-click-adventure-games', 'parry-games', 'ragdoll-physics-games', 'bullet-time-games',
  'parkour-games', 'wall-jump-games', 'grapple-games', 'music-rhythm-games', 'permadeath-games',
  'gore-games', 'physics-games', 'physics-puzzle-games', 'destructible-environment-games',
  'time-travel-games', 'melee-games', 'martial-arts-games', 'duels-games',
]);

function toSlug(name: string): string {
  return name.toLowerCase()
    .replace(/\s*&\s*/g, '-and-')
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---- Title taglines per category ----
const TAGLINES: Record<TemplateCategory, string> = {
  sports:          'Dedicated Mechanics, Real Skill Ceiling',
  game_structure:  'One Design Philosophy, Done Right',
  shooter:         'Distinct Identity, Precise Execution',
  combat_system:   'Combat Depth Where It Counts',
  challenge:       'The Challenge Is the Whole Point',
  rpg_system:      'Where the System Actually Matters',
  puzzle:          'Pure Puzzle Design, Real Depth',
  life_sim:        'Simulate, Manage, and Master',
  vehicle:         'Real Feel, Real Mechanics',
  combat_style:    'Style and Substance in Every Fight',
  strategy:        'Think Deeper, Win Smarter',
  time_period:     'A Setting That Earns Its Place',
  location:        'When the World Shapes the Game',
  env_feature:     'When Environment Is the Mechanic',
  world_condition: 'Worlds Under Pressure',
  mythology:       'Legends Worth Playing',
  cultural_ip:     'Adaptations That Earn Their Existence',
  internet_culture:'For Players Who Get the Reference',
  art_style:       'Gorgeous, Distinctive, Memorable',
  visual_theme:    'Aesthetic With Meaning',
  atmosphere:      'Tone Sustained Start to Finish',
  narrative:       'Stories Worth Telling Differently',
  soundtrack:      'Sound That Defines the Experience',
};

// ---- Description second sentences per category ----
const DESC_SUFFIX: Record<TemplateCategory, string> = {
  sports:          'Use GameFinder\'s keyword and platform filters to find {keyword} games that match your playstyle and skill level.',
  game_structure:  'Use GameFinder\'s mechanic and mood filters to find {keyword} games with exactly the design depth you\'re after.',
  shooter:         'Filter by setting, tone, and difficulty to find the {keyword} shooter that fits how you play.',
  combat_system:   'Use GameFinder\'s keyword and genre filters to find games where {keyword} is the core mechanic.',
  challenge:       'Filter by genre and mood to find {keyword} games that deliver the specific challenge you\'re after.',
  rpg_system:      'Use GameFinder to filter by genre and setting alongside {keyword} mechanics to find your next RPG.',
  puzzle:          'Filter by difficulty and atmosphere to find {keyword} puzzle games worth your time.',
  life_sim:        'Use GameFinder\'s simulation and genre filters to find {keyword} games with the right depth and tone.',
  vehicle:         'Filter by setting and game type to find {keyword} games with the right mix of authenticity and fun.',
  combat_style:    'Use GameFinder to filter by genre, setting, and tone alongside {keyword} combat to narrow down your next game.',
  strategy:        'Filter by setting and mechanic depth to find {keyword} strategy games that reward serious play.',
  time_period:     'Use GameFinder to filter by genre, tone, and mechanics to find {keyword} games that use the era well.',
  location:        'Filter by genre and mood to find {keyword} games that commit fully to their setting.',
  env_feature:     'Use GameFinder\'s keyword filters to find games where {keyword} is a core mechanic, not an incidental detail.',
  world_condition: 'Filter by genre and tone to find {keyword} games that go deeper than the aesthetic.',
  mythology:       'Use GameFinder to filter by genre, tone, and mechanics to find {keyword} games that earn the source material.',
  cultural_ip:     'Filter by genre and tone to find {keyword} adaptations that justify their existence.',
  internet_culture:'Use GameFinder to find {keyword} games for players who already know the lore.',
  art_style:       'Filter by genre, tone, and platform to find {keyword} games with strong visual execution.',
  visual_theme:    'Use GameFinder\'s keyword and mood filters alongside {keyword} aesthetics to find games with visual coherence.',
  atmosphere:      'Filter by genre, mechanics, and setting to find {keyword} games that sustain the tone from start to finish.',
  narrative:       'Use GameFinder to find {keyword} games where the structural choice makes the story better, not just different.',
  soundtrack:      'Filter by genre and setting to find {keyword} games where the music is part of the design.',
};

// ---- Intro template variants per category (2-3 each) ----
// {keyword} is replaced at generation time
const INTROS: Record<TemplateCategory, string[]> = {
  sports: [
    '{keyword} games go deeper than general sports titles allow. Where broader athletic games divide attention across many disciplines, these commit fully to the specific timing, skill, and strategy that make {keyword} worth mastering.',
    'There\'s a particular satisfaction to games built around a single sport or activity — the mechanics get room to breathe and develop a real skill ceiling. {keyword} games are where developers actually care about getting the movement, timing, and decision-making right.',
    'The best {keyword} games understand what makes the real thing compelling: the rhythm, the reads, the specific physical vocabulary. They translate that into a system you can practice and improve at, not just button-mash through.',
  ],
  game_structure: [
    '{keyword} is a design philosophy, not just a feature. Games built around it attract players who specifically want that structural commitment — and deliver something you can\'t get from a more conventional approach.',
    'Some structural choices define the entire experience. {keyword} games commit to a design decision and build everything else around it — if it\'s what you\'re looking for, these titles deliver it more fully than anything that hedges.',
    '{keyword} shapes the kind of choices a game offers and the kind of skill it rewards. These titles treat it as a first-class design pillar, not a checkbox — which means it actually changes how you play.',
  ],
  shooter: [
    '{keyword} is its own distinct genre within shooting games — different vocabulary, different skill ceiling, different reason to play. These are the titles built around it with intent, not just as a mode or a feature.',
    'Not all shooters are the same game in different skins. {keyword} games have a specific identity and a specific player in mind — the mechanics, pace, and challenge structure are built around a particular kind of mastery.',
    'The appeal of {keyword} games is precision of intent. They know exactly what they are and what they reward — players who know what they want from a shooter will find more here than in anything more generalist.',
  ],
  combat_system: [
    '{keyword} as a combat mechanic represents a specific philosophy about how fights should be decided. Games built around it reward a particular kind of read and reaction — and for players who love that system, these titles deliver it at full depth.',
    'Combat design is the backbone of most games, but {keyword} mechanics have a distinct identity. These titles treat it as the core of the fight system — not an afterthought bolted onto something more generic.',
    'There are players who don\'t just tolerate {keyword} mechanics — they specifically seek them out. These games are built from the ground up around that system, which means it\'s developed and central in a way that casual implementations never manage.',
  ],
  challenge: [
    '{keyword} isn\'t a side feature in these games — it\'s the design center. They\'re built to test a specific kind of skill or decision-making and structured to make every session meaningful.',
    'Some players actively seek games with serious {keyword}. These titles don\'t treat it as optional or cosmetic — the whole progression, level design, and reward structure is built around it.',
    'The best {keyword} games understand what makes that challenge compelling rather than frustrating. They build difficulty systems that teach before they punish and reward mastery with something that feels genuinely earned.',
  ],
  rpg_system: [
    '{keyword} is one of those RPG systems that separates good games from great ones. Done well, it becomes the loop you\'re always optimizing — the part of the session you\'re already planning for before you\'ve finished the current one.',
    'RPG mechanics vary wildly in depth and commitment. {keyword} games treat it as load-bearing, not decorative — a system with real internal logic that rewards the players who engage with it seriously.',
    'Some RPG mechanics are present and some are central. {keyword} games build the whole experience around it — the progression, the economy, and the meaningful decisions all run through it.',
  ],
  puzzle: [
    '{keyword} puzzles have a dedicated audience for a reason: the format has a real skill ceiling and a specific kind of satisfaction you can\'t replicate with a different puzzle type. The best entries push the core mechanic further than you\'d expect.',
    'There\'s something elegantly specific about {keyword} as a puzzle format. It sets a constraint and then explores how deep that constraint can go — and the best games in this category find surprising depth in familiar rules.',
    '{keyword} games are built for players who want to get good at something specific. The format is consistent enough to master but varied enough to stay interesting — and the best titles find new design space within established vocabulary.',
  ],
  life_sim: [
    '{keyword} games let you manage a specific domain in enough detail for the decisions to matter. The best ones go deep enough that the simulation feels real — not just decorative dressing on a generic management loop.',
    'Simulation games are at their best when they commit to a specific world. {keyword} games aren\'t trying to simulate everything — they\'re building one particular domain with enough systems to make you feel like you actually understand how it works.',
    'There\'s a particular kind of engagement in {keyword} games: mastery over a specific set of rules, satisfaction through small completions, and a feedback loop that rewards the players who pay attention.',
  ],
  vehicle: [
    '{keyword} games exist in a specific niche between simulation and action — close enough to the real thing to feel authentic, but designed to be playable. The appeal is the sensation of operating something with weight, consequence, and specific mechanical logic.',
    'There\'s a dedicated audience for {keyword} games — players who want the specific feel of operating that vehicle, whether that means the satisfaction of a well-executed maneuver, a long-haul run done right, or combat built around what makes it interesting.',
    'Good {keyword} games respect the source material. The physics, the constraints, the specific skills required — they don\'t just use the vehicle as a skin on a generic engine, they build mechanics around what makes operating it interesting.',
  ],
  combat_style: [
    '{keyword} as a combat identity has a specific visual and mechanical vocabulary. Games built around it commit to that vocabulary — the timing, the consequences, and the satisfaction structure are designed around the style.',
    'Combat style shapes the feel of every engagement. {keyword} games are built around a specific way of fighting — and if it\'s the approach you prefer, these titles give it more depth than anything that treats it as one option among many.',
    'The best {keyword} games understand what makes that style of fighting compelling, not just mechanically viable. The animations, sound design, and combat flow all support the identity — it\'s not just a mechanical label.',
  ],
  strategy: [
    '{keyword} is a strategic layer that changes how you think about every other decision in the game. These titles treat it as a first-class mechanic — the thing you\'re always planning around, not a side system you can ignore.',
    'Strategy games vary enormously in where they put their depth. {keyword} games build their strategic identity around a specific kind of thinking — and if that\'s the layer you want to engage with, these titles go further into it than almost anything else.',
    'The appeal of {keyword} as a strategic mechanic is how it recontextualizes everything else. Games that commit to it force you to approach every resource and decision differently — the best ones make that recontextualization feel like the whole point.',
  ],
  time_period: [
    '{keyword} as a setting isn\'t just backdrop — it shapes available technology, social dynamics, visual language, and what kinds of conflicts are possible. Games that commit to the setting use it as a design constraint rather than decoration.',
    'The best {keyword} games earn their setting. The historical or speculative context isn\'t just window dressing — it shapes the mechanics, the stakes, and what the game is actually about.',
    'There\'s a specific texture to {keyword} games that comes from treating the era with genuine interest rather than just raiding it for aesthetic. The world has its own rules, and the best games in this category let those rules into the design.',
  ],
  location: [
    '{keyword} as a setting has its own physical and atmospheric rules. The environment isn\'t just visual — it shapes movement, threat, sound design, and tone in ways that define what kind of game this can be.',
    'Some settings fundamentally change what a game is. {keyword} games are defined as much by where they take place as by what you do there — the location shapes the rules, the mood, and what kinds of encounters make sense.',
    'The best {keyword} games use the setting with intent — the mechanics and the atmosphere are designed around what makes that environment distinctive, not just placed there for visual impact.',
  ],
  env_feature: [
    '{keyword} as a game mechanic changes the fundamental rules of navigation, combat, or progression. Games built around it don\'t just include it as a visual backdrop — it\'s the thing that makes the design work.',
    'Environmental mechanics are at their best when they\'re deeply integrated. {keyword} games treat the environment as a co-designer — the way the world works shapes every decision you make, not just what you can see.',
    'There\'s a design purity to games that commit fully to an environmental mechanic. {keyword} games use it as a load-bearing constraint — everything interesting about the game is in some way a consequence of how that mechanic works.',
  ],
  world_condition: [
    '{keyword} isn\'t just a setting — it\'s a premise that shapes what questions the game is asking. Survival, society, and what people do under extreme conditions all look different when the world has been fundamentally changed.',
    'The appeal of {keyword} settings is what they reveal. Strip away the familiar structures and games can ask harder questions about human behavior and meaning. The best {keyword} games use that pressure intentionally.',
    '{keyword} games vary enormously in how seriously they engage with their premise. The ones worth playing go beyond the aesthetic — the world condition actually changes the choices available, the stakes, and what kind of player the game asks you to be.',
  ],
  mythology: [
    '{keyword} provides some of gaming\'s richest source material — a world with established rules, resonant figures, embedded conflicts, and moral logic that predates the game by centuries. The best entries earn the mythology by building mechanics that match the spirit of the material.',
    'There\'s a reason {keyword} keeps appearing in games: the stories are already compelling. The challenge is using the material with intention — not just borrowing names for flavor, but understanding why it matters and designing around that.',
    'Games rooted in {keyword} carry the weight of their source material — and the good ones treat that as an asset rather than a burden. The world is already built; the design question is how to give players meaningful entry into it.',
  ],
  cultural_ip: [
    'Adaptations carry both an advantage and a responsibility. {keyword} games have a built-in world and a waiting audience — but the best ones justify their existence by doing something the source couldn\'t: giving players active agency in that world.',
    '{keyword} games vary widely in quality. Some treat the source as a coat of paint on a generic game; the good ones translate it into mechanics that feel native — where being in that world actually changes how you play.',
    'The test of a good {keyword} game is whether removing the license would leave anything interesting. The best examples are games first — the source material sharpens the design rather than replacing it.',
  ],
  internet_culture: [
    '{keyword} has an internet-native identity that games either capture or miss entirely. The best examples understand the source material well enough to extend it — to add something the original posts, videos, or memes couldn\'t provide.',
    'Games built around {keyword} are playing to a specific audience that already knows the lore, the jokes, or the frustration. When they work, they\'re among the most culturally specific games you\'ll find.',
    'The challenge with {keyword} games is that the reference does the work until the mechanics have to stand on their own. The ones worth playing are built so the game is good even if you strip away the cultural layer — the reference is a starting point, not a substitute.',
  ],
  art_style: [
    '{keyword} as a visual style is a design commitment that shapes everything: what the animation budget can accomplish, how the game reads under pressure, how the world ages. Games that commit to it fully tend to have a visual identity that stands apart.',
    'Visual style is one of the first things a game communicates — and {keyword} games have made a specific aesthetic decision that signals the kind of experience they\'re offering. When the style and design speak the same language, the result holds up.',
    'The best {keyword} games treat their visual style as a constraint that enhances the design. The limitations of the aesthetic become opportunities — shapes, movement, and readability work in ways that more realistic approaches can\'t replicate.',
  ],
  visual_theme: [
    '{keyword} as a visual theme isn\'t decorative — it communicates tone, scale, and design intent before a player has touched a control. Games that execute it well make it inseparable from the experience: the look and the feel are the same thing.',
    'Some visual themes attract a specific player before they\'ve read a word of the description. {keyword} games have an aesthetic identity that signals what kind of experience they\'re offering — and the best ones deliver on that signal.',
    'Visual themes are only as strong as their execution. {keyword} games committed to the aesthetic tend to make it structural — it shapes the UI, the level design, and the audio, not just the character art.',
  ],
  atmosphere: [
    'Tone is one of the hardest things to design — and {keyword} as a mood is something players actively seek out. These games don\'t just include it as a feature; they\'re built to sustain it through mechanics, writing, art, and sound design working in concert.',
    '{keyword} games are unified less by what you do than by how they make you feel. The design choices — aesthetic, pacing, narrative — are all pointing toward the same tonal goal. That coherence is what makes them worth finding.',
    'The best {keyword} games understand that atmosphere is a product of everything working together. The specific combination of visuals, systems, and writing creates something the parts couldn\'t generate alone.',
  ],
  narrative: [
    '{keyword} is a narrative design choice that fundamentally changes the relationship between player and story. Games built around it are doing something specific — something you can\'t replicate with a more conventional approach.',
    'Most games tell stories using the same structural vocabulary. {keyword} games are the ones that commit to something different — and when they execute it well, the result is something conventional storytelling couldn\'t produce.',
    'The best {keyword} games don\'t use the narrative technique as a novelty. The structure serves the story — form and content are matched in a way that makes the unconventional approach feel inevitable rather than arbitrary.',
  ],
  soundtrack: [
    'Music shapes how a game feels more than most players consciously register. {keyword} games have made a specific musical commitment — and when the soundtrack and mechanics are designed around the same energy, the result hits differently.',
    'Some players choose games partly by their soundtrack. {keyword} games have a defined sound identity that influences the pace, mood, and atmosphere of the whole experience — not just background music, but a design pillar.',
    'The best {keyword} games treat their music as integral, not incidental. The soundtrack isn\'t something you turn down; it\'s something the design was built around — and the games that get that relationship right stay with you.',
  ],
};

// ---- Related slug pools per category ----
const RELATED_POOLS: Record<TemplateCategory, string[]> = {
  sports:          ['2d-platformer-games', 'relaxing-simulation-games', 'cozy-games', 'pixel-art-games'],
  game_structure:  ['roguelike-games', 'story-rich-narrative-games', 'roguelite-games', 'puzzle-mystery-games'],
  shooter:         ['bullet-time-games', 'melee-games', 'open-world-exploration-games', 'survival-crafting-games'],
  combat_system:   ['souls-like-games', 'roguelike-games', 'dungeon-crawler-rpg-games', 'melee-games', 'parry-games'],
  challenge:       ['souls-like-games', 'roguelike-games', 'permadeath-games', 'parkour-games', 'dungeon-crawler-rpg-games'],
  rpg_system:      ['fantasy-rpg-games', 'dark-fantasy-rpg-games', 'dungeon-crawler-rpg-games', 'souls-like-games'],
  puzzle:          ['puzzle-mystery-games', 'story-rich-narrative-games', 'cozy-games', 'relaxing-simulation-games'],
  life_sim:        ['cozy-farming-games', 'relaxing-simulation-games', 'city-builder-games', 'cozy-games'],
  vehicle:         ['open-world-exploration-games', 'survival-crafting-games', 'space-exploration-games', 'sci-fi-games'],
  combat_style:    ['souls-like-games', 'melee-games', 'dark-fantasy-rpg-games', 'martial-arts-games', 'duels-games'],
  strategy:        ['city-builder-games', 'colony-builder-games', 'turn-based-strategy-games', 'base-building-strategy-games'],
  time_period:     ['open-world-exploration-games', 'dark-fantasy-rpg-games', 'fantasy-rpg-games', 'story-rich-narrative-games', 'medieval-rpg-games'],
  location:        ['horror-games', 'atmospheric-horror-games', 'open-world-exploration-games', 'space-exploration-games', 'cyberpunk-games'],
  env_feature:     ['open-world-exploration-games', 'survival-crafting-games', 'cozy-games', 'space-exploration-games'],
  world_condition: ['survival-crafting-games', 'open-world-exploration-games', 'story-rich-narrative-games', 'cyberpunk-games', 'horror-games'],
  mythology:       ['dark-fantasy-rpg-games', 'fantasy-rpg-games', 'story-rich-narrative-games', 'medieval-rpg-games'],
  cultural_ip:     ['story-rich-narrative-games', 'mystery-adventure-games', 'point-and-click-adventure-games', 'puzzle-mystery-games'],
  internet_culture:['horror-games', 'atmospheric-horror-games', 'cozy-horror-games', 'roguelike-games'],
  art_style:       ['pixel-art-games', '2d-platformer-games', 'metroidvania-games', 'indie-games'],
  visual_theme:    ['atmospheric-horror-games', 'dark-fantasy-rpg-games', 'cyberpunk-games', 'horror-games'],
  atmosphere:      ['cozy-games', 'story-rich-narrative-games', 'atmospheric-horror-games', 'horror-games', 'cozy-horror-games'],
  narrative:       ['story-rich-narrative-games', 'mystery-adventure-games', 'point-and-click-adventure-games', 'puzzle-mystery-games'],
  soundtrack:      ['music-rhythm-games', 'cyberpunk-games', 'story-rich-narrative-games', 'open-world-exploration-games'],
};

function pickRelated(category: TemplateCategory, selfSlug: string, index: number): string[] {
  const pool = RELATED_POOLS[category].filter(s => s !== selfSlug);
  const results: string[] = [];
  for (let i = 0; i < 3; i++) {
    results.push(pool[(index + i) % pool.length]);
  }
  return [...new Set(results)].slice(0, 3);
}

function fill(template: string, keyword: string): string {
  return template.replace(/\{keyword\}/g, keyword);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Generate pages
const pages = KEYWORD_CONFIGS
  .map((kw, index) => {
    const slug = toSlug(kw.name) + '-games';
    if (COVERED_SLUGS.has(slug)) return null;

    const displayName = kw.titleName ?? kw.name;
    const introVariants = INTROS[kw.category];
    const intro = fill(introVariants[index % introVariants.length], displayName);
    const descSuffix = fill(DESC_SUFFIX[kw.category], displayName);
    const tagline = TAGLINES[kw.category];
    const related = pickRelated(kw.category, slug, index);

    const page = {
      slug,
      title: `Best ${displayName} Games - ${tagline}`,
      description: `Find the best ${displayName.toLowerCase()} games. ${descSuffix}`,
      intro,
      filters: [{ category: 'Keywords' as const, id: kw.id, name: kw.name }],
      relatedSlugs: related,
      searchLabel: `Find ${displayName.toLowerCase()} games`,
    };

    return page;
  })
  .filter(Boolean);

// Serialize to TypeScript
function serializePage(p: NonNullable<typeof pages[number]>): string {
  const filters = p.filters.map(f =>
    `      { category: "${f.category}", id: ${f.id}, name: "${f.name}" }`
  ).join(',\n');
  const related = p.relatedSlugs.map(s => `"${s}"`).join(', ');

  return `  {
    slug: "${p.slug}",
    title: "${p.title.replace(/"/g, '\\"')}",
    description:
      "${p.description.replace(/"/g, '\\"')}",
    intro:
      "${p.intro.replace(/"/g, '\\"')}",
    filters: [
${filters},
    ],
    relatedSlugs: [${related}],
    searchLabel: "${p.searchLabel}",
  }`;
}

const output = `// AUTO-GENERATED — run \`npm run seo:generate-pages\` to regenerate.
// Review before committing. Edit seoKeywords.ts or generateSeoPages.ts to change output.

import type { SeoPage } from '../seoPages.js';

export const GENERATED_SEO_PAGES: SeoPage[] = [
${pages.map(serializePage).join(',\n')}
];
`;

const outputPath = join(__dirname, '../generatedSeoPages.ts');
writeFileSync(outputPath, output, 'utf-8');
console.log(`Wrote ${pages.length} pages to ${outputPath}`);
