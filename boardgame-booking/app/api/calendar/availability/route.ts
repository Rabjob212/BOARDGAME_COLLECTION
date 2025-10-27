import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '@/lib/googleCalendar';
import { getBookingsByDateRange, syncWithCalendarEvents } from '@/lib/bookingStorage';
import { getStoredTokens } from '@/lib/envTokenStorage';

export async function GET(request: NextRequest) {
  try {
    // Always use stored tokens from .env.local (server-side authentication)
    const storedTokens = getStoredTokens();
    const accessToken = storedTokens.accessToken;
    const refreshToken = storedTokens.refreshToken;

    const searchParams = request.nextUrl.searchParams;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const startDate = startParam ? new Date(startParam) : new Date();
    const endDate = endParam 
      ? new Date(endParam) 
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Get stored bookings (visible to everyone)
    const storedBookings = getBookingsByDateRange(startDate, endDate);
    const storedSlots = storedBookings.map(booking => ({
      start: booking.startTime,
      end: booking.endTime,
      summary: `Board Game Session - ${booking.customerName}`,
    }));

    // If server tokens not configured, return only stored bookings
    if (!accessToken || !refreshToken) {
      console.warn('⚠️ Server authentication not configured');
      return NextResponse.json({ 
        authenticated: false,
        bookedSlots: storedSlots,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        message: 'Server authentication not configured'
      });
    }

    // Get Google Calendar events and merge with stored bookings
    const events = await getAvailableSlots(
      accessToken,
      refreshToken,
      startDate,
      endDate
    );

    // Sync: Remove stored bookings if their calendar events were deleted
    const calendarEventIds = events
      .map((event: any) => event.id)
      .filter((id: string | undefined) => id !== undefined) as string[];
    
    syncWithCalendarEvents(calendarEventIds);
    
    // Re-fetch stored bookings after sync
    const syncedStoredBookings = getBookingsByDateRange(startDate, endDate);
    const syncedStoredSlots = syncedStoredBookings.map(booking => ({
      start: booking.startTime,
      end: booking.endTime,
      summary: `Board Game Session - ${booking.customerName}`,
    }));

    // Transform events to a more usable format
    const calendarSlots = events.map((event: any) => ({
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      summary: event.summary,
    }));

    // Merge calendar events with stored bookings (avoid duplicates by checking IDs)
    const allSlots = [...syncedStoredSlots, ...calendarSlots];

    return NextResponse.json({ 
      authenticated: true,
      bookedSlots: allSlots,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching calendar availability:', error);
    
    if (error?.code === 401 || error?.message?.includes('invalid_grant')) {
      // Return stored bookings instead of error
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const storedBookings = getBookingsByDateRange(startDate, endDate);
      const storedSlots = storedBookings.map(booking => ({
        start: booking.startTime,
        end: booking.endTime,
        summary: `Board Game Session - ${booking.customerName}`,
      }));
      
      return NextResponse.json({ 
        authenticated: false,
        bookedSlots: storedSlots,
        message: 'Session expired. Please sign in again.'
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch availability', details: error?.message },
      { status: 500 }
    );
  }
}
