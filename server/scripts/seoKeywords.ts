export type TemplateCategory =
  | 'sports'
  | 'game_structure'
  | 'shooter'
  | 'combat_system'
  | 'challenge'
  | 'rpg_system'
  | 'puzzle'
  | 'life_sim'
  | 'vehicle'
  | 'combat_style'
  | 'strategy'
  | 'time_period'
  | 'location'
  | 'env_feature'
  | 'world_condition'
  | 'mythology'
  | 'cultural_ip'
  | 'internet_culture'
  | 'art_style'
  | 'visual_theme'
  | 'atmosphere'
  | 'narrative'
  | 'soundtrack';

export interface KeywordConfig {
  name: string;
  id: number;
  category: TemplateCategory;
  titleName?: string; // override when "Best {name} Games" reads awkwardly
}

export const KEYWORD_CONFIGS: KeywordConfig[] = [
  // Sports
  { name: 'Fishing', id: 509, category: 'sports' },
  { name: 'Billiards', id: 2016, category: 'sports' },
  { name: 'Wrestling', id: 234, category: 'sports' },
  { name: 'Boxing', id: 632, category: 'sports' },
  { name: 'Skiing', id: 917, category: 'sports' },
  { name: 'Bowling', id: 299, category: 'sports' },
  { name: 'Dancing', id: 1699, category: 'sports' },

  // Game Structure
  { name: 'Multiple Endings', id: 1313, category: 'game_structure' },
  { name: 'Linear', id: 6137, category: 'game_structure' },
  { name: 'Text Adventure', id: 4260, category: 'game_structure' },
  { name: 'Tower Defense', id: 77, category: 'game_structure' },
  { name: 'Procedural Generation', id: 577, category: 'game_structure' },
  { name: 'Single-Player Only', id: 4138, category: 'game_structure' },
  { name: 'Typing', id: 38116, category: 'game_structure' },
  { name: 'Idle Gameplay', id: 17003, category: 'game_structure' },

  // Shooters
  { name: 'Vehicle Combat', id: 25, category: 'shooter' },
  { name: 'Run and Gun', id: 660, category: 'shooter' },
  { name: 'Sniping', id: 4730, category: 'shooter' },
  { name: 'Arena Shooter', id: 1451, category: 'shooter' },
  { name: 'Retro Arcade', id: 37923, category: 'shooter' },

  // Combat Systems
  { name: 'Turn-Based Combat', id: 2399, category: 'combat_system', titleName: 'Turn-Based Combat' },
  { name: 'Cover System', id: 5451, category: 'combat_system' },
  { name: 'Real-Time Pause', id: 6057, category: 'combat_system' },
  { name: 'Auto-Battler', id: 40897, category: 'combat_system' },
  { name: 'Bullet Hell', id: 911, category: 'combat_system' },
  { name: 'Twin Stick', id: 17371, category: 'combat_system' },
  { name: 'Battle Arena', id: 114, category: 'combat_system' },
  { name: 'Counter Attack', id: 7345, category: 'combat_system', titleName: 'Counter Attack' },
  { name: 'Environmental Kills', id: 6457, category: 'combat_system' },
  { name: 'Bow and Arrow', id: 4392, category: 'combat_system' },

  // Challenges
  { name: 'Die and Retry', id: 24126, category: 'challenge', titleName: 'Die & Retry' },
  { name: 'Moral Decisions', id: 4850, category: 'challenge' },
  { name: 'Jump Scares', id: 5176, category: 'challenge' },
  { name: 'Inventory Management', id: 2489, category: 'challenge' },
  { name: 'Boss Fight', id: 3486, category: 'challenge' },
  { name: 'Precision Platforming', id: 25831, category: 'challenge' },
  { name: 'Speedrun', id: 5962, category: 'challenge' },

  // RPG Systems
  { name: 'Crafting', id: 510, category: 'rpg_system' },
  { name: 'Party System', id: 4468, category: 'rpg_system' },
  { name: 'Alchemy', id: 2668, category: 'rpg_system' },
  { name: 'Choices Matter', id: 3534, category: 'rpg_system' },
  { name: 'Skill Tree', id: 5792, category: 'rpg_system' },

  // Puzzles
  { name: 'Word Game', id: 2366, category: 'puzzle' },
  { name: 'Falling Blocks', id: 2528, category: 'puzzle' },
  { name: 'Nonogram', id: 2423, category: 'puzzle' },
  { name: 'Brick Breaker', id: 2838, category: 'puzzle' },

  // Life Sim / Management
  { name: 'Dating Sim', id: 358, category: 'life_sim', titleName: 'Dating Sim' },
  { name: 'Restaurant', id: 38859, category: 'life_sim' },
  { name: 'Sports Manager', id: 44173, category: 'life_sim' },
  { name: 'Gacha', id: 7545, category: 'life_sim' },

  // Vehicles
  { name: 'Truck', id: 1156, category: 'vehicle' },
  { name: 'RC Vehicle', id: 16716, category: 'vehicle' },
  { name: 'Horse', id: 44765, category: 'vehicle' },
  { name: 'Monster Truck', id: 625, category: 'vehicle' },
  { name: 'Helicopter', id: 21, category: 'vehicle' },
  { name: 'Motorcycle', id: 57, category: 'vehicle' },
  { name: 'Submarine', id: 5825, category: 'vehicle' },
  { name: 'Mech', id: 167, category: 'vehicle' },
  { name: 'Bicycle', id: 44687, category: 'vehicle' },
  { name: 'Skateboard', id: 2913, category: 'vehicle' },
  { name: 'Trains', id: 915, category: 'vehicle' },

  // Combat Styles
  { name: 'Siege Warfare', id: 9733, category: 'combat_style' },
  { name: 'Dual Wielding', id: 6716, category: 'combat_style' },
  { name: 'Pets', id: 816, category: 'combat_style' },
  { name: 'Spell Casting', id: 5124, category: 'combat_style' },
  { name: 'Berserker', id: 7561, category: 'combat_style', titleName: 'Berserker' },
  { name: 'Sword Fighting', id: 18537, category: 'combat_style' },
  { name: 'Horse Archery', id: 9604, category: 'combat_style' },
  { name: 'Summons', id: 497, category: 'combat_style' },
  { name: 'Naval Warfare', id: 8146, category: 'combat_style' },
  { name: 'Space Battles', id: 18424, category: 'combat_style' },
  { name: 'Stealth Takedown', id: 5999, category: 'combat_style' },

  // Strategy
  { name: 'Static Defense', id: 13038, category: 'strategy' },
  { name: 'Diplomacy', id: 1143, category: 'strategy' },
  { name: 'Automation', id: 12950, category: 'strategy' },

  // Time Periods
  { name: 'Prehistoric', id: 1370, category: 'time_period' },
  { name: 'Middle Ages', id: 3852, category: 'time_period' },
  { name: 'Ancient Rome', id: 293, category: 'time_period' },
  { name: 'Ancient Greece', id: 34, category: 'time_period' },
  { name: 'Ancient Egypt', id: 421, category: 'time_period' },
  { name: 'Ancient China', id: 1909, category: 'time_period' },
  { name: 'Ancient Japan', id: 38810, category: 'time_period' },
  { name: 'Future', id: 465, category: 'time_period' },
  { name: 'Retro Future', id: 4976, category: 'time_period' },
  { name: 'Wild West', id: 985, category: 'time_period' },
  { name: 'Renaissance', id: 2545, category: 'time_period' },
  { name: '17th Century', id: 29379, category: 'time_period' },
  { name: '18th Century', id: 552, category: 'time_period' },
  { name: 'Victorian', id: 31259, category: 'time_period' },
  { name: 'Retro', id: 126, category: 'time_period' },
  { name: 'Modern Military', id: 4259, category: 'time_period' },
  { name: 'Futuristic', id: 923, category: 'time_period' },
  { name: 'Western', id: 9, category: 'time_period' },
  { name: 'Feudal Japan', id: 2458, category: 'time_period' },
  { name: 'Soviet Union', id: 2442, category: 'time_period' },
  { name: 'WW1', id: 29, category: 'time_period' },
  { name: 'Alternative History', id: 39200, category: 'time_period' },

  // Locations
  { name: 'Hell', id: 122, category: 'location' },
  { name: 'Underwater', id: 138, category: 'location' },
  { name: 'Haunted House', id: 198, category: 'location' },
  { name: 'Cyberspace', id: 18772, category: 'location' },

  // Environmental Features
  { name: 'Maze', id: 687, category: 'env_feature' },
  { name: 'Gravity-Focus', id: 137, category: 'env_feature' },
  { name: 'Day-Night Cycle', id: 2452, category: 'env_feature', titleName: 'Day/Night Cycle' },
  { name: 'Underwater Gameplay', id: 4940, category: 'env_feature' },
  { name: 'Nature', id: 1111, category: 'env_feature' },

  // World Conditions
  { name: 'Alien World', id: 18055, category: 'world_condition' },
  { name: 'Wasteland', id: 19191, category: 'world_condition' },
  { name: 'Apocalyptic', id: 16957, category: 'world_condition' },
  { name: 'Post-Apocalyptic', id: 69, category: 'world_condition' },
  { name: 'Dystopian', id: 429, category: 'world_condition' },
  { name: 'Time Loop', id: 2158, category: 'world_condition' },
  { name: 'Nuclear War', id: 9321, category: 'world_condition' },

  // Mythology & Lore
  { name: 'Norse Myths', id: 367, category: 'mythology' },
  { name: 'Greek Myths', id: 35, category: 'mythology' },
  { name: 'Chinese Myths', id: 41581, category: 'mythology' },
  { name: 'Fairy Tales', id: 42632, category: 'mythology', titleName: 'Fairy Tale' },
  { name: 'Folk Tales', id: 42629, category: 'mythology' },
  { name: 'Occult', id: 1066, category: 'mythology' },
  { name: 'From a Manga', id: 2648, category: 'mythology', titleName: 'Manga' },

  // Cultural IP / Adaptations
  { name: 'True Story', id: 10839, category: 'cultural_ip' },
  { name: 'Sherlock Holmes', id: 256, category: 'cultural_ip' },
  { name: 'From a Book', id: 1538, category: 'cultural_ip', titleName: 'Book Adaptation' },
  { name: 'From a Cartoon', id: 24033, category: 'cultural_ip', titleName: 'Cartoon Adaptation' },
  { name: 'From a Comic', id: 4310, category: 'cultural_ip', titleName: 'Comic Adaptation' },
  { name: 'From a Brand', id: 4813, category: 'cultural_ip', titleName: 'Brand Adaptation' },
  { name: 'Adapted to Movie', id: 11853, category: 'cultural_ip', titleName: 'Movie Tie-In' },
  { name: 'Adapted to TV', id: 7028, category: 'cultural_ip', titleName: 'TV Tie-In' },
  { name: 'From a Board Game', id: 16875, category: 'cultural_ip', titleName: 'Board Game Adaptation' },

  // Internet Culture
  { name: 'SCP', id: 39890, category: 'internet_culture' },
  { name: 'Memes', id: 2807, category: 'internet_culture' },
  { name: 'Backrooms', id: 33719, category: 'internet_culture' },
  { name: 'Rage Game', id: 27086, category: 'internet_culture' },
  { name: 'Slender', id: 19488, category: 'internet_culture' },

  // Art Styles
  { name: 'Hand-Drawn', id: 2814, category: 'art_style' },
  { name: 'Surreal', id: 1721, category: 'art_style' },
  { name: 'Steampunk', id: 906, category: 'art_style' },
  { name: 'Cel Shading', id: 5331, category: 'art_style' },
  { name: 'Voxel', id: 595, category: 'art_style' },
  { name: 'Claymation', id: 964, category: 'art_style' },
  { name: 'Monochrome', id: 1203, category: 'art_style' },

  // Visual Themes
  { name: 'Minimalist', id: 4784, category: 'visual_theme' },
  { name: 'Psychedelic', id: 1467, category: 'visual_theme' },
  { name: 'Low-Poly', id: 2225, category: 'visual_theme' },
  { name: 'Gothic', id: 423, category: 'visual_theme' },
  { name: 'Body Horror', id: 25555, category: 'visual_theme' },

  // Atmosphere / Mood
  { name: 'Bloody', id: 129, category: 'atmosphere' },
  { name: 'Dark Humor', id: 1754, category: 'atmosphere' },
  { name: 'Creepy', id: 2653, category: 'atmosphere' },
  { name: 'Emotional', id: 2202, category: 'atmosphere' },
  { name: 'Weird', id: 220, category: 'atmosphere' },
  { name: 'Melancholic', id: 42165, category: 'atmosphere' },
  { name: 'Meditative', id: 24919, category: 'atmosphere' },
  { name: 'Satire', id: 1539, category: 'atmosphere' },
  { name: 'Parody', id: 413, category: 'atmosphere' },

  // Narrative Style
  { name: 'Bad Endings', id: 24392, category: 'narrative' },
  { name: 'Surreal Comedy', id: 38292, category: 'narrative' },
  { name: 'Nonlinear', id: 45058, category: 'narrative' },
  { name: 'No Dialogue', id: 5802, category: 'narrative' },
  { name: 'Dialogue Choices', id: 23739, category: 'narrative' },
  { name: 'Unreliable Narrator', id: 5255, category: 'narrative' },

  // Soundtrack
  { name: 'Heavy Metal', id: 2153, category: 'soundtrack' },
  { name: 'Hip-Hop', id: 2949, category: 'soundtrack' },
  { name: 'J-Pop', id: 9331, category: 'soundtrack' },
  { name: 'Rock', id: 5287, category: 'soundtrack' },
  { name: 'Music Based', id: 1687, category: 'soundtrack' },
  { name: 'In-Game Radio', id: 5474, category: 'soundtrack' },
  { name: 'Synthwave', id: 3784, category: 'soundtrack' },
  { name: 'Great Soundtrack', id: 3403, category: 'soundtrack' },
];
