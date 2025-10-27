'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BoardGame } from '@/types/game';
import { BookingFormData } from '@/types/booking';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (booking: BookingFormData) => void;
  games: BoardGame[];
  selectedSlot?: { start: Date; end: Date };
  checkWholeDayAvailability?: (date: Date) => Promise<boolean>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  games,
  selectedSlot,
  checkWholeDayAvailability,
}) => {
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    numberOfPeople: 2,
    selectedGames: [],
    wantDrinks: false,
    wantSnacks: false,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });
  
  const [isWholeDay, setIsWholeDay] = useState(false);
  const [wholeDayAvailable, setWholeDayAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [gameSearchQuery, setGameSearchQuery] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if whole day is available when modal opens
  React.useEffect(() => {
    const checkAvailability = async () => {
      if (selectedSlot && checkWholeDayAvailability) {
        setCheckingAvailability(true);
        const available = await checkWholeDayAvailability(selectedSlot.start);
        setWholeDayAvailable(available);
        setCheckingAvailability(false);
      }
    };
    
    if (isOpen) {
      checkAvailability();
      setIsWholeDay(false); // Reset when modal opens
      setGameSearchQuery(''); // Reset search when modal opens
    }
  }, [isOpen, selectedSlot, checkWholeDayAvailability]);

  // Filter games based on search query
  const filteredGames = React.useMemo(() => {
    if (!gameSearchQuery.trim()) {
      return games;
    }
    
    const query = gameSearchQuery.toLowerCase();
    return games.filter(game => 
      game.objectname.toLowerCase().includes(query)
    );
  }, [games, gameSearchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    if (!formData.customerName?.trim()) {
      newErrors.customerName = 'Name is required';
    }

    if (!formData.customerEmail?.trim()) {
      newErrors.customerEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Invalid email format';
    }

    if (!formData.numberOfPeople || formData.numberOfPeople < 1) {
      newErrors.numberOfPeople = 'Number of people must be at least 1';
    }

    if (formData.selectedGames?.length === 0) {
      newErrors.selectedGames = 'Please select at least one game';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (selectedSlot) {
      let startTime = selectedSlot.start;
      let endTime = selectedSlot.end;
      
      // If whole day is selected, override times
      if (isWholeDay) {
        const date = new Date(selectedSlot.start);
        startTime = new Date(date);
        startTime.setHours(10, 0, 0, 0); // 10:00 AM
        
        endTime = new Date(date);
        endTime.setHours(21, 0, 0, 0); // 9:00 PM
      }
      
      onSubmit({
        ...formData,
        startTime,
        endTime,
      } as BookingFormData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      numberOfPeople: 2,
      selectedGames: [],
      wantDrinks: false,
      wantSnacks: false,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
    });
    setErrors({});
    setIsWholeDay(false);
    setWholeDayAvailable(null);
    onClose();
  };

  const handleGameToggle = (gameId: string) => {
    const currentGames = formData.selectedGames || [];
    const newGames = currentGames.includes(gameId)
      ? currentGames.filter((id) => id !== gameId)
      : [...currentGames, gameId];
    
    setFormData({ ...formData, selectedGames: newGames });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Book Your Gaming Session">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-800">Your Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.customerName || ''}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customerName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your name"
            />
            {errors.customerName && (
              <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.customerEmail || ''}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customerEmail ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your.email@example.com"
            />
            {errors.customerEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={formData.customerPhone || ''}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your phone number"
            />
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-800">Booking Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of People *
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.numberOfPeople || ''}
              onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) })}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.numberOfPeople ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.numberOfPeople && (
              <p className="text-red-500 text-sm mt-1">{errors.numberOfPeople}</p>
            )}
          </div>

          {selectedSlot && (
            <>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Time Slot:</strong>{' '}
                  {isWholeDay 
                    ? `Whole Day (10:00 AM - 8:00 PM)`
                    : `${selectedSlot.start.toLocaleString()} - ${selectedSlot.end.toLocaleTimeString()}`
                  }
                </p>
              </div>
              
              {/* Whole Day Checkbox */}
              <div className="space-y-2">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isWholeDay}
                    onChange={(e) => setIsWholeDay(e.target.checked)}
                    disabled={!wholeDayAvailable || checkingAvailability}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">
                      📅 Book Whole Day (10:00 AM - 8:00 PM)
                    </span>
                    {checkingAvailability && (
                      <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
                    )}
                    {!checkingAvailability && wholeDayAvailable === false && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Whole day booking not available - some time slots are already booked
                      </p>
                    )}
                    {!checkingAvailability && wholeDayAvailable === true && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Whole day is available for booking
                      </p>
                    )}
                  </div>
                </label>
                <p className="text-xs text-gray-500 ml-7">
                  * Whole day option is only available if the entire day (10:00 AM - 8:00 PM) has no other bookings
                </p>
              </div>
            </>
          )}
        </div>

        {/* Game Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Games * (Choose one or more)
            </label>
            
            {/* Search Input */}
            <div className="mb-3">
              <input
                type="text"
                value={gameSearchQuery}
                onChange={(e) => setGameSearchQuery(e.target.value)}
                placeholder="🔍 Search games by name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {gameSearchQuery && (
                <p className="text-xs text-gray-500 mt-1">
                  Found {filteredGames.length} game{filteredGames.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
              {filteredGames.length > 0 ? (
                filteredGames.map((game) => (
                  <label
                    key={game.objectid}
                    className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedGames?.includes(game.objectid) || false}
                      onChange={() => handleGameToggle(game.objectid)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        {game.objectname}
                      </span>
                      <p className="text-xs text-gray-500">
                        {game.minplayers}-{game.maxplayers} players • {game.playingtime} min
                      </p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No games found matching "{gameSearchQuery}"
                </p>
              )}
            </div>
            {errors.selectedGames && (
              <p className="text-red-500 text-sm mt-1">{errors.selectedGames}</p>
            )}
          </div>
        </div>

        {/* Refreshments */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-800">Refreshments</h3>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.wantDrinks || false}
                onChange={(e) => setFormData({ ...formData, wantDrinks: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-900">🥤 Drinks</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.wantSnacks || false}
                onChange={(e) => setFormData({ ...formData, wantSnacks: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-900">🍿 Snacks</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Confirm Booking
          </Button>
        </div>
      </form>
    </Modal>
  );
};
