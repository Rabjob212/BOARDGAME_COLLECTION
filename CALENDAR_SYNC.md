# Google Calendar Sync Implementation

## Overview
The app now supports two-way sync between the local booking storage (`data/bookings.json`) and Google Calendar.

## How It Works

### Creating Bookings

1. **Non-Authenticated Users**:
   - Booking saved to `data/bookings.json`
   - No calendar event created
   - Visible to all users

2. **Authenticated Users**:
   - Booking saved to `data/bookings.json`
   - Calendar event created in Google Calendar
   - `calendarEventId` stored with booking
   - Visible to all users

### Syncing Deletions/Updates

When the calendar availability endpoint is called:

1. **Fetch Current State**:
   - Get stored bookings from `data/bookings.json`
   - Get calendar events from Google Calendar (if authenticated)

2. **Sync Process** (for authenticated users):
   - Extract all calendar event IDs from Google Calendar
   - Check each stored booking:
     - If booking has no `calendarEventId` → Keep it (created by non-authenticated user)
     - If booking has `calendarEventId` that exists in calendar → Keep it
     - If booking has `calendarEventId` that's missing from calendar → **Delete it**
   
3. **Result**:
   - Bookings deleted from Google Calendar are automatically removed from storage
   - All users see the updated availability

## Key Functions

### `bookingStorage.ts`

```typescript
// Sync stored bookings with Google Calendar events
syncWithCalendarEvents(calendarEventIds: string[]): number
```
- Takes array of current calendar event IDs
- Removes bookings whose calendar events no longer exist
- Preserves bookings without calendar event IDs
- Returns count of deleted bookings

```typescript
// Delete by calendar event ID
deleteBookingByCalendarEventId(calendarEventId: string): boolean
```
- Delete a specific booking by its calendar event ID
- Useful for targeted deletion

### `availability/route.ts`

The sync happens automatically when fetching availability:

```typescript
// Get calendar events
const events = await getAvailableSlots(...)

// Extract event IDs
const calendarEventIds = events.map(e => e.id)

// Sync: Remove bookings whose calendar events were deleted
syncWithCalendarEvents(calendarEventIds)

// Re-fetch after sync
const syncedStoredBookings = getBookingsByDateRange(...)
```

## Important Notes

1. **Automatic Sync**: Sync happens every time someone views the calendar (when authenticated)

2. **Protected Bookings**: Bookings created by non-authenticated users (no `calendarEventId`) are never auto-deleted

3. **One-Way for Manual Deletions**: If you manually delete from `bookings.json`, it won't delete from Google Calendar

4. **Future Enhancements**:
   - Add webhook support for real-time sync
   - Implement update detection (not just deletions)
   - Add admin panel to manage bookings

## Testing the Sync

1. Create a booking while authenticated
2. Check Google Calendar - event should appear
3. Delete the event from Google Calendar
4. Refresh the booking calendar in the app
5. The slot should now show as available

## Sync Frequency

- Syncs on every calendar view load
- For authenticated users only
- Non-authenticated users see stored bookings without triggering sync
