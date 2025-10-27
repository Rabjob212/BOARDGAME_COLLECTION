'use client';

import React, { useEffect, useState, useRef } from 'react';
import { BoardGame } from '@/types/game';
import { getBGGGameDetails } from '@/services/bggService';

interface AutoBGGEnricherProps {
  games: BoardGame[];
  onGamesEnriched: (enrichedGames: BoardGame[]) => void;
}

export const AutoBGGEnricher: React.FC<AutoBGGEnricherProps> = ({
  games,
  onGamesEnriched,
}) => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enrichedCount, setEnrichedCount] = useState(0);
  const [currentGame, setCurrentGame] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const enrichmentRef = useRef<boolean>(false);
  const pausedRef = useRef<boolean>(false);
  const hasLoadedCacheRef = useRef<boolean>(false);

  useEffect(() => {
    // Load cached enriched games from localStorage only once
    if (hasLoadedCacheRef.current) return;
    hasLoadedCacheRef.current = true;
    
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem('enrichedGamesData');
        if (cached) {
          const cachedData = JSON.parse(cached);
          const enrichedGames = games.map(game => {
            const cachedGame = cachedData[game.objectid];
            if (cachedGame) {
              return { ...game, ...cachedGame };
            }
            return game;
          });
          
          // Count how many games have mechanics
          const withMechanics = enrichedGames.filter(g => g.mechanics && g.mechanics.length > 0);
          setEnrichedCount(withMechanics.length);
          
          if (withMechanics.length > 0) {
            onGamesEnriched(enrichedGames);
          }
        }
      } catch (error) {
        console.error('Failed to load cached enrichment data:', error);
      }
    };

    loadCachedData();
  }, []); // Only run once on mount

  useEffect(() => {
    // Auto-start enrichment when games are loaded - only once
    if (games.length > 0 && !hasStarted && !enrichmentRef.current) {
      const gamesWithoutMechanics = games.filter(g => !g.mechanics || g.mechanics.length === 0);
      if (gamesWithoutMechanics.length > 0) {
        setHasStarted(true);
        // Start enrichment after a short delay
        setTimeout(() => {
          startAutoEnrichment();
        }, 2000);
      }
    }
  }, [games.length]); // Only depend on games.length, not the entire games array

  const startAutoEnrichment = async () => {
    if (enrichmentRef.current) return;
    
    enrichmentRef.current = true;
    setIsEnriching(true);
    pausedRef.current = false;
    setIsPaused(false);

    // Load cached data
    let cachedData: Record<string, any> = {};
    try {
      const cached = localStorage.getItem('enrichedGamesData');
      if (cached) {
        cachedData = JSON.parse(cached);
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }

    const enrichedGames = [...games];
    const gamesToEnrich = games.filter(g => {
      // Skip if already has mechanics or is cached
      return !g.mechanics && !cachedData[g.objectid];
    });

    console.log(`🎲 Starting auto-enrichment for ${gamesToEnrich.length} games...`);

    let enriched = 0;

    for (let i = 0; i < gamesToEnrich.length; i++) {
      // Check if paused
      if (pausedRef.current) {
        console.log('⏸️ Enrichment paused');
        setIsEnriching(false);
        enrichmentRef.current = false;
        return;
      }

      const game = gamesToEnrich[i];
      
      try {
        setCurrentGame(game.objectname);
        
        const bggDetails = await getBGGGameDetails(game.objectid);
        
        if (bggDetails && (bggDetails.mechanics || bggDetails.categories || bggDetails.designers)) {
          // Find and update the game
          const gameIndex = enrichedGames.findIndex(g => g.objectid === game.objectid);
          if (gameIndex !== -1) {
            enrichedGames[gameIndex] = {
              ...enrichedGames[gameIndex],
              mechanics: bggDetails.mechanics,
              categories: bggDetails.categories,
              designers: bggDetails.designers,
              description: bggDetails.description || enrichedGames[gameIndex].description,
              weight: bggDetails.weight,
            };

            // Cache the enrichment data
            cachedData[game.objectid] = {
              mechanics: bggDetails.mechanics,
              categories: bggDetails.categories,
              designers: bggDetails.designers,
              description: bggDetails.description,
              weight: bggDetails.weight,
            };

            enriched++;
            setEnrichedCount(prev => prev + 1);
          }
        }
        
        // Update progress
        setProgress(Math.round(((i + 1) / gamesToEnrich.length) * 100));
        
        // Save to cache periodically (every 5 games)
        if (enriched % 5 === 0 && enriched > 0) {
          try {
            localStorage.setItem('enrichedGamesData', JSON.stringify(cachedData));
            onGamesEnriched([...enrichedGames]); // Create new array to avoid reference issues
          } catch (error) {
            console.error('Failed to save cache:', error);
          }
        }
        
        // Rate limiting - wait 600ms between requests (respects BGG limit of ~2 requests/second)
        await new Promise(resolve => setTimeout(resolve, 600));
        
      } catch (error) {
        console.error(`Failed to enrich ${game.objectname}:`, error);
        // On error, wait longer before continuing
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Final save
    try {
      localStorage.setItem('enrichedGamesData', JSON.stringify(cachedData));
      onGamesEnriched([...enrichedGames]); // Create new array to avoid reference issues
      console.log(`✅ Auto-enrichment complete! Enriched ${enriched} games.`);
    } catch (error) {
      console.error('Failed to save final cache:', error);
    }

    setIsEnriching(false);
    enrichmentRef.current = false;
    setCurrentGame('');
  };

  const handlePause = () => {
    pausedRef.current = true;
    setIsPaused(true);
  };

  const handleResume = () => {
    pausedRef.current = false;
    setIsPaused(false);
    setHasStarted(true);
    startAutoEnrichment();
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear the enrichment cache? This will require re-fetching all BGG data.')) {
      try {
        localStorage.removeItem('enrichedGamesData');
        setEnrichedCount(0);
        setProgress(0);
        alert('Cache cleared successfully!');
        // Reload page to reset
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  };

  const gamesWithoutMechanics = games.filter(g => !g.mechanics || g.mechanics.length === 0).length;

  if (!isEnriching && enrichedCount === games.length) {
    return null; // Hide when all games are enriched
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-bold text-blue-900">
              ⚙️ Auto BGG Enrichment
            </h3>
            {isEnriching && !isPaused && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full animate-pulse">
                Loading...
              </span>
            )}
            {isPaused && (
              <span className="inline-flex items-center px-2 py-1 bg-yellow-600 text-white text-xs font-medium rounded-full">
                Paused
              </span>
            )}
          </div>
          
          <p className="text-sm text-blue-700 mb-3">
            {enrichedCount} of {games.length} games enriched with mechanics data
            {gamesWithoutMechanics > 0 && (
              <span className="font-medium"> · {gamesWithoutMechanics} remaining</span>
            )}
          </p>
          
          {isEnriching && currentGame && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-blue-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-blue-900 min-w-[40px] text-right">{progress}%</span>
              </div>
              <p className="text-xs text-blue-600 truncate">
                🎮 Fetching: {currentGame}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isEnriching && !isPaused && (
            <button
              onClick={handlePause}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              ⏸️ Pause
            </button>
          )}
          
          {isPaused && (
            <button
              onClick={handleResume}
              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              ▶️ Resume
            </button>
          )}
          
          {!isEnriching && (
            <button
              onClick={handleClearCache}
              className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              🗑️ Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
