export interface BoardGame {
  objectname: string;
  objectid: string;
  rating: string;
  average: string;
  avgweight: string;
  minplayers: string;
  maxplayers: string;
  playingtime: string;
  maxplaytime: string;
  minplaytime: string;
  yearpublished: string;
  bggrecagerange: string;
  imageid: string;
  bgglanguagedependence: string;
  own: string;
  itemtype: string;
  // BGG API enrichment fields
  image?: string;
  thumbnail?: string;
  description?: string;
  bggId?: string;
  bggRating?: number;
  bggRank?: number;
  weight?: number;
  mechanics?: string[];
  categories?: string[];
  designers?: string[];
}

// Normalized game interface for easier use
export interface Game {
  id: string;
  name: string;
  image?: string;
  thumbnail?: string;
  description?: string;
  rating?: number;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playTime?: number;
  minAge?: number;
  bggId?: string;
  bggRating?: number;
  bggRank?: number;
  weight?: number;
}

export interface GameFilter {
  search: string;
  minPlayers?: number;
  maxPlayers?: number;
  maxPlaytime?: number;
  minRating?: number;
  subtype?: string;
  mechanics?: string[];
}

export type SortOption = 'name' | 'rating' | 'players' | 'playtime';
