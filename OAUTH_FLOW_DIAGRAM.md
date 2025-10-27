# OAuth Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OAUTH AUTHENTICATION FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: User Initiates Authentication
═══════════════════════════════════════════════════════════════════════════════

    User's Browser                    Your App                    Google
    ─────────────                    ─────────                   ──────
         │                                │                          │
         │  1. Click "Connect Google      │                          │
         │     Calendar" Button           │                          │
         ├───────────────────────────────>│                          │
         │                                │                          │
         │  2. GET /api/auth/signin       │                          │
         │<───────────────────────────────┤                          │
         │                                │                          │
         │  3. Redirect to Google OAuth   │                          │
         ├────────────────────────────────┼─────────────────────────>│
         │                                │                          │
                                                                      
STEP 2: User Grants Permission
═══════════════════════════════════════════════════════════════════════════════

         │                                │                          │
         │  4. Show Sign-In Page          │                          │
         │<─────────────────────────────────────────────────────────┤
         │                                │                          │
         │  5. User Logs In               │                          │
         │     - Email: rabjob212@gmail.com                          │
         │     - Grants calendar access   │                          │
         ├─────────────────────────────────────────────────────────>│
         │                                │                          │

STEP 3: Exchange Code for Tokens
═══════════════════════════════════════════════════════════════════════════════

         │                                │                          │
         │  6. Redirect with auth code    │                          │
         │  /api/auth/callback/google     │                          │
         │    ?code=abc123...             │                          │
         ├───────────────────────────────>│                          │
         │                                │                          │
         │                                │  7. Exchange code        │
         │                                │     for tokens           │
         │                                ├─────────────────────────>│
         │                                │                          │
         │                                │  8. Return tokens        │
         │                                │<─────────────────────────┤
         │                                │     access_token         │
         │                                │     refresh_token        │
         │                                │                          │
         │                                │  9. Store in httpOnly    │
         │                                │     cookies              │
         │                                │  ┌─────────────────┐    │
         │                                │  │ google_access_  │    │
         │                                │  │    token        │    │
         │                                │  │ google_refresh_ │    │
         │                                │  │    token        │    │
         │                                │  └─────────────────┘    │
         │                                │                          │
         │  10. Redirect to /?auth=success                           │
         │<───────────────────────────────┤                          │
         │                                │                          │

STEP 4: User Creates Booking
═══════════════════════════════════════════════════════════════════════════════

         │                                │                          │
         │  11. Click time slot           │                          │
         │      Fill booking form         │                          │
         │      Submit                    │                          │
         ├───────────────────────────────>│                          │
         │  POST /api/bookings            │                          │
         │  (cookies sent automatically)  │                          │
         │                                │                          │
         │                                │  12. Read tokens from    │
         │                                │      cookies             │
         │                                │  ┌─────────────────┐    │
         │                                │  │ Extract tokens  │    │
         │                                │  └─────────────────┘    │
         │                                │                          │
         │                                │  13. Create calendar     │
         │                                │      event               │
         │                                ├─────────────────────────>│
         │                                │  Authorization: Bearer   │
         │                                │    {access_token}        │
         │                                │                          │
         │                                │  14. Event created       │
         │                                │<─────────────────────────┤
         │                                │  {                       │
         │                                │    id: "event123",       │
         │                                │    htmlLink: "https://...│
         │                                │  }                       │
         │                                │                          │
         │  15. Booking confirmation      │                          │
         │      with calendar link        │                          │
         │<───────────────────────────────┤                          │
         │                                │                          │
         │  16. Customer receives         │                          │
         │      calendar invite via email │                          │
         │<─────────────────────────────────────────────────────────┤
         │                                │                          │


═══════════════════════════════════════════════════════════════════════════════
TOKEN LIFECYCLE
═══════════════════════════════════════════════════════════════════════════════

Access Token (1 hour expiry)
├─ Used for every API call to Google Calendar
├─ Stored in httpOnly cookie
├─ Automatically sent with requests
└─ If expired → Use refresh token to get new one

Refresh Token (30 days expiry)
├─ Used to get new access tokens
├─ Stored in httpOnly cookie
├─ Longer lived
└─ If expired → User must re-authenticate


═══════════════════════════════════════════════════════════════════════════════
SECURITY FEATURES
═══════════════════════════════════════════════════════════════════════════════

✓ HttpOnly Cookies     → Prevents XSS attacks (JS can't access tokens)
✓ SameSite=Lax        → Prevents CSRF attacks
✓ Secure in Production → HTTPS only
✓ Short-lived Access   → 1 hour expiry minimizes risk
✓ OAuth 2.0           → Industry standard authentication
✓ Scoped Permissions  → Only calendar access, not full account


═══════════════════════════════════════════════════════════════════════════════
API ENDPOINTS
═══════════════════════════════════════════════════════════════════════════════

GET  /api/auth/signin              → Redirect to Google OAuth
GET  /api/auth/callback/google     → Handle OAuth callback, store tokens
POST /api/auth/signout             → Clear authentication cookies
GET  /api/auth/status              → Check if user is authenticated

POST /api/bookings                 → Create booking + calendar event
GET  /api/calendar/availability    → Get booked time slots


═══════════════════════════════════════════════════════════════════════════════
CALENDAR EVENT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

{
  "summary": "Board Game Session - 4 players",
  "description": "
    Board Game Booking
    ━━━━━━━━━━━━━━━━━━
    
    👤 Customer: John Doe
    📧 Email: john@example.com
    📱 Phone: +1234567890
    
    👥 Number of People: 4
    
    🎲 Games Selected:
    Catan, Ticket to Ride, Pandemic
    
    🍽️ Refreshments:
    ✓ Drinks
    ✓ Snacks
    
    ━━━━━━━━━━━━━━━━━━
    Booking ID: booking_1234567890
  ",
  "start": {
    "dateTime": "2025-10-25T14:00:00Z",
    "timeZone": "Asia/Bangkok"
  },
  "end": {
    "dateTime": "2025-10-25T16:00:00Z",
    "timeZone": "Asia/Bangkok"
  },
  "attendees": [
    { "email": "john@example.com" }
  ],
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "email", "minutes": 1440 },  // 1 day before
      { "method": "popup", "minutes": 60 }     // 1 hour before
    ]
  }
}

═══════════════════════════════════════════════════════════════════════════════
```
