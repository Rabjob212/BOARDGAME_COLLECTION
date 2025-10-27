# Board Game Booking System

A modern, responsive web application for booking board game sessions with Google Calendar integration.

## Features

- 📚 **Game Library**: Browse 170+ board games from your collection
- 🔍 **Advanced Filtering**: Search and filter by player count, playtime, rating
- 📅 **Calendar View**: Visual weekly calendar for booking sessions
- 🎯 **Smart Booking**: Select games, specify group size, and request refreshments
- 📱 **Responsive Design**: Optimized for mobile and desktop
- 🔗 **Google Calendar Integration**: (Coming soon) Sync bookings with Google Calendar

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file (optional for Google Calendar integration):
```bash
cp .env.local.example .env.local
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Browse Games
- Use the **Browse Games** tab to explore your board game collection
- Search by name or filter by:
  - Number of players
  - Maximum playtime
  - Minimum rating
- Sort games by name, rating, player count, or playtime

### Book a Session
1. Click the **Book a Session** tab
2. Navigate through the weekly calendar
3. Click on an available time slot (green)
4. Fill in the booking form:
   - Your contact information
   - Number of people attending
   - Select one or more games to play
   - Choose refreshments (drinks/snacks)
5. Confirm your booking

## Google Calendar Integration (Setup Required)

To enable Google Calendar integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials
5. Add your credentials to `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALENDAR_ID=rabjob212@gmail.com
```

## Project Structure

```
boardgame-booking/
├── app/
│   ├── api/              # API routes
│   ├── page.tsx          # Main page
│   └── layout.tsx        # Root layout
├── components/
│   ├── booking/          # Booking components
│   ├── calendar/         # Calendar components
│   ├── games/            # Game library components
│   └── ui/               # Reusable UI components
├── services/
│   └── gameService.ts    # Game data management
├── types/
│   ├── booking.ts        # Booking type definitions
│   └── game.ts           # Game type definitions
└── public/
    └── collection.csv    # Board game collection data
```

## Technologies

- Next.js 14+ with TypeScript
- Tailwind CSS
- PapaParse (CSV parsing)
- date-fns (Date handling)
- Google Calendar API

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
