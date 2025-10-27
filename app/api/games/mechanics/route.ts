import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getBGGGameDetails } from '@/services/bggService';

const CACHE_FILE = path.join(process.cwd(), 'data', 'mechanics-cache.json');
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface MechanicsCache {
  lastUpdated: string | null;
  mechanics: Record<string, string[]>; // gameId -> mechanics[]
}

async function readCache(): Promise<MechanicsCache> {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { lastUpdated: null, mechanics: {} };
  }
}

async function writeCache(cache: MechanicsCache): Promise<void> {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function needsUpdate(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true;
  const lastUpdateTime = new Date(lastUpdated).getTime();
  const now = Date.now();
  return now - lastUpdateTime > ONE_DAY_MS;
}

// GET: Return cached mechanics data
export async function GET() {
  try {
    const cache = await readCache();
    
    return NextResponse.json({
      mechanics: cache.mechanics,
      lastUpdated: cache.lastUpdated,
      needsUpdate: needsUpdate(cache.lastUpdated),
    });
  } catch (error) {
    console.error('Failed to read mechanics cache:', error);
    return NextResponse.json(
      { error: 'Failed to read mechanics cache' },
      { status: 500 }
    );
  }
}

// POST: Trigger update of mechanics data
export async function POST(request: Request) {
  try {
    const { gameIds } = await request.json();
    
    if (!Array.isArray(gameIds)) {
      return NextResponse.json(
        { error: 'gameIds must be an array' },
        { status: 400 }
      );
    }

    const cache = await readCache();
    
    // Check if we need to update
    if (!needsUpdate(cache.lastUpdated)) {
      return NextResponse.json({
        message: 'Cache is still fresh',
        mechanics: cache.mechanics,
        lastUpdated: cache.lastUpdated,
      });
    }

    console.log(`🔄 Updating mechanics cache for ${gameIds.length} games...`);
    
    let updated = 0;
    let failed = 0;

    // Fetch mechanics for games not in cache or update all if it's been a day
    for (let i = 0; i < gameIds.length; i++) {
      const gameId = gameIds[i];
      
      try {
        // Rate limiting - 600ms between requests
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }

        const bggDetails = await getBGGGameDetails(gameId);
        
        if (bggDetails?.mechanics && bggDetails.mechanics.length > 0) {
          cache.mechanics[gameId] = bggDetails.mechanics;
          updated++;
        }

        // Save progress every 20 games
        if (updated % 20 === 0 && updated > 0) {
          await writeCache(cache);
          console.log(`💾 Progress saved: ${updated}/${gameIds.length}`);
        }
      } catch (error) {
        console.error(`Failed to fetch mechanics for game ${gameId}:`, error);
        failed++;
        // Wait longer on error
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Final save
    cache.lastUpdated = new Date().toISOString();
    await writeCache(cache);

    console.log(`✅ Mechanics cache updated! ${updated} games updated, ${failed} failed`);

    return NextResponse.json({
      message: 'Mechanics cache updated successfully',
      updated,
      failed,
      total: gameIds.length,
      lastUpdated: cache.lastUpdated,
    });
  } catch (error) {
    console.error('Failed to update mechanics cache:', error);
    return NextResponse.json(
      { error: 'Failed to update mechanics cache' },
      { status: 500 }
    );
  }
}
