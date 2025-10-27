'use client';

import React, { useState, useEffect } from 'react';
import { GameFilter, SortOption } from '@/types/game';
import { Button } from '@/components/ui/Button';

interface GameFiltersProps {
  onFilterChange: (filter: GameFilter) => void;
  onSortChange: (sort: SortOption) => void;
  availableMechanics?: string[];
}

export const GameFilters: React.FC<GameFiltersProps> = ({
  onFilterChange,
  onSortChange,
  availableMechanics = [],
}) => {
  const [search, setSearch] = useState('');
  const [minPlayers, setMinPlayers] = useState<number | undefined>();
  const [maxPlayers, setMaxPlayers] = useState<number | undefined>();
  const [maxPlaytime, setMaxPlaytime] = useState<number | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [subtype, setSubtype] = useState<string | undefined>();
  const [selectedMechanics, setSelectedMechanics] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [showMechanicsDropdown, setShowMechanicsDropdown] = useState(false);

  const handleFilterChange = () => {
    onFilterChange({
      search,
      minPlayers,
      maxPlayers,
      maxPlaytime,
      minRating,
      subtype,
      mechanics: selectedMechanics.length > 0 ? selectedMechanics : undefined,
    });
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    onSortChange(value);
  };

  const handleReset = () => {
    setSearch('');
    setMinPlayers(undefined);
    setMaxPlayers(undefined);
    setMaxPlaytime(undefined);
    setMinRating(undefined);
    setSubtype(undefined);
    setSelectedMechanics([]);
    onFilterChange({
      search: '',
    });
  };

  const toggleMechanic = (mechanic: string) => {
    setSelectedMechanics(prev => {
      if (prev.includes(mechanic)) {
        return prev.filter(m => m !== mechanic);
      } else {
        return [...prev, mechanic];
      }
    });
  };

  const removeMechanic = (mechanic: string) => {
    setSelectedMechanics(prev => prev.filter(m => m !== mechanic));
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleFilterChange();
    }, 300);

    return () => clearTimeout(debounce);
  }, [search, minPlayers, maxPlayers, maxPlaytime, minRating, subtype, selectedMechanics]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort */}
        <div className="w-full md:w-48">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Name (A-Z)</option>
            <option value="rating">Rating (High-Low)</option>
            <option value="players">Players (High-Low)</option>
            <option value="playtime">Playtime (Low-High)</option>
          </select>
        </div>

        {/* Toggle Filters Button (Mobile) */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden"
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 ${showFilters || 'hidden md:grid'}`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtype
          </label>
          <select
            value={subtype || ''}
            onChange={(e) => setSubtype(e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="boardgame">Base Game</option>
            <option value="boardgameexpansion">Expansion</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Players
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={minPlayers || ''}
            onChange={(e) => setMinPlayers(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Any"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Players
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={maxPlayers || ''}
            onChange={(e) => setMaxPlayers(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Any"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Playtime (min)
          </label>
          <input
            type="number"
            min="15"
            step="15"
            value={maxPlaytime || ''}
            onChange={(e) => setMaxPlaytime(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Any"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Rating
          </label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={minRating || ''}
            onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Any"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Mechanics Filter */}
      <div className={`mt-4 ${showFilters || 'hidden md:block'}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ⚙️ Game Mechanics {availableMechanics.length > 0 ? `(${availableMechanics.length} available)` : '(No mechanics data loaded)'}
        </label>
        
        {availableMechanics.length > 0 ? (
          <>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMechanicsDropdown(!showMechanicsDropdown)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
              >
                <span className="text-gray-700">
                  {selectedMechanics.length === 0 
                    ? 'Select mechanics...' 
                    : `${selectedMechanics.length} mechanic${selectedMechanics.length !== 1 ? 's' : ''} selected`}
                </span>
                <svg className={`w-5 h-5 transition-transform ${showMechanicsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMechanicsDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {availableMechanics.map((mechanic) => (
                    <label
                      key={mechanic}
                      className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMechanics.includes(mechanic)}
                        onChange={() => toggleMechanic(mechanic)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{mechanic}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Mechanics Tags */}
            {selectedMechanics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedMechanics.map((mechanic) => (
                  <span
                    key={mechanic}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {mechanic}
                    <button
                      type="button"
                      onClick={() => removeMechanic(mechanic)}
                      className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="mb-2">💡 <strong>Mechanics filter requires BGG enrichment</strong></p>
            <p className="text-xs">Games need to be enriched with BoardGameGeek data to filter by mechanics. Scroll down to find the BGG Enrichment Panel to load mechanics data.</p>
          </div>
        )}
      </div>

      {(search || minPlayers || maxPlayers || maxPlaytime || minRating || subtype || selectedMechanics.length > 0) && (
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};
