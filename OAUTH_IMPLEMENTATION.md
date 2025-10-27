# OAuth Authentication Implementation Summary

## ✅ What Was Added

### 1. Authentication Libraries & Configuration

**Files Created:**
- `lib/googleAuth.ts` - OAuth configuration and auth URL generation
- `lib/googleCalendar.ts` - Google Calendar API integration functions
- `.env.local` - Environment variables with your Google credentials

### 2. API Routes

**Authentication Endpoints:**
- `app/api/auth/signin/route.ts` - Redirects to Google OAuth
- `app/api/auth/callback/google/route.ts` - Handles OAuth callback, stores tokens
- `app/api/auth/signout/route.ts` - Clears authentication tokens
- `app/api/auth/status/route.ts` - Checks if user is authenticated

**Updated Calendar/Booking Endpoints:**
- `app/api/bookings/route.ts` - Now creates real Google Calendar events
- `app/api/calendar/availability/route.ts` - Fetches real calendar availability

### 3. Frontend Updates

**Updated `app/page.tsx`:**
- Added authentication state management
- Added "Connect Google Calendar" button in header
- Shows authentication status
- Prevents booking without authentication
- Handles OAuth callback redirect
- Sends bookings to Google Calendar API

### 4. Documentation

- `GOOGLE_CALENDAR_SETUP.md` - Complete setup guide for Google Cloud Console

## 🔐 How OAuth Flow Works

### Step 1: User Clicks "Connect Google Calendar"
```
User clicks button → Redirects to /api/auth/signin
→ Redirects to Google OAuth consent screen
```

### Step 2: User Grants Permission
```
User logs in with rabjob212@gmail.com
→ User grants calendar access permissions
→ Google redirects to /api/auth/callback/google?code=...
```

### Step 3: Exchange Code for Tokens
```
Callback endpoint receives authorization code
→ Exchanges code for access_token and refresh_token
→ Stores tokens in httpOnly cookies (secure)
→ Redirects back to app with success status
```

### Step 4: Make Authenticated Requests
```
User creates booking
→ Frontend sends booking to /api/bookings
→ Backend reads tokens from cookies
→ Uses tokens to call Google Calendar API
→ Creates calendar event
→ Returns success with event link
```

## 🔑 Security Features

1. **HttpOnly Cookies**: Tokens stored in httpOnly cookies (not accessible via JavaScript)
2. **Secure Flag**: Enabled in production for HTTPS only
3. **SameSite**: Set to 'lax' to prevent CSRF attacks
4. **Token Expiry**: Access tokens expire in 1 hour, refresh tokens in 30 days
5. **Environment Variables**: Sensitive data in `.env.local` (not committed to git)

## 📝 Token Storage

**Access Token** (1 hour expiry):
- Cookie name: `google_access_token`
- Used for API calls
- Short-lived for security

**Refresh Token** (30 days expiry):
- Cookie name: `google_refresh_token`
- Used to get new access tokens
- Longer-lived for convenience

## 🎯 Google Calendar Integration Features

### Creating Events (`createCalendarEvent`)
- **Summary**: "Board Game Session - X players"
- **Description**: Formatted booking details
- **Attendees**: Customer email (they get calendar invite)
- **Reminders**: Email (1 day before) + Popup (1 hour before)
- **Timezone**: Asia/Bangkok (adjust as needed)

### Fetching Availability (`getAvailableSlots`)
- Retrieves all events in date range
- Returns booked time slots
- Used to show which slots are unavailable

## 🚀 Next Steps to Complete Setup

1. **Configure Google Cloud Console**:
   - Follow instructions in `GOOGLE_CALENDAR_SETUP.md`
   - Add redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Enable Google Calendar API
   - Configure OAuth consent screen

2. **Restart Development Server**:
   ```bash
   npm run dev
   ```

3. **Test OAuth Flow**:
   - Click "Connect Google Calendar"
   - Sign in with rabjob212@gmail.com
   - Grant permissions
   - Should see "Connected to Google Calendar"

4. **Test Booking Creation**:
   - Go to "Book a Session" tab
   - Click available time slot
   - Fill booking form
   - Submit
   - Check Google Calendar for new event!

## 📊 API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signin` | GET | Start OAuth flow |
| `/api/auth/callback/google` | GET | OAuth callback |
| `/api/auth/signout` | POST | Clear session |
| `/api/auth/status` | GET | Check auth status |
| `/api/bookings` | POST | Create booking + calendar event |
| `/api/calendar/availability` | GET | Get booked slots |

## 🔍 Debugging Tips

### Check Auth Status
```javascript
// In browser console
fetch('/api/auth/status').then(r => r.json()).then(console.log)
```

### Check Tokens (Development Only)
- Tokens are in httpOnly cookies (can't access via JS)
- Check in Browser DevTools → Application → Cookies
- Look for `google_access_token` and `google_refresh_token`

### Common Issues

**401 Unauthorized**:
- User not signed in → Show "Connect Google Calendar" button
- Token expired → Refresh token should auto-renew

**Invalid Grant Error**:
- Refresh token expired → User needs to sign in again
- Revoked access → User needs to re-authorize

**Redirect URI Mismatch**:
- Check Google Cloud Console redirect URI exactly matches
- `http://localhost:3000/api/auth/callback/google`

## 📱 Mobile Considerations

The OAuth flow works on mobile browsers:
1. User clicks "Connect Google Calendar"
2. Opens Google sign-in in same window
3. After auth, redirects back to app
4. Mobile-friendly consent screen

## 🌐 Production Deployment

Before deploying to production:

1. **Update `.env` in hosting platform**:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALENDAR_ID=rabjob212@gmail.com
   ```

2. **Update Google Cloud Console**:
   - Add production redirect URI
   - Add production JavaScript origin
   - Publish OAuth consent screen (optional)

3. **Test thoroughly**:
   - Test OAuth flow on production domain
   - Verify calendar events are created
   - Check token refresh works

## ✨ What Users Will Experience

1. **First Visit**:
   - See "Connect Google Calendar" button
   - Can browse games without auth

2. **Connecting Calendar**:
   - Click connect button
   - Sign in with Google
   - Grant permissions
   - Redirected back with "Connected" status

3. **Making a Booking**:
   - Click time slot in calendar
   - Fill in booking details
   - Submit
   - See success message with calendar link
   - Receive Google Calendar invite via email

4. **Event in Google Calendar**:
   - Shows as regular calendar event
   - Contains all booking details
   - Customer is added as attendee
   - Customer gets email notification

Perfect! The OAuth implementation is complete and ready to use! 🎉
