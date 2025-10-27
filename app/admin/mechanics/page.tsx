'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function AdminMechanicsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cacheInfo, setCacheInfo] = useState<any>(null);

  const loadCacheInfo = async () => {
    try {
      const response = await fetch('/api/games/mechanics');
      const data = await response.json();
      setCacheInfo(data);
    } catch (error) {
      console.error('Failed to load cache info:', error);
    }
  };

  const triggerUpdate = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // First, get the list of game IDs
      const gamesResponse = await fetch('/api/games');
      if (!gamesResponse.ok) {
        // If no games API, we'll need to load from the collection
        throw new Error('Games API not found');
      }
      
      const games = await gamesResponse.json();
      const gameIds = games.map((g: any) => g.objectid || g.id);
      
      // Trigger the update
      const response = await fetch('/api/games/mechanics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameIds }),
      });
      
      const data = await response.json();
      setResult(data);
      
      // Reload cache info
      await loadCacheInfo();
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadCacheInfo();
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Mechanics Cache Management</h1>
          
          {cacheInfo && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h2 className="font-semibold mb-2">Cache Status</h2>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Last Updated:</span>{' '}
                  {cacheInfo.lastUpdated 
                    ? new Date(cacheInfo.lastUpdated).toLocaleString()
                    : 'Never'}
                </p>
                <p>
                  <span className="font-medium">Games in Cache:</span>{' '}
                  {Object.keys(cacheInfo.mechanics || {}).length}
                </p>
                <p>
                  <span className="font-medium">Needs Update:</span>{' '}
                  {cacheInfo.needsUpdate ? (
                    <span className="text-orange-600 font-medium">Yes (older than 24 hours)</span>
                  ) : (
                    <span className="text-green-600 font-medium">No (cache is fresh)</span>
                  )}
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Click the button below to manually trigger a mechanics cache update. 
              This will fetch mechanics data from BGG for all games in your collection.
            </p>
            
            <Button
              onClick={triggerUpdate}
              disabled={loading}
              variant="primary"
              size="lg"
            >
              {loading ? 'Updating... (This may take several minutes)' : 'Update Mechanics Cache'}
            </Button>
            
            {loading && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-blue-900 font-medium">
                  Fetching mechanics data from BGG... This will take several minutes.
                </p>
              </div>
            )}
            
            {result && (
              <div className={`p-4 rounded-lg ${
                result.error ? 'bg-red-50 text-red-900' : 'bg-green-50 text-green-900'
              }`}>
                <h3 className="font-semibold mb-2">
                  {result.error ? 'Error' : 'Success'}
                </h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <h2 className="font-semibold mb-2">How it works:</h2>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Mechanics data is cached server-side in <code className="bg-gray-100 px-1 rounded">data/mechanics-cache.json</code></li>
              <li>Cache is automatically updated once every 24 hours when users visit the site</li>
              <li>Updates happen in the background without blocking the UI</li>
              <li>BGG API rate limit is respected (600ms between requests)</li>
              <li>Progress is saved every 20 games to prevent data loss</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
