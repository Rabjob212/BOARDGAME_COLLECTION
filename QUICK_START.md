# 🚀 Quick Start Guide - OAuth Setup

## ✅ Current Status

Your application is **fully implemented** with OAuth authentication. You just need to configure Google Cloud Console.

## 🔧 5-Minute Setup

### 1. Google Cloud Console Setup

Visit: https://console.cloud.google.com/

**Enable API:**
- APIs & Services → Library → Search "Google Calendar API" → Enable

**Configure OAuth:**
- APIs & Services → OAuth consent screen
  - User type: External
  - App name: Board Game Booking System
  - Email: rabjob212@gmail.com
  - Scopes: Add calendar and calendar.events
  - Test users: Add rabjob212@gmail.com

**Set Redirect URI:**
- APIs & Services → Credentials → Your OAuth Client
  - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
  - Click Save

### 2. Run the App

```bash
cd boardgame-booking
npm run dev
```

Open: http://localhost:3000

### 3. Test OAuth

1. Click "Connect Google Calendar" button
2. Sign in with rabjob212@gmail.com
3. Grant permissions
4. You'll be redirected back (should see "Connected")

### 4. Test Booking

1. Go to "Book a Session" tab
2. Click a green time slot
3. Fill in the form
4. Submit
5. Check your Google Calendar for the new event!

## 🎯 What to Check

- [ ] Google Calendar API is enabled
- [ ] OAuth consent screen is configured
- [ ] Redirect URI matches exactly: `http://localhost:3000/api/auth/callback/google`
- [ ] `.env.local` file exists with credentials
- [ ] Development server is running

## 📋 Environment Variables

Already configured in `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALENDAR_ID=your-email@gmail.com
NEXTAUTH_URL=http://localhost:3000
```

## ❓ Troubleshooting

**"Access blocked" warning:**
- Click "Advanced" → "Go to Board Game Booking System (unsafe)"
- This is normal during development

**"Redirect URI mismatch":**
- Check it's exactly: `http://localhost:3000/api/auth/callback/google`
- No trailing slash, http not https for localhost

**"Invalid client":**
- Restart dev server after changing `.env.local`
- Check credentials match Google Cloud Console

## 📚 Full Documentation

- `GOOGLE_CALENDAR_SETUP.md` - Detailed setup instructions
- `OAUTH_IMPLEMENTATION.md` - Technical implementation details
- `README.md` - General project information

## 🎉 You're All Set!

Once Google Cloud Console is configured, your booking system will:
- ✅ Authenticate users with Google OAuth
- ✅ Create calendar events automatically
- ✅ Send email invites to customers
- ✅ Show real availability from your calendar
- ✅ Store all booking details in events

Enjoy your Board Game Booking System! 🎲
