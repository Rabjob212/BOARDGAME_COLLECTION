import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/googleCalendar';
import { GameService } from '@/services/gameService';
import { addBooking, StoredBooking } from '@/lib/bookingStorage';
import { getStoredTokens } from '@/lib/envTokenStorage';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const booking = await request.json();
    
    // Always use stored tokens from .env.local (server-side authentication)
    const storedTokens = getStoredTokens();
    const accessToken = storedTokens.accessToken;
    const refreshToken = storedTokens.refreshToken;
    console.log('📝 Using stored tokens from .env.local for calendar booking');

    // Load ALL games - try BGG first, fallback to CSV
    console.log('🎮 Loading games for booking...');
    const csvPath = path.join(process.cwd(), 'public', 'collection.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    await GameService.loadGames(csvContent);

    // Get game names from IDs with better error handling
    const gamesList = booking.selectedGames
      .map((id: string) => {
        const game = GameService.getGameById(id);
        if (!game) {
          console.warn('⚠️ Game not found for ID:', id);
          return `Unknown Game (ID: ${id})`;
        }
        console.log('✅ Found game:', id, '→', game.objectname);
        return game.objectname;
      });

    console.log('📝 Game names for calendar:', gamesList);

    // Create event description
    const description = `
Board Game Booking
━━━━━━━━━━━━━━━━━━

👤 Customer: ${booking.customerName}
📧 Email: ${booking.customerEmail}
${booking.customerPhone ? `📱 Phone: ${booking.customerPhone}` : ''}

👥 Number of People: ${booking.numberOfPeople}

🎲 Games Selected:
${gamesList.map((name: string) => `  • ${name}`).join('\n')}

🍽️ Refreshments:
${booking.wantDrinks ? '✓ Drinks' : '✗ Drinks'}
${booking.wantSnacks ? '✓ Snacks' : '✗ Snacks'}

━━━━━━━━━━━━━━━━━━
Booking ID: booking_${Date.now()}
    `.trim();

    // Create Google Calendar event using server tokens
    let calendarEvent = null;
    console.log('🔐 Creating Google Calendar event with server authentication...');
    
    if (accessToken && refreshToken) {
      try {
        calendarEvent = await createCalendarEvent(
          accessToken,
          refreshToken,
          {
            summary: `Board Game Session - ${booking.numberOfPeople} players`,
            description,
            start: new Date(booking.startTime),
            end: new Date(booking.endTime),
            attendees: [booking.customerEmail],
          }
        );
        console.log('✅ Google Calendar event created:', calendarEvent?.id);
      } catch (error) {
        console.error('❌ Failed to create calendar event:', error);
        throw new Error('Failed to create calendar event. Please contact the cafe.');
      }
    } else {
      throw new Error('Server authentication not configured. Please contact the cafe.');
    }

    const response = {
      id: `booking_${Date.now()}`,
      ...booking,
      calendarEventId: calendarEvent?.id || null,
      calendarEventLink: calendarEvent?.htmlLink || null,
      createdAt: new Date().toISOString(),
      calendarCreated: !!calendarEvent,
    };

    // Save booking to storage (for all users to see)
    const storedBooking: StoredBooking = {
      id: response.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      numberOfPeople: booking.numberOfPeople,
      selectedGames: booking.selectedGames,
      wantDrinks: booking.wantDrinks,
      wantSnacks: booking.wantSnacks,
      startTime: booking.startTime,
      endTime: booking.endTime,
      createdAt: response.createdAt,
      calendarEventId: response.calendarEventId || undefined,
    };
    
    addBooking(storedBooking);

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    
    return NextResponse.json(
      { error: 'Failed to create booking', details: error?.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Fetch bookings from Google Calendar
    const mockBookings: any[] = [];
    
    return NextResponse.json({ bookings: mockBookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
