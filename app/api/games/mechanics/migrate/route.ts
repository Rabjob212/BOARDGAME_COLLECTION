import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'mechanics-cache.json');

interface MechanicsCache {
  lastUpdated: string | null;
  mechanics: Record<string, string[]>;
}

// POST: Migrate mechanics data from client localStorage to server
export async function POST(request: Request) {
  try {
    const { mechanics } = await request.json();
    
    if (!mechanics || typeof mechanics !== 'object') {
      return NextResponse.json(
        { error: 'Invalid mechanics data' },
        { status: 400 }
      );
    }

    // Read existing cache
    let cache: MechanicsCache = { lastUpdated: null, mechanics: {} };
    try {
      const data = await fs.readFile(CACHE_FILE, 'utf-8');
      cache = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, use empty cache
    }

    // Merge with existing data (don't overwrite if newer data exists)
    let merged = 0;
    Object.keys(mechanics).forEach(gameId => {
      if (!cache.mechanics[gameId] && mechanics[gameId]) {
        cache.mechanics[gameId] = mechanics[gameId];
        merged++;
      }
    });

    // Update timestamp
    cache.lastUpdated = new Date().toISOString();

    // Save to file
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));

    console.log(`✅ Migrated ${merged} games from localStorage to server cache`);

    return NextResponse.json({
      message: 'Migration successful',
      merged,
      total: Object.keys(cache.mechanics).length,
    });
  } catch (error) {
    console.error('Failed to migrate mechanics cache:', error);
    return NextResponse.json(
      { error: 'Failed to migrate mechanics cache' },
      { status: 500 }
    );
  }
}
