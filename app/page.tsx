'use client';

import React, { useEffect, useState } from 'react';
import { BoardGame, GameFilter, SortOption } from '@/types/game';
import { BookingFormData } from '@/types/booking';
import { GameService } from '@/services/gameService';
import { GameFilters } from '@/components/games/GameFilters';
import { GameList } from '@/components/games/GameList';
import { CalendarView } from '@/components/calendar/CalendarView';
import { BookingModal } from '@/components/booking/BookingModal';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const [games, setGames] = useState<BoardGame[]>([]);
  const [filteredGames, setFilteredGames] = useState<BoardGame[]>([]);
  const [displayedGames, setDisplayedGames] = useState<BoardGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'games' | 'calendar'>('games');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | undefined>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);
  const [availableMechanics, setAvailableMechanics] = useState<string[]>([]);
  const GAMES_PER_PAGE = 50;

  useEffect(() => {
    loadGamesWithMechanics();
    checkAuthStatus();
    
    // Check for auth callback
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth');
    if (authStatus === 'success') {
      setIsAuthenticated(true);
      alert('Successfully connected to Google Calendar!');
      // Remove auth param from URL
      window.history.replaceState({}, '', '/');
    } else if (authStatus === 'error') {
      alert('Failed to connect to Google Calendar. Please try again.');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Update displayed games when filtered games or page changes
  useEffect(() => {
    const startIndex = 0;
    const endIndex = currentPage * GAMES_PER_PAGE;
    const gamesToDisplay = filteredGames.slice(startIndex, endIndex);
    setDisplayedGames(gamesToDisplay);
    setHasMore(endIndex < filteredGames.length);
  }, [filteredGames, currentPage]);

  const loadMoreGames = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch (error) {
      console.error('Failed to check auth status:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignIn = () => {
    window.location.href = '/api/auth/signin';
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setIsAuthenticated(false);
      alert('Signed out successfully');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const loadGamesWithMechanics = async () => {
    try {
      setLoading(true);
      
      // Load games from BGG collection
      const loadedGames = await GameService.loadGames();
      
      // Try to load from localStorage first (migration from old system)
      let gamesWithMechanics = loadedGames;
      try {
        const localCache = localStorage.getItem('enrichedGamesData');
        if (localCache) {
          console.log('📦 Found localStorage cache, migrating...');
          const cachedData = JSON.parse(localCache);
          gamesWithMechanics = loadedGames.map(game => {
            const cached = cachedData[game.objectid];
            if (cached?.mechanics) {
              return { ...game, mechanics: cached.mechanics };
            }
            return game;
          });
          
          // Upload to server cache
          const mechanicsMap: Record<string, string[]> = {};
          Object.keys(cachedData).forEach(gameId => {
            if (cachedData[gameId]?.mechanics) {
              mechanicsMap[gameId] = cachedData[gameId].mechanics;
            }
          });
          
          // Send to server (don't await, let it run in background)
          fetch('/api/games/mechanics/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mechanics: mechanicsMap }),
          }).then(() => {
            console.log('✅ LocalStorage cache migrated to server');
            // Clear localStorage after successful migration
            localStorage.removeItem('enrichedGamesData');
          }).catch(err => console.error('Migration failed:', err));
        }
      } catch (error) {
        console.error('Failed to load from localStorage:', error);
      }
      
      // If no localStorage, try server cache
      if (gamesWithMechanics === loadedGames) {
        try {
          const mechanicsResponse = await fetch('/api/games/mechanics');
          const mechanicsData = await mechanicsResponse.json();
          
          console.log('📊 Mechanics cache:', mechanicsData);
          
          // Merge mechanics data with games
          gamesWithMechanics = loadedGames.map(game => {
            const cachedMechanics = mechanicsData.mechanics[game.objectid];
            if (cachedMechanics) {
              return { ...game, mechanics: cachedMechanics };
            }
            return game;
          });
          
          // If cache needs update, trigger background update
          if (mechanicsData.needsUpdate) {
            console.log('⏰ Mechanics cache is old, triggering update...');
            triggerMechanicsUpdate(loadedGames.map(g => g.objectid));
          }
        } catch (error) {
          console.error('Failed to load from server cache:', error);
        }
      }
      
      // Update GameService cache with mechanics-enriched games
      GameService.updateGamesCache(gamesWithMechanics);
      
      setGames(gamesWithMechanics);
      setFilteredGames(gamesWithMechanics);
      setCurrentPage(1);
      
      // Get unique mechanics
      const mechanics = gamesWithMechanics
        .flatMap(g => g.mechanics || [])
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
      
      setAvailableMechanics(mechanics);
      console.log('📊 Available mechanics:', mechanics.length);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerMechanicsUpdate = async (gameIds: string[]) => {
    try {
      // Don't await - let it run in background
      fetch('/api/games/mechanics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameIds }),
      }).then(async (response) => {
        const result = await response.json();
        console.log('✅ Mechanics cache updated in background:', result);
        
        // Optionally reload games to get updated mechanics
        // loadGamesWithMechanics();
      });
    } catch (error) {
      console.error('Failed to trigger mechanics update:', error);
    }
  };

  const handleFilterChange = (filter: GameFilter) => {
    setFilterLoading(true);
    
    // Use setTimeout to allow UI to update with loading state
    setTimeout(() => {
      const filtered = GameService.filterGames(filter);
      setFilteredGames(filtered);
      setCurrentPage(1); // Reset to first page when filtering
      setFilterLoading(false);
    }, 100);
  };

  const handleSortChange = (sortBy: SortOption) => {
    setFilterLoading(true);
    
    // Use setTimeout to allow UI to update with loading state
    setTimeout(() => {
      const sorted = GameService.sortGames(filteredGames, sortBy);
      setFilteredGames(sorted);
      setCurrentPage(1); // Reset to first page when sorting
      setFilterLoading(false);
    }, 100);
  };

  const handleSlotSelect = (start: Date, end: Date) => {
    // Allow booking without authentication
    setSelectedSlot({ start, end });
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (booking: BookingFormData) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create booking');
      }

      const result = await response.json();
      
      alert(`✅ Booking confirmed!\n\n📅 Calendar Event Created\n\nName: ${booking.customerName}\nEmail: ${booking.customerEmail}\nPeople: ${booking.numberOfPeople}\nGames: ${booking.selectedGames.length} selected\nDrinks: ${booking.wantDrinks ? 'Yes' : 'No'}\nSnacks: ${booking.wantSnacks ? 'Yes' : 'No'}\n\nEvent Link: ${result.calendarEventLink || 'Check your Google Calendar'}`);
      
      setIsBookingModalOpen(false);
      
      // Refresh the calendar to show the new booking
      setCalendarRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('Failed to create booking:', error);
      alert(`Failed to create booking: ${error.message}`);
    }
  };

  const checkWholeDayAvailability = async (date: Date): Promise<boolean> => {
    try {
      // Set start of day (10 AM) and end of day (9 PM)
      const dayStart = new Date(date);
      dayStart.setHours(10, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(21, 0, 0, 0);
      
      // Fetch calendar events for this day
      const response = await fetch(
        `/api/calendar/availability?start=${dayStart.toISOString()}&end=${dayEnd.toISOString()}`
      );
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      const bookedSlots = data.bookedSlots || [];
      
      // Check if there are any bookings that overlap with 10 AM - 9 PM
      const hasConflict = bookedSlots.some((slot: any) => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        
        // Check if slot overlaps with the whole day range
        return slotStart < dayEnd && slotEnd > dayStart;
      });
      
      return !hasConflict;
    } catch (error) {
      console.error('Error checking whole day availability:', error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                🎲 Board Game Cafe
              </h1>
              <p className="text-gray-600 mt-2">
                Browse our collection and book your gaming session
              </p>
            </div>
            
            {/* Auth Button - Hidden (auto-auth enabled via .env.local tokens) */}
            {/* 
            <div className="flex items-center gap-3">
              {authLoading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Connected to Google Calendar
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button variant="primary" size="sm" onClick={handleSignIn}>
                  🔗 Connect Google Calendar
                </Button>
              )}
            </div>
            */}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('games')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'games'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Browse Games ({filteredGames.length})
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Book a Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading your BGG collection...</p>
              <p className="mt-2 text-sm text-gray-500">This may take a few moments on first load</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'games' && (
              <div>
                <GameFilters
                  onFilterChange={handleFilterChange}
                  onSortChange={handleSortChange}
                  availableMechanics={availableMechanics}
                />
                
                {filterLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3"></div>
                      <p className="text-gray-600 font-medium">Filtering games...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <GameList games={displayedGames} />
                    
                    {/* Load More Button */}
                    {hasMore && (
                      <div className="text-center py-8">
                        <Button 
                          onClick={loadMoreGames}
                          variant="primary"
                          size="lg"
                        >
                          Load More Games (showing {displayedGames.length} of {filteredGames.length})
                        </Button>
                      </div>
                    )}
                    
                    {!hasMore && displayedGames.length > 0 && (
                      <div className="text-center py-8 text-gray-500">
                        All games loaded ({displayedGames.length} games)
                      </div>
                    )}
                    
                    {displayedGames.length === 0 && (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-4">🎲</div>
                        <p className="text-xl text-gray-600 font-medium mb-2">No games found</p>
                        <p className="text-sm text-gray-500">Try adjusting your filters</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'calendar' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Select Your Time Slot
                  </h2>
                  <p className="text-gray-600">
                    Click on an available slot to book your gaming session
                  </p>
                </div>
                <CalendarView 
                  onSlotSelect={handleSlotSelect} 
                  refreshTrigger={calendarRefreshTrigger}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={handleBookingSubmit}
        games={games}
        selectedSlot={selectedSlot}
        checkWholeDayAvailability={checkWholeDayAvailability}
      />

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600">
            © 2025 Board Game Cafe. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
