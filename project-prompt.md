# Board Game Booking System - Project Prompt

## Project Overview
Create a modern, responsive web application for a board game cafe/store booking system that allows customers to browse available games, view calendar availability, and book gaming sessions with integrated Google Calendar functionality.

## Core Requirements

### 1. Game Library Management
- **Data Source**: Parse and display board games from the provided CSV file (`collection.csv`)
- **Game Information Display**:
  - Game name (`objectname`)
  - Player count (`minplayers` - `maxplayers`)
  - Playing time (`playingtime` or `minplaytime` - `maxplaytime`)
  - Recommended age (`bggrecagerange`)
  - Complexity/weight (`avgweight`)
  - Game image (use `imageid` to construct BGG image URLs)
  - Game description/rating (`rating`, `average`)
- **Game Browsing Features**:
  - Search functionality by game name
  - Filter by player count, playing time, complexity
  - Sort by popularity, rating, alphabetical
  - Grid/card layout for mobile responsiveness

### 2. Calendar Integration & Booking System
- **Google Calendar Integration**:
  - Connect to Google Calendar API using account: `rabjob212@gmail.com`
  - Display available time slots from the connected calendar
  - Show calendar in weekly/daily view similar to Google Calendar interface
  - Real-time availability checking
- **Booking Interface**:
  - Click on available time slots to initiate booking
  - Booking modal/popup with the following fields:
    1. **Number of People**: Input field (1-12 players)
    2. **Preferred Games**: Multi-select dropdown from available game collection
    3. **Refreshments**: Checkbox options for drinks and snacks
  - **Booking Confirmation**: 
    - Send booking details to Google Calendar
    - Create calendar event with all booking information
    - Include customer details, game preferences, refreshment requests

### 3. User Interface & Experience
- **Responsive Design**:
  - Mobile-first approach
  - Optimized for both mobile phones and desktop
  - Touch-friendly interface for mobile users
  - Adaptive layouts for different screen sizes
- **Modern UI/UX**:
  - Clean, professional design
  - Intuitive navigation
  - Loading states and error handling
  - Confirmation messages for successful bookings

## Technical Specifications

### Frontend Framework
- **Recommended**: React with TypeScript
- **Alternative Options**: Vue.js, Next.js, or vanilla JavaScript
- **Styling**: CSS-in-JS (styled-components), Tailwind CSS, or modern CSS

### Backend Requirements
- **CSV Processing**: Parser for the board game collection data
- **Google Calendar API Integration**:
  - OAuth 2.0 authentication for calendar access
  - Calendar events creation and reading
  - Error handling for API failures
- **API Endpoints**:
  - GET `/api/games` - Retrieve game collection
  - GET `/api/calendar/availability` - Get available time slots
  - POST `/api/bookings` - Create new booking
  - GET `/api/bookings/:id` - Retrieve booking details

### Key Features Implementation

#### Game Collection Processing
```javascript
// Expected CSV columns to utilize:
- objectname (Game title)
- minplayers, maxplayers (Player count range)
- playingtime, minplaytime, maxplaytime (Duration)
- bggrecagerange (Age recommendation)
- avgweight (Complexity rating)
- rating, average (Game ratings)
- yearpublished (Publication year)
```

#### Google Calendar Integration
- **Calendar ID**: Primary calendar for `rabjob212@gmail.com`
- **Event Creation**: Include booking details in event description
- **Event Format**:
  ```
  Title: Board Game Session - [Number of People] players
  Description: 
  - Games: [Selected Games]
  - Players: [Number of People]
  - Refreshments: [Yes/No + Details]
  - Booking ID: [Unique ID]
  ```

#### Booking Flow
1. **Browse Games**: User explores available games with filters
2. **View Calendar**: User sees available time slots in calendar view
3. **Select Slot**: User clicks on available time slot
4. **Fill Details**: Modal opens with booking form
5. **Submit Booking**: System validates and creates calendar event
6. **Confirmation**: User receives booking confirmation

### Mobile Responsiveness Requirements
- **Breakpoints**:
  - Mobile: 320px - 768px
  - Tablet: 768px - 1024px
  - Desktop: 1024px+
- **Mobile Optimizations**:
  - Touch-friendly button sizes (minimum 44px)
  - Swipe gestures for calendar navigation
  - Collapsible filters and menus
  - Optimized form inputs for mobile keyboards

### Data Management
- **Game Data**: Process CSV on application load or build time
- **Caching**: Implement caching for game data and calendar events
- **State Management**: Use React Context, Redux, or Zustand for state management

## Development Environment Setup
- **Package Manager**: npm or yarn
- **Build Tool**: Vite, Create React App, or Next.js
- **Environment Variables**:
  - Google Calendar API credentials
  - Application configuration
- **Development Server**: Hot reload for development

## Deployment Considerations
- **Hosting**: Vercel, Netlify, or traditional hosting
- **Environment**: Production environment variables
- **SSL**: HTTPS required for Google Calendar API
- **Domain**: Custom domain recommended for professional appearance

## Success Criteria
1. **Functional Requirements**:
   - ✅ Display complete game collection from CSV
   - ✅ Real-time calendar integration with Google Calendar
   - ✅ Successful booking creation and calendar event generation
   - ✅ Mobile and desktop responsive design
   
2. **User Experience**:
   - ✅ Intuitive game browsing and filtering
   - ✅ Seamless booking process (< 3 steps)
   - ✅ Clear visual feedback for all actions
   - ✅ Error handling and user guidance

3. **Technical Requirements**:
   - ✅ Fast loading times (< 3 seconds)
   - ✅ Cross-browser compatibility
   - ✅ Mobile performance optimization
   - ✅ Secure API integration

## Additional Features (Optional Enhancements)
- **User Authentication**: Allow repeat customers to save preferences
- **Booking History**: View past bookings
- **Email Notifications**: Send confirmation emails
- **Payment Integration**: Online payment processing
- **Game Recommendations**: AI-powered game suggestions
- **Multi-language Support**: Internationalization
- **Admin Panel**: Manage games and bookings
- **Real-time Updates**: WebSocket for live calendar updates

---

**Note**: This prompt provides a comprehensive foundation for building a professional board game booking system. The developer should prioritize core functionality first, then implement optional enhancements based on time and requirements.