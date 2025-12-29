import { describe, it, expect } from 'vitest';
import { google } from 'googleapis';

describe('Google Calendar Integration', () => {
  it('should validate Google Calendar credentials', async () => {
    const credentials = process.env.GOOGLE_CALENDAR_CREDENTIALS;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    expect(credentials).toBeDefined();
    expect(calendarId).toBeDefined();

    // Parse credentials
    const credentialsObj = JSON.parse(credentials!);
    expect(credentialsObj.type).toBe('service_account');
    expect(credentialsObj.client_email).toBeDefined();
    expect(credentialsObj.private_key).toBeDefined();

    // Initialize Google Calendar client
    const auth = new google.auth.GoogleAuth({
      credentials: credentialsObj,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Try to access the target calendar directly
    try {
      const calendarResponse = await calendar.calendars.get({
        calendarId: calendarId!,
      });
      
      expect(calendarResponse.status).toBe(200);
      expect(calendarResponse.data.id).toBeDefined();
      
      console.log('[Google Calendar Test] Successfully connected to calendar!');
      console.log('[Google Calendar Test] Calendar:', calendarResponse.data.summary);
      console.log('[Google Calendar Test] Calendar ID:', calendarResponse.data.id);
      console.log('[Google Calendar Test] Timezone:', calendarResponse.data.timeZone);
    } catch (error: any) {
      console.error('[Google Calendar Test] Failed to access calendar:', error.message);
      throw new Error(`Cannot access calendar ${calendarId}. Make sure you've shared the calendar with the service account email: ${credentialsObj.client_email}`);
    }
  }, 30000); // 30 second timeout for API call
});
