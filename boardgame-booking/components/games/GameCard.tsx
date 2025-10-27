'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BoardGame } from '@/types/game';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { GameService } from '@/services/gameService';
import { Button } from '@/components/ui/Button';
import { fetchBGGThumbnail } from '@/services/bggService';

interface GameCardProps {
  game: BoardGame;
  onClick?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  const router = useRouter();
  const [isLoadingBGG, setIsLoadingBGG] = useState(false);
  const [bggData, setBggData] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(true);

  // Debug log to check if mechanics are being passed
  useEffect(() => {
    if (game.mechanics && game.mechanics.length > 0) {
      console.log(`Game ${game.objectname} has mechanics:`, game.mechanics);
    }
  }, [game.mechanics]);

  // Load image on mount
  useEffect(() => {
    loadGameImage();
  }, [game.objectid]);

  const loadGameImage = async () => {
    // Use existing image if available
    if (game.image || game.thumbnail) {
      setImageUrl(game.image || game.thumbnail || '');
      setImageLoading(false);
      return;
    }

    // Check localStorage cache first
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`bgg_thumb_${game.objectid}`);
      if (cached) {
        setImageUrl(cached);
        setImageLoading(false);
        game.thumbnail = cached;
        game.image = cached;
        return;
      }
    }

    // Check CSV imageid
    const csvImage = GameService.getGameImageUrl(game.imageid);
    if (csvImage) {
      setImageUrl(csvImage);
      setImageLoading(false);
      return;
    }

    // Fetch from BGG in background
    if (game.objectid) {
      setImageLoading(true);
      const thumbnail = await fetchBGGThumbnail(game.objectid);
      if (thumbnail) {
        setImageUrl(thumbnail);
        game.thumbnail = thumbnail;
        game.image = thumbnail;
        
        // Cache in localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`bgg_thumb_${game.objectid}`, thumbnail);
          } catch (e) {
            // localStorage might be full, ignore
          }
        }
      }
      setImageLoading(false);
    }
  };

  const playerRange = `${game.minplayers}-${game.maxplayers} players`;
  const playtime = game.playingtime ? `${game.playingtime} min` : 'N/A';
  const rating = game.average ? parseFloat(game.average).toFixed(1) : 'N/A';
  
  const bggRating = bggData?.bggRating || game.bggRating;
  const bggRank = bggData?.bggRank || game.bggRank;
  const description = bggData?.description || game.description;

  const fetchBGGData = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingBGG(true);
    
    try {
      const response = await fetch('/api/games/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: game.objectid }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setBggData(data);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Error fetching BGG data:', error);
    } finally {
      setIsLoadingBGG(false);
    }
  };

  const handleCardClick = (e?: React.MouseEvent) => {
    console.log('Card clicked!', game.objectname, game.objectid);
    console.log('onClick prop:', onClick);
    console.log('Will navigate to:', `/game/${game.objectid}`);
    
    if (onClick) {
      console.log('Calling onClick prop instead of routing');
      onClick();
    } else {
      console.log('Calling router.push...');
      router.push(`/game/${game.objectid}`);
      console.log('Router.push called');
    }
  };

  return (
    <Card onClick={handleCardClick} className="h-full flex flex-col">
      <div className="relative w-full h-48 bg-gray-200">
        {imageLoading ? (
          <div className="w-full h-full animate-pulse bg-gradient-to-br from-gray-200 to-gray-300">
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400">
                <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          </div>
        ) : imageUrl && imageUrl !== '/placeholder-game.png' ? (
          <Image
            src={imageUrl}
            alt={game.objectname}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center">
              <div className="text-4xl mb-2">🎲</div>
              <div className="text-xs">No Image</div>
            </div>
          </div>
        )}
        
        {/* BGG Rank Badge */}
        {bggRank && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            #{bggRank}
          </div>
        )}
      </div>
      
      <CardHeader>
        <h3 className="font-bold text-lg line-clamp-2 text-gray-800">
          {game.objectname}
        </h3>
      </CardHeader>

      <CardContent className="flex-grow">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold">👥</span>
            <span>{playerRange}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">⏱️</span>
            <span>{playtime}</span>
          </div>
          {game.bggrecagerange && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">🎂</span>
              <span>{game.bggrecagerange}+</span>
            </div>
          )}
          
          {/* Game Mechanics */}
          {game.mechanics && game.mechanics.length > 0 ? (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600 text-xs">⚙️</span>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1">
                    {game.mechanics.slice(0, 3).map((mechanic, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {mechanic}
                      </span>
                    ))}
                    {game.mechanics.length > 3 && (
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        +{game.mechanics.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>⚙️</span>
                <span>No mechanics data</span>
              </div>
            </div>
          )}
          
          {/* Show description if available */}
          {showDetails && description && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-600 line-clamp-3">
                {description}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">⭐</span>
                <span className="font-bold text-gray-800">{rating}</span>
              </div>
              {bggRating && (
                <div className="flex items-center gap-1 text-xs text-orange-600">
                  <span>BGG:</span>
                  <span className="font-bold">{bggRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {game.yearpublished && (
              <span className="text-sm text-gray-500">{game.yearpublished}</span>
            )}
          </div>
          
          {/* BGG Fetch Button */}
          {!bggData && !game.image && (
            <Button
              onClick={fetchBGGData}
              disabled={isLoadingBGG}
              variant="secondary"
              size="sm"
              className="w-full text-xs"
            >
              {isLoadingBGG ? 'Loading BGG Data...' : 'Get BGG Info'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
