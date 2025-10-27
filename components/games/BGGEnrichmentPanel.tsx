'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export const BGGEnrichmentPanel: React.FC = () => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState<{
    enriched: number;
    errors: number;
    cached: number;
    total: number;
  } | null>(null);
  const [message, setMessage] = useState<string>('');

  const handleEnrichGames = async (limit: number) => {
    setIsEnriching(true);
    setMessage('Fetching BGG data...');
    
    try {
      const response = await fetch('/api/games/batch-enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        
        if (data.enriched > 0) {
          setMessage(`Successfully enriched ${data.enriched} games! ${data.errors > 0 ? `(${data.errors} errors)` : ''}`);
          
          // Refresh the page to show updated data
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setMessage(data.message || 'All games already enriched!');
        }
      } else {
        setMessage('Failed to enrich games');
      }
    } catch (error) {
      console.error('Error enriching games:', error);
      setMessage('Error occurred while enriching games');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/games/batch-enrich', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setProgress(null);
        setMessage('Cache cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      setMessage('Error clearing cache');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <h3 className="text-lg font-bold text-gray-800">
          📊 BoardGameGeek Data Enrichment
        </h3>
        <p className="text-sm text-gray-600">
          Fetch high-quality images, descriptions, and ratings from BoardGameGeek
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Progress Display */}
          {progress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{progress.enriched}</div>
                  <div className="text-xs text-gray-600">Enriched</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{progress.errors}</div>
                  <div className="text-xs text-gray-600">Errors</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{progress.cached}</div>
                  <div className="text-xs text-gray-600">Cached</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">{progress.total}</div>
                  <div className="text-xs text-gray-600">Total Games</div>
                </div>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes('Error') || message.includes('Failed') 
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleEnrichGames(10)}
              disabled={isEnriching}
              variant="primary"
              size="md"
            >
              {isEnriching ? '⏳ Enriching...' : '🎮 Enrich 10 Games'}
            </Button>
            
            <Button
              onClick={() => handleEnrichGames(20)}
              disabled={isEnriching}
              variant="primary"
              size="md"
            >
              {isEnriching ? '⏳ Enriching...' : '🎮 Enrich 20 Games'}
            </Button>
            
            <Button
              onClick={() => handleEnrichGames(50)}
              disabled={isEnriching}
              variant="primary"
              size="md"
            >
              {isEnriching ? '⏳ Enriching...' : '🎮 Enrich 50 Games'}
            </Button>
            
            <Button
              onClick={handleClearCache}
              disabled={isEnriching}
              variant="secondary"
              size="md"
            >
              🗑️ Clear Cache
            </Button>
          </div>

          {/* Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            <p className="mb-2">
              <strong>ℹ️ How it works:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Fetches game images, descriptions, ratings, and ranks from BoardGameGeek</li>
              <li>Processes games with automatic rate limiting (300ms between requests)</li>
              <li>Data is cached to avoid duplicate requests</li>
              <li>Page will refresh automatically to show updated images</li>
              <li>You can also click "Get BGG Info" on individual game cards</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
