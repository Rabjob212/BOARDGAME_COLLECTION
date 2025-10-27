'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, endOfWeek } from 'date-fns';
import { Button } from '@/components/ui/Button';

interface CalendarViewProps {
  onSlotSelect: (start: Date, end: Date) => void;
  refreshTrigger?: number;
}

interface BookedSlot {
  start: string;
  end: string;
  summary: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onSlotSelect, refreshTrigger }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const timeSlots = [
    '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const fetchBookedSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/calendar/availability?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar availability');
      }

      const data = await response.json();
      setBookedSlots(data.bookedSlots || []);
      
      // Show info message if not authenticated
      if (!data.authenticated && data.message) {
        setError(data.message);
      }
    } catch (err: any) {
      console.error('Error fetching booked slots:', err);
      setError(err.message);
      setBookedSlots([]);
    } finally {
      setLoading(false);
    }
  };  useEffect(() => {
    fetchBookedSlots();
  }, [currentWeek, refreshTrigger]);

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleSlotClick = (day: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const start = new Date(day.getTime());
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start.getTime());
    end.setHours(hours + 2, minutes, 0, 0);
    
    onSlotSelect(start, end);
  };

  const isSlotAvailable = (day: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotStart = new Date(day.getTime());
    slotStart.setHours(hours, minutes, 0, 0);
    
    const slotEnd = new Date(slotStart.getTime());
    slotEnd.setHours(hours + 2, minutes, 0, 0);

    for (const booked of bookedSlots) {
      const bookedStart = new Date(booked.start);
      const bookedEnd = new Date(booked.end);

      if (slotStart < bookedEnd && slotEnd > bookedStart) {
        return false;
      }
    }
    
    return true;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
          ← Previous
        </Button>
        <h2 className="text-xl font-bold text-gray-800">
          Week of {format(weekStart, 'MMM d, yyyy')}
        </h2>
        <Button variant="outline" size="sm" onClick={handleNextWeek}>
          Next →
        </Button>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-600">
          Loading calendar availability...
        </div>
      )}

      {error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 text-sm">ℹ️ {error}</p>
        </div>
      )}

      {!loading && (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-sm font-semibold text-gray-600 p-2">Time</div>
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`text-center p-2 rounded ${
                    isSameDay(day, new Date())
                      ? 'bg-blue-100 text-blue-800 font-bold'
                      : 'text-gray-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{format(day, 'EEE')}</div>
                  <div className="text-lg">{format(day, 'd')}</div>
                </div>
              ))}
            </div>

            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-8 gap-2 mb-2">
                <div className="text-sm font-medium text-gray-600 p-2 flex items-center">
                  {time}
                </div>
                {days.map((day) => {
                  const available = isSlotAvailable(day, time);
                  const slotDateTime = new Date(day.getTime());
                  slotDateTime.setHours(parseInt(time.split(':')[0]), 0, 0, 0);
                  const isPast = slotDateTime < new Date();
                  
                  return (
                    <button
                      key={`{day.toISOString()}-{time}`}
                      onClick={() => {
                        if (!isPast && available) {
                          handleSlotClick(day, time);
                        }
                      }}
                      disabled={isPast || !available}
                      className={`
                        p-3 rounded text-sm font-medium transition-all min-h-[44px]
                        ${isPast 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : available
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                          : 'bg-red-100 text-red-800 cursor-not-allowed'
                        }
                      `}
                    >
                      {isPast ? '—' : available ? 'Available' : 'Booked'}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-gray-600">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
          <span className="text-gray-600">Past</span>
        </div>
      </div>
    </div>
  );
};
