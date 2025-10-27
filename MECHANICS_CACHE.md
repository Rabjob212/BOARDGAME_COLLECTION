# Mechanics Cache System

## Overview

The mechanics cache system fetches board game mechanics data from BoardGameGeek (BGG) API once per day and stores it server-side. This prevents:
- UI blocking during enrichment
- Repeated API calls on every page load
- Client-side performance issues

## How It Works

### 1. Server-Side Cache
- Mechanics data is stored in `data/mechanics-cache.json`
- Format: `{ lastUpdated: timestamp, mechanics: { gameId: [mechanics...] } }`
- Cache is valid for 24 hours

### 2. Automatic Updates
- On first page load each day, the system checks if cache is older than 24 hours
- If yes, triggers background update via `/api/games/mechanics` POST endpoint
- Update happens in background without blocking the UI
- Progress is saved every 20 games to prevent data loss

### 3. API Endpoints

#### GET `/api/games/mechanics`
Returns current mechanics cache:
```json
{
  "mechanics": {
    "gameId": ["Action Points", "Hand Management", ...]
  },
  "lastUpdated": "2025-10-26T...",
  "needsUpdate": false
}
```

#### POST `/api/games/mechanics`
Triggers cache update with game IDs:
```json
{
  "gameIds": ["174430", "233078", ...]
}
```

Returns update result:
```json
{
  "message": "Mechanics cache updated successfully",
  "updated": 150,
  "failed": 31,
  "total": 181,
  "lastUpdated": "2025-10-26T..."
}
```

## Manual Update

Visit `/admin/mechanics` to:
- View cache status (last updated, number of games)
- Manually trigger cache update
- See update progress and results

## BGG API Rate Limiting

- System respects BGG rate limits: 600ms between requests (~2 req/sec)
- Failed requests wait 2000ms before continuing
- Update process is resilient to failures

## Data Flow

```
User visits site
    ↓
Load games from BGG collection
    ↓
Fetch mechanics from server cache (/api/games/mechanics GET)
    ↓
Merge mechanics with games
    ↓
Display games with mechanics immediately
    ↓
If cache > 24 hours old:
    → Trigger background update (/api/games/mechanics POST)
    → Update runs asynchronously
    → Next visit will have fresh data
```

## Benefits

1. **Fast Loading**: Games display immediately with cached mechanics
2. **No UI Blocking**: Updates happen in background
3. **Persistent Data**: Server-side storage survives page reloads
4. **Automatic Updates**: Once per day, no manual intervention
5. **Resilient**: Saves progress, handles failures gracefully

## File Structure

```
app/
  api/
    games/
      mechanics/
        route.ts          # GET/POST endpoints
  admin/
    mechanics/
      page.tsx            # Admin UI
data/
  mechanics-cache.json    # Server-side cache storage
```
