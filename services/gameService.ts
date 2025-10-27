import Papa from 'papaparse';
import { BoardGame, Game, GameFilter, SortOption } from '@/types/game';
import { fetchBGGCollectionWithRetry } from './bggCollectionService';

export class GameService {
  private static games: BoardGame[] = [];
  private static initialized = false;
  private static useBGGCollection = true; // Toggle to use BGG API or CSV

  // Method to update the internal games cache (e.g., when adding mechanics)
  static updateGamesCache(games: BoardGame[]): void {
    this.games = games;
  }

  static async loadGames(csvText?: string): Promise<BoardGame[]> {
    if (this.initialized) {
      return this.games;
    }

    try {
      if (this.useBGGCollection && !csvText) {
        // Fetch from BGG API (includes all games, no filtering)
        console.log('Loading games from BGG collection...');
        this.games = await fetchBGGCollectionWithRetry();
        this.initialized = true;
        console.log('✅ Loaded', this.games.length, 'games from BGG API (all types)');
        return this.games;
      } else {
        // Load from CSV (fallback or server-side)
        let csvContent: string;
        
        if (csvText) {
          // Server-side: CSV content provided
          csvContent = csvText;
        } else {
          // Client-side: fetch from public folder
          const response = await fetch('/collection.csv');
          csvContent = await response.text();
        }

        return new Promise((resolve, reject) => {
          Papa.parse(csvContent, {
            header: true,
            complete: (results) => {
              this.games = results.data as BoardGame[];
              // Filter out games with missing data but KEEP ALL TYPES (standalone + expansions)
              this.games = this.games.filter(
                (game) => game.objectname && game.objectid
              );
              this.initialized = true;
              console.log('✅ Loaded', this.games.length, 'games from CSV (all types)');
              resolve(this.games);
            },
            error: (error: Error) => {
              reject(error);
            },
          });
        });
      }
    } catch (error) {
      console.error('Error loading games:', error);
      
      // Fallback to CSV if BGG fails
      if (this.useBGGCollection && !csvText) {
        console.log('BGG collection failed, falling back to CSV...');
        this.useBGGCollection = false;
        this.initialized = false;
        return this.loadGames();
      }
      
      throw error;
    }
  }

  static getGames(): BoardGame[] {
    return this.games;
  }

  // Convert BoardGame to normalized Game format
  static toGame(boardGame: BoardGame): Game {
    return {
      id: boardGame.objectid,
      name: boardGame.objectname,
      image: boardGame.image || this.getGameImageUrl(boardGame.imageid),
      thumbnail: boardGame.thumbnail,
      description: boardGame.description,
      rating: parseFloat(boardGame.average) || undefined,
      yearPublished: parseInt(boardGame.yearpublished) || undefined,
      minPlayers: parseInt(boardGame.minplayers) || undefined,
      maxPlayers: parseInt(boardGame.maxplayers) || undefined,
      playTime: parseInt(boardGame.playingtime) || undefined,
      minAge: parseInt(boardGame.bggrecagerange) || undefined,
      bggId: boardGame.bggId || boardGame.objectid,
      bggRating: boardGame.bggRating,
      bggRank: boardGame.bggRank,
      weight: boardGame.weight || parseFloat(boardGame.avgweight) || undefined
    };
  }

  // Get games in normalized format
  static getNormalizedGames(): Game[] {
    return this.games.map(game => this.toGame(game));
  }

  static filterGames(filter: GameFilter): BoardGame[] {
    let filtered = [...this.games];

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter((game) =>
        game.objectname.toLowerCase().includes(searchLower)
      );
    }

    if (filter.subtype) {
      filtered = filtered.filter(
        (game) => game.itemtype === filter.subtype
      );
    }

    if (filter.mechanics && filter.mechanics.length > 0) {
      // Filter games that have at least one of the selected mechanics
      filtered = filtered.filter((game) => {
        if (!game.mechanics || game.mechanics.length === 0) {
          return false;
        }
        // Check if game has at least one matching mechanic
        return filter.mechanics!.some(selectedMechanic =>
          game.mechanics!.includes(selectedMechanic)
        );
      });
    }

    if (filter.minPlayers !== undefined && filter.maxPlayers !== undefined) {
      // Both min and max specified - strict range filter
      filtered = filtered.filter((game) => {
        const gameMinPlayers = parseInt(game.minplayers);
        const gameMaxPlayers = parseInt(game.maxplayers);
        // Game's player range must be within the specified range
        return !isNaN(gameMinPlayers) && !isNaN(gameMaxPlayers) &&
               gameMinPlayers >= filter.minPlayers! && 
               gameMaxPlayers <= filter.maxPlayers!;
      });
    } else if (filter.minPlayers !== undefined) {
      // Only min specified - show games that can accommodate at least this many
      filtered = filtered.filter((game) => {
        const gameMaxPlayers = parseInt(game.maxplayers);
        return !isNaN(gameMaxPlayers) && gameMaxPlayers >= filter.minPlayers!;
      });
    } else if (filter.maxPlayers !== undefined) {
      // Only max specified - show games that work with at most this many
      filtered = filtered.filter((game) => {
        const gameMinPlayers = parseInt(game.minplayers);
        return !isNaN(gameMinPlayers) && gameMinPlayers <= filter.maxPlayers!;
      });
    }

    if (filter.maxPlaytime) {
      filtered = filtered.filter(
        (game) => parseInt(game.playingtime) <= filter.maxPlaytime!
      );
    }

    if (filter.minRating) {
      filtered = filtered.filter(
        (game) => parseFloat(game.average) >= filter.minRating!
      );
    }

    return filtered;
  }

  static sortGames(games: BoardGame[], sortBy: SortOption): BoardGame[] {
    const sorted = [...games];

    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) =>
          a.objectname.localeCompare(b.objectname)
        );
      case 'rating':
        return sorted.sort(
          (a, b) => parseFloat(b.average) - parseFloat(a.average)
        );
      case 'players':
        return sorted.sort(
          (a, b) => parseInt(b.maxplayers) - parseInt(a.maxplayers)
        );
      case 'playtime':
        return sorted.sort(
          (a, b) => parseInt(a.playingtime) - parseInt(b.playingtime)
        );
      default:
        return sorted;
    }
  }

  static getGameById(id: string): BoardGame | undefined {
    return this.games.find((game) => game.objectid === id);
  }

  static getAllUniqueMechanics(): string[] {
    const mechanicsSet = new Set<string>();
    
    this.games.forEach((game) => {
      if (game.mechanics && game.mechanics.length > 0) {
        game.mechanics.forEach(mechanic => mechanicsSet.add(mechanic));
      }
    });
    
    // Return sorted array of unique mechanics
    return Array.from(mechanicsSet).sort();
  }

  static getGameImageUrl(imageid: string): string {
    if (!imageid) {
      return '';
    }
    return `https://cf.geekdo-images.com/thumb/img/${imageid}`;
  }
}
