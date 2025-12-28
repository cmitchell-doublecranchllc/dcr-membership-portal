import { describe, it, expect } from 'vitest';
import { createCalendarEvent } from './_core/googleCalendar';

describe('Google Calendar Event Creation', () => {
  it('should create a test event in Google Calendar', async () => {
    const testEvent = {
      summary: '[TEST] Portal Integration Test',
      description: 'This is a test event created by the portal to verify Google Calendar integration. You can safely delete this event.',
      location: 'Double C Ranch',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
      attendees: [],
    };

    const eventId = await createCalendarEvent(testEvent);
    
    expect(eventId).toBeDefined();
    expect(eventId).not.toBeNull();
    
    console.log('[Google Calendar Test] Successfully created test event!');
    console.log('[Google Calendar Test] Event ID:', eventId);
    console.log('[Google Calendar Test] Check your calendar for a test event tomorrow');
    console.log('[Google Calendar Test] You can safely delete the test event');
  }, 30000); // 30 second timeout
});
