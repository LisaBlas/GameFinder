// This file contains the filter data for the game search application
// It's imported from the game-filters.json file in the assets directory

const filterData = {
  "platforms": [
    {
      "id": "pc-parent",
      "name": "PC",
      "hasChildren": true,
      "isParentOnly": true,
      "children": [
        {
          "id": 6,
          "name": "PC (Microsoft Windows)"
        },
        {
          "id": 14,
          "name": "Mac"
        },
        {
          "id": 3,
          "name": "Linux"
        },
        {
          "id": 82,
          "name": "Web browser"
        }
      ]
    },
    {
      "id": "playstation-parent",
      "name": "PlayStation",
      "hasChildren": true,
      "isParentOnly": true,
      "children": [
        {
          "id": 167,
          "name": "PlayStation 5"
        },
        {
          "id": 48,
          "name": "PlayStation 4"
        },
        {
          "id": 9,
          "name": "PlayStation 3"
        },
        {
          "id": 8,
          "name": "PlayStation 2"
        },
        {
          "id": 7,
          "name": "PlayStation"
        },
        {
          "id": 46,
          "name": "PlayStation Vita"
        },
        {
          "id": 38,
          "name": "PlayStation Portable"
        },
        {
          "id": 390,
          "name": "PlayStation VR2"
        },
        {
          "id": 441,
          "name": "PocketStation"
        },
        {
          "id": 165,
          "name": "PlayStation VR"
        }
      ]
    },
    {
      "id": "xbox-parent",
      "name": "Xbox",
      "hasChildren": true,
      "isParentOnly": true,
      "children": [
        {
          "id": 169,
          "name": "Xbox Series X|S"
        },
        {
          "id": 49,
          "name": "Xbox One"
        },
        {
          "id": 12,
          "name": "Xbox 360"
        },
        {
          "id": 11,
          "name": "Xbox"
        }
      ]
    },
    {
      "id": "nintendo-parent",
      "name": "Nintendo",
      "hasChildren": true,
      "isParentOnly": true,
      "children": [
        {
          "id": 130,
          "name": "Nintendo Switch"
        },
        {
          "id": 508,
          "name": "Nintendo Switch 2"
        },
        {
          "id": 41,
          "name": "Wii U"
        },
        {
          "id": 5,
          "name": "Wii"
        },
        {
          "id": 21,
          "name": "Nintendo GameCube"
        },
        {
          "id": 4,
          "name": "Nintendo 64"
        },
        {
          "id": 19,
          "name": "Super Nintendo Entertainment System"
        },
        {
          "id": 18,
          "name": "Nintendo Entertainment System"
        },
        {
          "id": 37,
          "name": "Nintendo 3DS"
        },
        {
          "id": 137,
          "name": "New Nintendo 3DS"
        },
        {
          "id": 20,
          "name": "Nintendo DS"
        },
        {
          "id": 159,
          "name": "Nintendo DSi"
        },
        {
          "id": 24,
          "name": "Game Boy Advance"
        },
        {
          "id": 22,
          "name": "Game Boy Color"
        },
        {
          "id": 33,
          "name": "Game Boy"
        },
        {
          "id": 307,
          "name": "Game & Watch"
        },
        {
          "id": 47,
          "name": "Virtual Console"
        }
      ]
    },
    {
      "id": "mobile-parent",
      "name": "Mobile",
      "hasChildren": true,
      "isParentOnly": true,
      "children": [
        {
          "id": 34,
          "name": "Android"
        },
        {
          "id": 39,
          "name": "iOS"
        },
        {
          "id": 405,
          "name": "Windows Mobile"
        }
      ]
    },
    {
      "id": "vr-parent",
      "name": "VR Platforms",
      "hasChildren": true,
      "isParentOnly": true,
      "children": [
        {
          "id": 471,
          "name": "Meta Quest 3"
        },
        {
          "id": 386,
          "name": "Meta Quest 2"
        },
        {
          "id": 384,
          "name": "Oculus Quest"
        },
        {
          "id": 385,
          "name": "Oculus Rift"
        },
        {
          "id": 163,
          "name": "SteamVR"
        },
        {
          "id": 161,
          "name": "Windows Mixed Reality"
        },
        {
          "id": 472,
          "name": "visionOS"
        }
      ]
    },
    {
      "id": 52,
      "name": "Arcade",
      "hasChildren": false
    },
    {
      "id": "sega-parent",
      "name": "Sega",
      "hasChildren": true,
      "isParentOnly": true,
      "children": [
        {
          "id": 23,
          "name": "Dreamcast"
        },
        {
          "id": 32,
          "name": "Sega Saturn"
        },
        {
          "id": 29,
          "name": "Sega Mega Drive/Genesis"
        },
        {
          "id": 78,
          "name": "Sega CD"
        },
        {
          "id": 35,
          "name": "Sega Game Gear"
        },
        {
          "id": 64,
          "name": "Sega Master System/Mark III"
        }
      ]
    },
    {
      "id": "cloud-parent",
      "name": "Cloud Gaming",
      "hasChildren": true,
      "isParentOnly": true,
      "children": [
        {
          "id": 389,
          "name": "AirConsole"
        },
        {
          "id": 309,
          "name": "Evercade"
        },
        {
          "id": 509,
          "name": "Polymega"
        }
      ]
    },
    {
      "id": "indie-parent",
      "name": "Indie Hardware",
      "hasChildren": true,
      "isParentOnly": true,
      "children": [
        {
          "id": 381,
          "name": "Playdate"
        },
        {
          "id": 438,
          "name": "Arduboy"
        }
      ]
    }
  ],
  "genres": [
    {
      "id": 2,
      "name": "Point-and-click"
    },
    {
      "id": 4,
      "name": "Fighting"
    },
    {
      "id": 5,
      "name": "Shooter"
    },
    {
      "id": 7,
      "name": "Music"
    },
    {
      "id": 8,
      "name": "Platform"
    },
    {
      "id": 9,
      "name": "Puzzle"
    },
    {
      "id": 10,
      "name": "Racing"
    },
    {
      "id": 11,
      "name": "Real Time Strategy (RTS)"
    },
    {
      "id": 12,
      "name": "Role-playing (RPG)"
    },
    {
      "id": 13,
      "name": "Simulator"
    },
    {
      "id": 14,
      "name": "Sport"
    },
    {
      "id": 15,
      "name": "Strategy"
    },
    {
      "id": 16,
      "name": "Turn-based strategy (TBS)"
    },
    {
      "id": 24,
      "name": "Tactical"
    },
    {
      "id": 25,
      "name": "Hack and slash/Beat 'em up"
    },
    {
      "id": 26,
      "name": "Quiz/Trivia"
    },
    {
      "id": 30,
      "name": "Pinball"
    },
    {
      "id": 31,
      "name": "Adventure"
    },
    {
      "id": 32,
      "name": "Indie"
    },
    {
      "id": 33,
      "name": "Arcade"
    },
    {
      "id": 34,
      "name": "Visual Novel"
    },
    {
      "id": 35,
      "name": "Card & Board Game"
    },
    {
      "id": 36,
      "name": "MOBA"
    }
  ],
  "themes": [
    {
      "id": 31,
      "name": "Drama"
    },
    {
      "id": 32,
      "name": "Non-fiction"
    },
    {
      "id": 33,
      "name": "Sandbox"
    },
    {
      "id": 34,
      "name": "Educational"
    },
    {
      "id": 35,
      "name": "Kids"
    },
    {
      "id": 38,
      "name": "Open world"
    },
    {
      "id": 39,
      "name": "Warfare"
    },
    {
      "id": 40,
      "name": "Party"
    },
    {
      "id": 41,
      "name": "4X (explore, expand, exploit, and exterminate)"
    },
    {
      "id": 42,
      "name": "Erotic"
    },
    {
      "id": 43,
      "name": "Mystery"
    },
    {
      "id": 1,
      "name": "Action"
    },
    {
      "id": 17,
      "name": "Fantasy"
    },
    {
      "id": 18,
      "name": "Science fiction"
    },
    {
      "id": 19,
      "name": "Horror"
    },
    {
      "id": 20,
      "name": "Thriller"
    },
    {
      "id": 21,
      "name": "Survival"
    },
    {
      "id": 22,
      "name": "Historical"
    },
    {
      "id": 23,
      "name": "Stealth"
    },
    {
      "id": 27,
      "name": "Comedy"
    },
    {
      "id": 28,
      "name": "Business"
    },
    {
      "id": 44,
      "name": "Romance"
    }
  ],
  "Game Mode": [
    {
      "id": 1,
      "name": "Single player"
    },
    {
      "id": 2,
      "name": "Multiplayer"
    },
    {
      "id": 3,
      "name": "Co-operative"
    },
    {
      "id": 4,
      "name": "Split screen"
    },
    {
      "id": 5,
      "name": "Massively Multiplayer Online (MMO)"
    },
    {
      "id": 6,
      "name": "Battle Royale"
    }
  ],
  "Perspective": [
    {
      "id": 1,
      "name": "First person"
    },
    {
      "id": 2,
      "name": "Third person"
    },
    {
      "id": 3,
      "name": "Isometric"
    },
    {
      "id": 4,
      "name": "Side view"
    },
    {
      "id": 5,
      "name": "Top-down"
    },
    {
      "id": 6,
      "name": "Text"
    },
    {
      "id": 7,
      "name": "Virtual Reality"
    },
    {
      "id": 8,
      "name": "Augmented Reality"
    }
  ],
  "Keywords": [
    {
      "id": 165,
      "name": "Procedural Generation"
    },
    {
      "id": 872,
      "name": "Open World"
    },
    {
      "id": 24,
      "name": "Tactical RPG"
    },
    {
      "id": 46,
      "name": "Action RPG"
    },
    {
      "id": 157,
      "name": "Rogue-like"
    },
    {
      "id": 6,
      "name": "Sci-fi"
    },
    {
      "id": 8,
      "name": "First-Person Shooter"
    },
    {
      "id": 37,
      "name": "Survival Horror"
    },
    {
      "id": 75,
      "name": "Simulation"
    },
    {
      "id": 88,
      "name": "Stealth"
    }
  ]
};

export default filterData;
