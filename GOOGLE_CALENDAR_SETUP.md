# Google Calendar OAuth Setup Guide

This guide will help you set up Google Calendar integration for the Board Game Booking System.

## Prerequisites

You already have Google Calendar API credentials in `.env.local`. Now you need to configure them in Google Cloud Console.

## Step-by-Step Setup

### 1. Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (rabjob212@gmail.com)
3. Select your project or create a new one

### 2. Enable Google Calendar API

1. In the left sidebar, click **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (or Internal if using Google Workspace)
3. Click **Create**
4. Fill in the required information:
   - **App name**: Board Game Booking System
   - **User support email**: rabjob212@gmail.com
   - **Developer contact**: rabjob212@gmail.com
5. Click **Save and Continue**
6. On the **Scopes** page, click **Add or Remove Scopes**
7. Add these scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
8. Click **Update** and then **Save and Continue**
9. Add test users (optional during development):
   - Add rabjob212@gmail.com
10. Click **Save and Continue**

### 4. Configure OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Find your existing OAuth 2.0 Client ID or click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. **Name**: Board Game Booking App
5. **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - Add your production domain when ready (e.g., `https://yourdomain.com`)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - Add production URI when ready (e.g., `https://yourdomain.com/api/auth/callback/google`)
7. Click **Create**
8. You should see your Client ID and Client Secret (these match what's in your `.env.local`)

### 5. Verify Your Configuration

Your `.env.local` file should already have:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALENDAR_ID=your-email@gmail.com
NEXTAUTH_URL=http://localhost:3000
```

## Testing the Integration

1. **Restart your development server** if it's running:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Open the app**: Navigate to http://localhost:3000

3. **Connect Google Calendar**:
   - Click the "Connect Google Calendar" button in the header
   - You'll be redirected to Google's OAuth consent screen
   - Sign in with rabjob212@gmail.com
   - Grant the app permission to access your calendar
   - You'll be redirected back to the app

4. **Test Booking**:
   - Go to the "Book a Session" tab
   - Click on an available (green) time slot
   - Fill in the booking form
   - Submit the booking
   - Check your Google Calendar for the new event!

## Troubleshooting

### "Access Blocked: This app isn't verified"

This happens during development. Solutions:
- Click "Advanced" > "Go to Board Game Booking System (unsafe)"
- Or publish your app in Google Cloud Console (for production)
- Or add yourself as a test user in OAuth consent screen

### "Redirect URI mismatch"

- Ensure the redirect URI in Google Cloud Console exactly matches:
  `http://localhost:3000/api/auth/callback/google`
- No trailing slashes
- Check for http vs https

### "Invalid client"

- Double-check your Client ID and Client Secret in `.env.local`
- Make sure they match what's in Google Cloud Console
- Restart your development server after changing `.env.local`

### Calendar events not showing

- Make sure you've granted calendar permissions
- Check that GOOGLE_CALENDAR_ID is set to your email
- Look for errors in the browser console (F12)

## Security Notes

### Development
- `.env.local` is in `.gitignore` - never commit it to git
- The credentials shown are for development only

### Production
1. Use environment variables in your hosting platform
2. Update `NEXTAUTH_URL` to your production domain
3. Add production redirect URI to Google Cloud Console
4. Consider publishing your OAuth consent screen
5. Use HTTPS only in production

## Calendar Event Format

When a booking is created, it will appear in your Google Calendar with:

```
Title: Board Game Session - [X] players

Description:
━━━━━━━━━━━━━━━━━━
👤 Customer: [Name]
📧 Email: [Email]
📱 Phone: [Phone]

👥 Number of People: [X]

🎲 Games Selected:
[Game names]

🍽️ Refreshments:
[Drinks/Snacks]
━━━━━━━━━━━━━━━━━━
```

The customer's email will be added as an attendee, so they'll receive a calendar invite!

## Next Steps

Once OAuth is working:
- [ ] Test creating a booking
- [ ] Verify the event appears in Google Calendar
- [ ] Test with different time slots
- [ ] Deploy to production
- [ ] Update redirect URIs for your production domain

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the terminal/server logs
3. Verify all environment variables are set
4. Ensure Google Calendar API is enabled
5. Confirm redirect URIs match exactly
