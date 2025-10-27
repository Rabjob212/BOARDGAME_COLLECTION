'use client';

import React from 'react';
import { BoardGame } from '@/types/game';
import { GameCard } from './GameCard';

interface GameListProps {
  games: BoardGame[];
  onGameSelect?: (game: BoardGame) => void;
}

export const GameList: React.FC<GameListProps> = ({ games, onGameSelect }) => {
  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No games found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {games.map((game, index) => (
        <GameCard
          key={`${game.objectid}-${index}`}
          game={game}
          onClick={onGameSelect ? () => onGameSelect(game) : undefined}
        />
      ))}
    </div>
  );
};
