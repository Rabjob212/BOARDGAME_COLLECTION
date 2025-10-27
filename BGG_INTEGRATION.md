# BoardGameGeek (BGG) Integration

This application integrates with the BoardGameGeek XML API2 to enrich game data with high-quality images, descriptions, ratings, and more.

## Features

### 🎮 What Data is Fetched from BGG

- **Images**: High-quality game box art (thumbnail and full-size)
- **Descriptions**: Detailed game descriptions
- **Ratings**: BGG community average ratings (0-10 scale)
- **Rankings**: Overall BGG board game rank
- **Complexity**: Weight/complexity score (1-5 scale)
- **Game Stats**: Player counts, play times, recommended ages

### 🚀 How to Use

#### Option 1: Batch Enrichment (Recommended)

1. Go to the **Browse Games** tab
2. You'll see the **BGG Data Enrichment Panel** at the top
3. Click one of the batch buttons:
   - **Enrich 10 Games** - Quick test (takes ~30 seconds)
   - **Enrich 20 Games** - Good balance (~1 minute)
   - **Enrich 50 Games** - Comprehensive (~2.5 minutes)
4. Wait for the process to complete
5. Page will auto-refresh to show updated images and data

#### Option 2: Individual Game Enrichment

1. Browse your game collection
2. Find games without images (showing "No Image" placeholder)
3. Click the **"Get BGG Info"** button on any game card
4. Data will be fetched and displayed immediately

### 📊 BGG Enrichment Panel

The panel shows:
- **Enriched**: Number of games successfully enriched
- **Errors**: Games that couldn't be found on BGG
- **Cached**: Total games with BGG data in memory
- **Total Games**: Your complete collection size

### 🔄 Caching

- BGG data is cached in server memory during the session
- Prevents duplicate API calls for the same game
- Cache persists until server restart
- Click **"Clear Cache"** to reset and re-fetch data

### ⚡ Rate Limiting

The integration respects BGG's API rate limits:
- **300ms delay** between each game request
- **Automatic retry** on failed requests
- **Error handling** for unavailable games

### 🎯 API Endpoints

#### POST `/api/games/enrich`
Enrich a single game by ID.

**Request:**
```json
{
  "gameId": "174430"
}
```

**Response:**
```json
{
  "id": "174430",
  "name": "Gloomhaven",
  "image": "https://cf.geekdo-images.com/...",
  "description": "Gloomhaven is a game of...",
  "bggRating": 8.7,
  "bggRank": 1,
  "weight": 3.86,
  ...
}
```

#### POST `/api/games/batch-enrich`
Batch enrich multiple games.

**Request:**
```json
{
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "enriched": 18,
  "errors": 2,
  "cached": 18,
  "total": 170,
  "games": [...]
}
```

#### GET `/api/games/batch-enrich`
Get cache status.

**Response:**
```json
{
  "cached": 18,
  "cacheKeys": ["174430", "167791", ...]
}
```

#### DELETE `/api/games/batch-enrich`
Clear the cache.

**Response:**
```json
{
  "message": "Cache cleared",
  "cached": 0
}
```

### 🎨 Visual Enhancements

Games enriched with BGG data display:
- **High-quality box art** instead of placeholder images
- **BGG rank badge** (orange badge in top-right corner)
- **Dual ratings**: CSV rating + BGG community rating
- **Game descriptions** (when expanded)

### 📝 Implementation Details

#### Files Added/Modified:

1. **`services/bggService.ts`**
   - Core BGG API integration
   - XML parsing for game data
   - Rate limiting and error handling

2. **`app/api/games/enrich/route.ts`**
   - Single game enrichment endpoint

3. **`app/api/games/batch-enrich/route.ts`**
   - Batch processing with caching
   - Progress tracking

4. **`components/games/BGGEnrichmentPanel.tsx`**
   - UI for batch enrichment
   - Progress display
   - Cache management

5. **`components/games/GameCard.tsx`**
   - Enhanced to show BGG data
   - Individual "Get BGG Info" button
   - Rank badges

6. **`types/game.ts`**
   - Added `Game` interface
   - BGG enrichment fields

### 🔍 Troubleshooting

**Games not found on BGG:**
- Some games may have different names on BGG
- Expansions might not match standalone entries
- Very new or obscure games may not be in BGG database

**Slow enrichment:**
- Each game takes ~300ms to fetch (BGG rate limiting)
- 20 games = ~1 minute
- This is normal and prevents API blocking

**Images not loading:**
- BGG images are served from `cf.geekdo-images.com`
- Check browser console for CORS or network errors
- Some games might not have images on BGG

**Cache issues:**
- Click "Clear Cache" and try again
- Restart dev server to reset server-side cache

### 🌐 BGG API Documentation

- **Official Docs**: https://boardgamegeek.com/wiki/page/BGG_XML_API2
- **API Base URL**: https://boardgamegeek.com/xmlapi2
- **Rate Limits**: ~1-2 requests per second recommended
- **Data Format**: XML responses

### ⚠️ Important Notes

- BGG API is free but has rate limits
- Don't spam requests (use batch processing responsibly)
- Cache is in-memory and resets on server restart
- Future enhancement: Persistent storage (database/file system)

### 🚧 Future Enhancements

Potential improvements:
- [ ] Persistent cache (database or local storage)
- [ ] Background job for automatic enrichment
- [ ] Manual game name matching for mismatches
- [ ] Image fallback chain (BGG → CSV → placeholder)
- [ ] Export enriched collection to CSV
- [ ] BGG user collection import
