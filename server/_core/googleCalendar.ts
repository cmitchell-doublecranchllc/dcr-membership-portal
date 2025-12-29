import { google } from 'googleapis';

const GOOGLE_CALENDAR_CREDENTIALS = process.env.GOOGLE_CALENDAR_CREDENTIALS;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

let calendarClient: any = null;

/**
 * Initialize Google Calendar API client
 */
function getCalendarClient() {
  if (calendarClient) {
    return calendarClient;
  }

  if (!GOOGLE_CALENDAR_CREDENTIALS) {
    console.warn('[Google Calendar] Credentials not configured');
    return null;
  }

  try {
    const credentials = JSON.parse(GOOGLE_CALENDAR_CREDENTIALS);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    calendarClient = google.calendar({ version: 'v3', auth });
    console.log('[Google Calendar] Client initialized successfully');
    return calendarClient;
  } catch (error) {
    console.error('[Google Calendar] Failed to initialize client:', error);
    return null;
  }
}

export interface CalendarEventData {
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
}

/**
 * Create a Google Calendar event
 */
export async function createCalendarEvent(eventData: CalendarEventData): Promise<string | null> {
  const calendar = getCalendarClient();
  if (!calendar) {
    console.warn('[Google Calendar] Skipping event creation - client not initialized');
    return null;
  }

  try {
    const event = {
      summary: eventData.summary,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'America/New_York', // Adjust to your timezone
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'America/New_York',
      },
      attendees: eventData.attendees?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      requestBody: event,
      sendUpdates: 'all', // Send email invitations to attendees
    });

    console.log('[Google Calendar] Event created:', response.data.id);
    return response.data.id || null;
  } catch (error) {
    console.error('[Google Calendar] Failed to create event:', error);
    return null;
  }
}

/**
 * Update a Google Calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  eventData: Partial<CalendarEventData>
): Promise<boolean> {
  const calendar = getCalendarClient();
  if (!calendar) {
    return false;
  }

  try {
    const event: any = {};
    
    if (eventData.summary) event.summary = eventData.summary;
    if (eventData.description) event.description = eventData.description;
    if (eventData.location) event.location = eventData.location;
    if (eventData.startTime) {
      event.start = {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'America/New_York',
      };
    }
    if (eventData.endTime) {
      event.end = {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'America/New_York',
      };
    }
    if (eventData.attendees) {
      event.attendees = eventData.attendees.map(email => ({ email }));
    }

    await calendar.events.patch({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId,
      requestBody: event,
      sendUpdates: 'all',
    });

    console.log('[Google Calendar] Event updated:', eventId);
    return true;
  } catch (error) {
    console.error('[Google Calendar] Failed to update event:', error);
    return false;
  }
}

/**
 * Delete a Google Calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const calendar = getCalendarClient();
  if (!calendar) {
    return false;
  }

  try {
    await calendar.events.delete({
      calendarId: GOOGLE_CALENDAR_ID,
      eventId,
      sendUpdates: 'all',
    });

    console.log('[Google Calendar] Event deleted:', eventId);
    return true;
  } catch (error) {
    console.error('[Google Calendar] Failed to delete event:', error);
    return false;
  }
}
