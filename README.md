# Board Game Collection & Booking System

A modern web application for managing board game collections and booking gaming sessions, built with Next.js 16, TypeScript, and integrated with BoardGameGeek API and Google Calendar.

## 🎮 Features

- **BGG Collection Integration**: Automatically fetch and display your BoardGameGeek collection
- **Game Browsing**: Search, filter, and sort through 181+ board games
- **Mechanics Filtering**: Filter games by mechanics (worker placement, deck building, etc.)
- **Game Details**: View detailed information including mechanics, categories, designers, and player counts
- **YouTube Integration**: Watch "How to Play" videos directly in the app
- **Public Booking System**: Book gaming sessions without requiring login
- **Google Calendar Sync**: All bookings automatically sync to a shared Google Calendar
- **Server-side Mechanics Caching**: Fast performance with cached game mechanics data

## 📁 Project Structure

```
boardgame-booking/          # Main Next.js application
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/                    # Utility libraries
├── services/              # API services (BGG, YouTube)
├── types/                 # TypeScript type definitions
└── data/                  # JSON data storage
```

## 🚀 Getting Started

Navigate to the `boardgame-booking/` directory for the full application:

```bash
cd boardgame-booking
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## 📚 Documentation

See the [`boardgame-booking/`](./boardgame-booking/) directory for:
- [Quick Start Guide](./boardgame-booking/QUICK_START.md)
- [Google Calendar Setup](./boardgame-booking/GOOGLE_CALENDAR_SETUP.md)
- [BGG Integration Details](./boardgame-booking/BGG_INTEGRATION.md)
- [Mechanics Cache System](./boardgame-booking/MECHANICS_CACHE.md)

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router & Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **APIs**: 
  - BoardGameGeek XML API2
  - Google Calendar API
  - YouTube Data API v3

## 📝 License

MIT

---

**Made with ❤️ for board game enthusiasts**
