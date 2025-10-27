'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { BoardGame } from '@/types/game';
import { GameService } from '@/services/gameService';
import { getBGGGameDetails } from '@/services/bggService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface BGGDetails {
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

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
}

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [game, setGame] = useState<BoardGame | null>(null);
  const [bggDetails, setBggDetails] = useState<BGGDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [bggLoading, setBggLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [youtubeVideo, setYoutubeVideo] = useState<YouTubeVideo | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);

  useEffect(() => {
    loadGameData();
  }, [gameId]);

  const searchYouTubeVideo = async (gameName: string) => {
    try {
      setYoutubeLoading(true);
      const searchQuery = encodeURIComponent(`${gameName} how to play`);
      
      console.log('🔍 Searching YouTube for:', `${gameName} how to play`);
      
      const response = await fetch(`/api/youtube/search?q=${searchQuery}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Found YouTube video:', data);
        setYoutubeVideo({
          id: data.id,
          title: data.title,
          thumbnail: data.thumbnail
        });
      } else {
        console.log('❌ No YouTube video found');
        setYoutubeVideo(null);
      }
    } catch (error) {
      console.error('Error searching YouTube:', error);
      setYoutubeVideo(null);
    } finally {
      setYoutubeLoading(false);
    }
  };

  const loadGameData = async () => {
    try {
      setLoading(true);
      
      // Load all games first
      await GameService.loadGames();
      
      // Then get the specific game from GameService
      const foundGame = GameService.getGameById(gameId);
      
      if (!foundGame) {
        console.error('Game not found:', gameId);
        setLoading(false);
        return;
      }

      setGame(foundGame);
      
      // Set initial image
      if (foundGame.image || foundGame.thumbnail) {
        setImageUrl(foundGame.image || foundGame.thumbnail || '');
      }

      // Load BGG details
      if (foundGame.objectid) {
        setBggLoading(true);
        const details = await getBGGGameDetails(foundGame.objectid);
        if (details) {
          setBggDetails(details);
          // Use higher quality image from BGG
          if (details.image) {
            setImageUrl(details.image);
          }
          // Search for YouTube video
          searchYouTubeVideo(details.name || foundGame.objectname);
        }
        setBggLoading(false);
      } else {
        // Search for YouTube video with game name
        searchYouTubeVideo(foundGame.objectname);
      }
    } catch (error) {
      console.error('Error loading game data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Game Not Found</h1>
          <Button onClick={() => router.push('/')}>Back to Games</Button>
        </div>
      </div>
    );
  }

  const displayData = {
    name: bggDetails?.name || game.objectname,
    yearPublished: bggDetails?.yearPublished || (game.yearpublished ? parseInt(game.yearpublished) : undefined),
    minPlayers: bggDetails?.minPlayers || (game.minplayers ? parseInt(game.minplayers) : undefined),
    maxPlayers: bggDetails?.maxPlayers || (game.maxplayers ? parseInt(game.maxplayers) : undefined),
    playingTime: bggDetails?.playingTime || (game.playingtime ? parseInt(game.playingtime) : undefined),
    minPlayTime: bggDetails?.minPlayTime || (game.minplaytime ? parseInt(game.minplaytime) : undefined),
    maxPlayTime: bggDetails?.maxPlayTime || (game.maxplaytime ? parseInt(game.maxplaytime) : undefined),
    minAge: bggDetails?.minAge || (game.bggrecagerange ? parseInt(game.bggrecagerange) : undefined),
    rating: bggDetails?.rating || (game.average ? parseFloat(game.average) : undefined),
    weight: bggDetails?.weight || (game.avgweight ? parseFloat(game.avgweight) : undefined),
    rank: bggDetails?.rank || game.bggRank,
    description: bggDetails?.description || game.description,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/')}
            className="mb-0"
          >
            ← Back to Games
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image and Quick Stats */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              {/* Game Image */}
              <div className="relative w-full aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-lg overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={displayData.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎲</div>
                      <div className="text-sm">No Image Available</div>
                    </div>
                  </div>
                )}
                
                {/* Rank Badge */}
                {displayData.rank && (
                  <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg">
                    <div className="text-xs font-semibold">BGG RANK</div>
                    <div className="text-2xl font-bold">#{displayData.rank}</div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-blue-600">
                      {displayData.rating ? displayData.rating.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Rating</div>
                  </div>
                  <div className="w-px h-12 bg-gray-200"></div>
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-purple-600">
                      {displayData.weight ? displayData.weight.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Weight</div>
                  </div>
                </div>

                {/* External Link */}
                {game.objectid && (
                  <a
                    href={`https://boardgamegeek.com/boardgame/${game.objectid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button variant="primary" size="sm" className="w-full">
                      View on BoardGameGeek ↗
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Section */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-4xl font-bold text-gray-900">
                  {displayData.name}
                </h1>
                {displayData.yearPublished && (
                  <span className="text-2xl font-semibold text-gray-500 ml-4">
                    ({displayData.yearPublished})
                  </span>
                )}
              </div>
              {game.itemtype && (
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {game.itemtype === 'boardgameexpansion' ? '📦 Expansion' : '🎲 Base Game'}
                </div>
              )}
            </div>

            {/* Game Stats Grid */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Game Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {/* Players */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-2xl">👥</span>
                      <span className="text-sm font-semibold">Players</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {displayData.minPlayers && displayData.maxPlayers
                        ? `${displayData.minPlayers}-${displayData.maxPlayers}`
                        : 'N/A'}
                    </div>
                  </div>

                  {/* Playing Time */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-2xl">⏱️</span>
                      <span className="text-sm font-semibold">Playing Time</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {displayData.playingTime ? `${displayData.playingTime} min` : 'N/A'}
                    </div>
                    {displayData.minPlayTime && displayData.maxPlayTime && 
                     displayData.minPlayTime !== displayData.maxPlayTime && (
                      <div className="text-xs text-gray-500">
                        {displayData.minPlayTime}-{displayData.maxPlayTime} min
                      </div>
                    )}
                  </div>

                  {/* Age */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-2xl">🎂</span>
                      <span className="text-sm font-semibold">Min Age</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {displayData.minAge ? `${displayData.minAge}+` : 'N/A'}
                    </div>
                  </div>

                  {/* Language Dependence */}
                  {game.bgglanguagedependence && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-2xl">🗣️</span>
                        <span className="text-sm font-semibold">Language</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        Level {game.bgglanguagedependence}
                      </div>
                    </div>
                  )}

                  {/* Ownership */}
                  {game.own === '1' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-2xl">✅</span>
                        <span className="text-sm font-semibold">Status</span>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        In Collection
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Mechanics, Categories, and Designers */}
            {bggDetails && (bggDetails.mechanics || bggDetails.categories || bggDetails.designers) && (
              <Card>
                <div className="p-6 space-y-6">
                  {/* Mechanics */}
                  {bggDetails.mechanics && bggDetails.mechanics.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>⚙️</span>
                        Mechanics
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {bggDetails.mechanics.map((mechanic, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                          >
                            {mechanic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  {bggDetails.categories && bggDetails.categories.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>🏷️</span>
                        Categories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {bggDetails.categories.map((category, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Designers */}
                  {bggDetails.designers && bggDetails.designers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>👨‍🎨</span>
                        Designers
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {bggDetails.designers.map((designer, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200"
                          >
                            {designer}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Description */}
            {displayData.description && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Description</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {displayData.description}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Loading BGG Data Indicator */}
            {bggLoading && (
              <Card>
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-600 text-sm">Loading detailed information from BoardGameGeek...</p>
                </div>
              </Card>
            )}

            {/* Ratings Breakdown */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Ratings & Complexity</h2>
                <div className="space-y-4">
                  {/* Rating Bar */}
                  {displayData.rating && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Average Rating</span>
                        <span className="text-lg font-bold text-blue-600">
                          {displayData.rating.toFixed(2)} / 10
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${(displayData.rating / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Weight/Complexity Bar */}
                  {displayData.weight && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Complexity</span>
                        <span className="text-lg font-bold text-purple-600">
                          {displayData.weight.toFixed(2)} / 5
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-purple-600 h-3 rounded-full transition-all"
                          style={{ width: `${(displayData.weight / 5) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Light</span>
                        <span>Medium</span>
                        <span>Heavy</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* How to Play Video */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🎥</span>
                  How to Play
                </h2>
                
                {youtubeLoading ? (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-gray-600 text-sm">Searching for tutorial video...</p>
                    </div>
                  </div>
                ) : youtubeVideo ? (
                  <div className="space-y-3">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${youtubeVideo.id}`}
                        title={youtubeVideo.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    </div>
                    <p className="text-sm text-gray-600">{youtubeVideo.title}</p>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📹</div>
                      <p className="text-sm font-medium">No content now</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
