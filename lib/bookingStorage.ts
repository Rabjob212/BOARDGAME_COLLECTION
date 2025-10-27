// Simple file-based booking storage
// In production, you should use a database

import fs from 'fs';
import path from 'path';

export interface StoredBooking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  numberOfPeople: number;
  selectedGames: string[];
  wantDrinks: boolean;
  wantSnacks: boolean;
  startTime: string;
  endTime: string;
  createdAt: string;
  calendarEventId?: string;
}

const BOOKINGS_FILE = path.join(process.cwd(), 'data', 'bookings.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Get all bookings
export function getBookings(): StoredBooking[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(BOOKINGS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading bookings:', error);
    return [];
  }
}

// Add a new booking
export function addBooking(booking: StoredBooking): void {
  try {
    ensureDataDir();
    const bookings = getBookings();
    bookings.push(booking);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
  } catch (error) {
    console.error('Error saving booking:', error);
    throw error;
  }
}

// Get bookings within a date range
export function getBookingsByDateRange(startDate: Date, endDate: Date): StoredBooking[] {
  const bookings = getBookings();
  return bookings.filter(booking => {
    const bookingStart = new Date(booking.startTime);
    const bookingEnd = new Date(booking.endTime);
    return bookingStart < endDate && bookingEnd > startDate;
  });
}

// Delete a booking
export function deleteBooking(id: string): boolean {
  try {
    ensureDataDir();
    const bookings = getBookings();
    const filteredBookings = bookings.filter(b => b.id !== id);
    if (filteredBookings.length === bookings.length) {
      return false; // Booking not found
    }
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(filteredBookings, null, 2));
    return true;
  } catch (error) {
    console.error('Error deleting booking:', error);
    return false;
  }
}

// Delete booking by calendar event ID
export function deleteBookingByCalendarEventId(calendarEventId: string): boolean {
  try {
    ensureDataDir();
    const bookings = getBookings();
    const filteredBookings = bookings.filter(b => b.calendarEventId !== calendarEventId);
    if (filteredBookings.length === bookings.length) {
      return false; // Booking not found
    }
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(filteredBookings, null, 2));
    return true;
  } catch (error) {
    console.error('Error deleting booking by calendar event ID:', error);
    return false;
  }
}

// Sync stored bookings with Google Calendar events
// Removes bookings from storage if their calendar event was deleted
export function syncWithCalendarEvents(calendarEventIds: string[]): number {
  try {
    ensureDataDir();
    const bookings = getBookings();
    
    // Find bookings with calendar event IDs that are no longer in the calendar
    const bookingsToKeep = bookings.filter(booking => {
      // Keep bookings without calendar event IDs (created by non-authenticated users)
      if (!booking.calendarEventId) {
        return true;
      }
      
      // Keep bookings whose calendar events still exist
      return calendarEventIds.includes(booking.calendarEventId);
    });
    
    const deletedCount = bookings.length - bookingsToKeep.length;
    
    if (deletedCount > 0) {
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookingsToKeep, null, 2));
      console.log(`Synced storage: removed ${deletedCount} bookings that were deleted from calendar`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error syncing with calendar events:', error);
    return 0;
  }
}
