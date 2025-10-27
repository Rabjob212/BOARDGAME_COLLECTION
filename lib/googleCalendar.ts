import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    : 'http://localhost:3000/api/auth/callback/google'
);

export async function exchangeCodeForTokens(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}

export function getCalendarClient(accessToken: string, refreshToken?: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function getAvailableSlots(
  accessToken: string,
  refreshToken: string,
  startDate: Date,
  endDate: Date
) {
  const calendar = getCalendarClient(accessToken, refreshToken);
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventDetails: {
    summary: string;
    description: string;
    start: Date;
    end: Date;
    attendees?: string[];
  }
) {
  const calendar = getCalendarClient(accessToken, refreshToken);
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  try {
    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.start.toISOString(),
        timeZone: 'Asia/Bangkok', // Adjust to your timezone
      },
      end: {
        dateTime: eventDetails.end.toISOString(),
        timeZone: 'Asia/Bangkok',
      },
      attendees: eventDetails.attendees?.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}
