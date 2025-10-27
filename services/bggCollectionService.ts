import { BoardGame } from '@/types/game';

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';
const BGG_USERNAME = 'tanawat212';

interface BGGCollectionItem {
  objectid: string;
  name: string;
  yearpublished?: string;
  thumbnail?: string;
  image?: string;
  minplayers?: string;
  maxplayers?: string;
  playingtime?: string;
  minplaytime?: string;
  maxplaytime?: string;
  stats?: {
    rating?: string;
    average?: string;
    rank?: string;
  };
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

// Helper to get attribute from element
function getAttr(element: Element, attribute: string): string | undefined {
  return element.getAttribute(attribute) || undefined;
}

// Fetch user's collection from BGG
export async function fetchBGGCollection(username: string = BGG_USERNAME): Promise<BoardGame[]> {
  try {
    console.log(`Fetching BGG collection for user: ${username}`);
    
    // Request collection with stats
    const url = `${BGG_API_BASE}/collection?username=${encodeURIComponent(username)}&own=1&stats=1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`BGG API returned ${response.status}`);
    }
    
    const xmlText = await response.text();
    
    // Check if we're in browser
    if (typeof window === 'undefined') {
      throw new Error('BGG collection fetch must be done client-side');
    }
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for errors
    const errorElement = xmlDoc.querySelector('error');
    if (errorElement) {
      const message = errorElement.querySelector('message')?.textContent || 'Unknown error';
      throw new Error(`BGG API Error: ${message}`);
    }
    
    // Check if collection is still being processed
    const itemsElement = xmlDoc.querySelector('items');
    if (!itemsElement) {
      throw new Error('No items found in collection');
    }
    
    const items = xmlDoc.querySelectorAll('item');
    const games: BoardGame[] = [];
    
    items.forEach((item) => {
      const objectid = getAttr(item, 'objectid') || '';
      const subtype = getAttr(item, 'subtype') || '';
      
      // Process all item types (boardgame, boardgameexpansion, etc.)
      // if (subtype !== 'boardgame') return;
      
      const name = getXMLValue(item, 'name');
      if (!name || !objectid) return;
      
      // Get stats
      const stats = item.querySelector('stats');
      const rating = stats?.querySelector('rating');
      const average = rating?.querySelector('average')?.getAttribute('value') || '0';
      const ranks = rating?.querySelectorAll('rank');
      let rank = '';
      
      // Get boardgame rank
      ranks?.forEach(r => {
        if (r.getAttribute('name') === 'boardgame') {
          rank = r.getAttribute('value') || '';
        }
      });
      
      // Get other details
      const yearpublished = getXMLValue(item, 'yearpublished');
      const thumbnail = getXMLValue(item, 'thumbnail');
      const image = getXMLValue(item, 'image');
      
      const minplayers = stats?.getAttribute('minplayers') || '';
      const maxplayers = stats?.getAttribute('maxplayers') || '';
      const playingtime = stats?.getAttribute('playingtime') || '';
      const minplaytime = stats?.getAttribute('minplaytime') || '';
      const maxplaytime = stats?.getAttribute('maxplaytime') || '';
      
      // Convert to BoardGame format
      const boardGame: BoardGame = {
        objectid,
        objectname: name,
        itemtype: subtype || 'boardgame', // Use actual subtype from BGG
        yearpublished: yearpublished || '',
        thumbnail,
        image,
        minplayers: minplayers || '1',
        maxplayers: maxplayers || '4',
        playingtime: playingtime || '60',
        minplaytime: minplaytime || playingtime || '30',
        maxplaytime: maxplaytime || playingtime || '120',
        average,
        rating: average,
        avgweight: '',
        bggrecagerange: '',
        imageid: '',
        bgglanguagedependence: '',
        own: '1',
        bggRank: rank && rank !== 'Not Ranked' ? parseInt(rank) : undefined,
      };
      
      games.push(boardGame);
    });
    
    console.log(`Fetched ${games.length} games from BGG collection`);
    return games;
    
  } catch (error) {
    console.error('Error fetching BGG collection:', error);
    throw error;
  }
}

// Check collection status (BGG sometimes queues collection requests)
export async function checkCollectionStatus(username: string = BGG_USERNAME): Promise<'ready' | 'processing' | 'error'> {
  try {
    const url = `${BGG_API_BASE}/collection?username=${encodeURIComponent(username)}&own=1`;
    const response = await fetch(url);
    
    if (response.status === 202) {
      return 'processing';
    }
    
    if (!response.ok) {
      return 'error';
    }
    
    const xmlText = await response.text();
    
    if (typeof window === 'undefined') {
      return 'error';
    }
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const errorElement = xmlDoc.querySelector('error');
    if (errorElement) {
      return 'error';
    }
    
    const message = xmlDoc.querySelector('message');
    if (message?.textContent?.includes('queued')) {
      return 'processing';
    }
    
    return 'ready';
  } catch (error) {
    console.error('Error checking collection status:', error);
    return 'error';
  }
}

// Retry fetching collection with exponential backoff
export async function fetchBGGCollectionWithRetry(
  username: string = BGG_USERNAME,
  maxRetries: number = 5,
  initialDelay: number = 2000
): Promise<BoardGame[]> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const status = await checkCollectionStatus(username);
      
      if (status === 'ready') {
        return await fetchBGGCollection(username);
      }
      
      if (status === 'processing') {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Collection is being processed. Waiting ${delay}ms before retry ${i + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw new Error('Collection fetch failed');
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} failed. Waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries reached');
}
