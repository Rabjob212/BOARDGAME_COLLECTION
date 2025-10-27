import { Game } from '@/types/game';

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';

// Rate limiter queue
class RateLimiter {
  private queue: (() => Promise<void>)[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private minDelay = 500; // 500ms between requests (2 per second)

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minDelay) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minDelay - timeSinceLastRequest)
        );
      }
      
      const task = this.queue.shift();
      if (task) {
        this.lastRequestTime = Date.now();
        await task();
      }
    }
    
    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();

// In-memory cache for thumbnails
const thumbnailCache = new Map<string, string | null>();

interface BGGGameData {
  id: string;
  name: string;
  thumbnail?: string;
  image?: string;
  description?: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minPlayTime?: number;
  maxPlayTime?: number;
  minAge?: number;
  rating?: number;
  weight?: number;
  rank?: number;
  mechanics?: string[];
  categories?: string[];
  designers?: string[];
}

// Helper to parse XML text content
function getXMLValue(element: Element, tagName: string, attribute?: string): string | undefined {
  const el = element.querySelector(tagName);
  if (!el) return undefined;
  
  if (attribute) {
    return el.getAttribute(attribute) || undefined;
  }
  return el.textContent || undefined;
}

// Search for games by name
export async function searchBGGGames(query: string): Promise<BGGGameData[]> {
  try {
    const response = await fetch(
      `${BGG_API_BASE}/search?query=${encodeURIComponent(query)}&type=boardgame`
    );
    
    if (!response.ok) {
      throw new Error('BGG API search failed');
    }
    
    const xmlText = await response.text();
    
    // Check if we're in browser or Node.js environment
    let xmlDoc: Document;
    if (typeof window !== 'undefined') {
      // Browser
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    } else {
      // Node.js - use a simple XML parser or return empty
      return [];
    }
    
    const items = xmlDoc.querySelectorAll('item');
    const games: BGGGameData[] = [];
    
    items.forEach(item => {
      const id = item.getAttribute('id');
      const name = getXMLValue(item, 'name', 'value');
      const yearPublished = getXMLValue(item, 'yearpublished', 'value');
      
      if (id && name) {
        games.push({
          id,
          name,
          yearPublished: yearPublished ? parseInt(yearPublished) : undefined
        });
      }
    });
    
    return games;
  } catch (error) {
    console.error('Error searching BGG:', error);
    return [];
  }
}

// Get detailed information for a game by BGG ID
export async function getBGGGameDetails(bggId: string): Promise<BGGGameData | null> {
  try {
    // Add a small delay to respect BGG rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const response = await fetch(
      `${BGG_API_BASE}/thing?id=${bggId}&stats=1`
    );
    
    if (!response.ok) {
      throw new Error('BGG API request failed');
    }
    
    const xmlText = await response.text();
    
    // Check if we're in browser or Node.js environment
    let xmlDoc: Document;
    if (typeof window !== 'undefined') {
      // Browser
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    } else {
      // Node.js - use a simple XML parser or return null
      return null;
    }
    
    const item = xmlDoc.querySelector('item');
    if (!item) return null;
    
    const id = item.getAttribute('id') || bggId;
    const primaryName = item.querySelector('name[type="primary"]');
    const name = primaryName?.getAttribute('value') || '';
    
    // Get image URLs
    const thumbnail = getXMLValue(item, 'thumbnail');
    const image = getXMLValue(item, 'image');
    
    // Get description (decode HTML entities)
    const description = getXMLValue(item, 'description');
    const decodedDescription = description
      ? description
          .replace(/&amp;#10;/g, '\n')
          .replace(/&amp;ldquo;/g, '"')
          .replace(/&amp;rdquo;/g, '"')
          .replace(/&amp;rsquo;/g, "'")
          .replace(/&amp;/g, '&')
      : undefined;
    
    // Get game stats
    const yearPublished = getXMLValue(item, 'yearpublished', 'value');
    const minPlayers = getXMLValue(item, 'minplayers', 'value');
    const maxPlayers = getXMLValue(item, 'maxplayers', 'value');
    const playingTime = getXMLValue(item, 'playingtime', 'value');
    const minPlayTime = getXMLValue(item, 'minplaytime', 'value');
    const maxPlayTime = getXMLValue(item, 'maxplaytime', 'value');
    const minAge = getXMLValue(item, 'minage', 'value');
    
    // Get ratings
    const ratings = item.querySelector('statistics ratings');
    const rating = ratings?.querySelector('average')?.getAttribute('value');
    const weight = ratings?.querySelector('averageweight')?.getAttribute('value');
    
    // Get rank
    const rankElement = ratings?.querySelector('rank[name="boardgame"]');
    const rank = rankElement?.getAttribute('value');
    
    // Get mechanics (boardgamemechanic links)
    const mechanicLinks = item.querySelectorAll('link[type="boardgamemechanic"]');
    const mechanics: string[] = [];
    mechanicLinks.forEach(link => {
      const mechanic = link.getAttribute('value');
      if (mechanic) mechanics.push(mechanic);
    });
    
    // Get categories (boardgamecategory links)
    const categoryLinks = item.querySelectorAll('link[type="boardgamecategory"]');
    const categories: string[] = [];
    categoryLinks.forEach(link => {
      const category = link.getAttribute('value');
      if (category) categories.push(category);
    });
    
    // Get designers (boardgamedesigner links)
    const designerLinks = item.querySelectorAll('link[type="boardgamedesigner"]');
    const designers: string[] = [];
    designerLinks.forEach(link => {
      const designer = link.getAttribute('value');
      if (designer) designers.push(designer);
    });
    
    return {
      id,
      name,
      thumbnail,
      image,
      description: decodedDescription,
      yearPublished: yearPublished ? parseInt(yearPublished) : undefined,
      minPlayers: minPlayers ? parseInt(minPlayers) : undefined,
      maxPlayers: maxPlayers ? parseInt(maxPlayers) : undefined,
      playingTime: playingTime ? parseInt(playingTime) : undefined,
      minPlayTime: minPlayTime ? parseInt(minPlayTime) : undefined,
      maxPlayTime: maxPlayTime ? parseInt(maxPlayTime) : undefined,
      minAge: minAge ? parseInt(minAge) : undefined,
      rating: rating ? parseFloat(rating) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      rank: rank && rank !== 'Not Ranked' ? parseInt(rank) : undefined,
      mechanics: mechanics.length > 0 ? mechanics : undefined,
      categories: categories.length > 0 ? categories : undefined,
      designers: designers.length > 0 ? designers : undefined
    };
  } catch (error) {
    console.error('Error fetching BGG game details:', error);
    return null;
  }
}

// Enrich a game from CSV with BGG data
export async function enrichGameWithBGG(game: Game): Promise<Game> {
  try {
    // Search for the game on BGG
    const searchResults = await searchBGGGames(game.name);
    
    if (searchResults.length === 0) {
      return game;
    }
    
    // Get details for the first match
    const bggDetails = await getBGGGameDetails(searchResults[0].id);
    
    if (!bggDetails) {
      return game;
    }
    
    // Merge BGG data with existing game data
    return {
      ...game,
      image: bggDetails.thumbnail || bggDetails.image || game.image,
      description: bggDetails.description,
      bggId: bggDetails.id,
      bggRating: bggDetails.rating,
      bggRank: bggDetails.rank,
      weight: bggDetails.weight,
      // Use BGG data if CSV data is missing
      yearPublished: game.yearPublished || bggDetails.yearPublished,
      minPlayers: game.minPlayers || bggDetails.minPlayers,
      maxPlayers: game.maxPlayers || bggDetails.maxPlayers,
      playTime: game.playTime || bggDetails.playingTime,
      minAge: game.minAge || bggDetails.minAge
    };
  } catch (error) {
    console.error('Error enriching game with BGG data:', error);
    return game;
  }
}

// Batch enrich games (with rate limiting)
export async function enrichGamesWithBGG(games: Game[], maxGames = 50): Promise<Game[]> {
  const gamesToEnrich = games.slice(0, maxGames);
  const enrichedGames: Game[] = [];
  
  for (const game of gamesToEnrich) {
    const enrichedGame = await enrichGameWithBGG(game);
    enrichedGames.push(enrichedGame);
    
    // Rate limiting - wait 300ms between requests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Return enriched games plus remaining unenriched games
  return [...enrichedGames, ...games.slice(maxGames)];
}

// Quick thumbnail fetch (lighter than full enrichment)
export async function fetchBGGThumbnail(bggId: string): Promise<string | null> {
  // Check cache first
  if (thumbnailCache.has(bggId)) {
    return thumbnailCache.get(bggId) || null;
  }

  return rateLimiter.add(async () => {
    // Double-check cache (might have been added while waiting in queue)
    if (thumbnailCache.has(bggId)) {
      return thumbnailCache.get(bggId) || null;
    }

    try {
      const response = await fetch(
        `${BGG_API_BASE}/thing?id=${bggId}`,
        {
          headers: {
            'Accept': 'application/xml'
          }
        }
      );
      
      if (response.status === 429) {
        console.warn(`Rate limited for game ${bggId}, will retry later...`);
        return null;
      }
      
      if (!response.ok) {
        thumbnailCache.set(bggId, null);
        return null;
      }
      
      const xmlText = await response.text();
      
      // Check if we're in browser or Node.js environment
      let xmlDoc: Document;
      if (typeof window !== 'undefined') {
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      } else {
        thumbnailCache.set(bggId, null);
        return null;
      }
      
      const item = xmlDoc.querySelector('item');
      if (!item) {
        thumbnailCache.set(bggId, null);
        return null;
      }
      
      const thumbnail = getXMLValue(item, 'thumbnail');
      
      // Cache the result
      thumbnailCache.set(bggId, thumbnail || null);
      
      return thumbnail || null;
    } catch (error) {
      console.error('Error fetching BGG thumbnail:', error);
      thumbnailCache.set(bggId, null);
      return null;
    }
  });
}

// Clear thumbnail cache
export function clearThumbnailCache() {
  thumbnailCache.clear();
}

// Get cache size
export function getThumbnailCacheSize() {
  return thumbnailCache.size;
}
