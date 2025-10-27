# Auto-Authentication Setup Guide

This guide explains how to set up automatic Google Calendar authentication so the app always uses rabjob212@gmail.com without requiring users to click "Connect Google Calendar".

## How It Works

The app now uses **server-side token storage** in `.env.local` file:
1. First time: You need to authenticate once via OAuth
2. Tokens are automatically saved to `.env.local`
3. All future requests use these stored tokens automatically
4. No user authentication required

## Initial Setup (One-Time Only)

### Step 1: Temporarily Enable the Connect Button

Uncomment the auth button in `app/page.tsx` (lines 213-229):

```tsx
{/* Auth Button */}
<div className="flex items-center gap-3">
  {authLoading ? (
    <div className="text-sm text-gray-500">Loading...</div>
  ) : isAuthenticated ? (
    // ... rest of the button code
  ) : (
    <Button variant="primary" size="sm" onClick={handleSignIn}>
      🔗 Connect Google Calendar
    </Button>
  )}
</div>
```

### Step 2: Authenticate

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Click "🔗 Connect Google Calendar"
4. Sign in with **rabjob212@gmail.com**
5. Grant calendar permissions

### Step 3: Verify Tokens Were Saved

Check `.env.local` - it should now have these lines filled:

```bash
GOOGLE_REFRESH_TOKEN=1//0gXXXXXXXXXXXXX...
GOOGLE_ACCESS_TOKEN=ya29.XXXXXXXXXXXXX...
```

### Step 4: Comment Out the Button Again

Re-comment the auth button in `app/page.tsx` (as it currently is):

```tsx
{/* Auth Button - Hidden since auto-auth is enabled */}
{/* ... commented button code ... */}
```

### Step 5: Restart the Server

```bash
# Stop the dev server
Ctrl+C

# Restart
npm run dev
```

## ✅ Done!

The app will now:
- Automatically use the stored tokens for all calendar operations
- Create calendar events for all bookings (even without user login)
- Sync deletions from Google Calendar
- Work without showing any authentication UI

## Important Notes

### Security
- The `.env.local` file contains sensitive tokens
- **Never commit `.env.local` to version control**
- Make sure `.env.local` is in `.gitignore`

### Token Expiration
- Access tokens expire after 1 hour
- Refresh tokens are long-lived (can last months/years)
- The system automatically refreshes access tokens using the refresh token
- If refresh token expires, repeat the setup process

### Production Deployment
For production:
1. Set environment variables in your hosting platform (Vercel, etc.)
2. Add `GOOGLE_REFRESH_TOKEN` and `GOOGLE_ACCESS_TOKEN` to production env vars
3. These values should be the same ones from your `.env.local`

## Troubleshooting

### Tokens Not Working
If bookings aren't creating calendar events:

1. Check server logs for auth errors
2. Verify tokens exist in `.env.local`
3. Try re-authenticating (Step 1-3)

### Check Current Status
Look at server logs when making a booking:
- `📝 Using stored tokens from .env.local` - Good! Auto-auth working
- `ℹ️ User not authenticated` - Tokens missing or invalid

### Manual Token Refresh
If needed, you can manually get new tokens by:
1. Temporarily uncommenting the auth button
2. Signing in again
3. New tokens will overwrite old ones in `.env.local`

## Alternative: Service Account (Future Enhancement)

For production, consider using a Google Service Account:
- No OAuth flow needed
- Tokens never expire
- More secure for server-to-server communication
- Requires different setup (can help with this if needed)
