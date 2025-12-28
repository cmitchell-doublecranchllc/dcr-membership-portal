import { createEvents, EventAttributes } from 'ics';

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  url?: string;
}

/**
 * Generate an ICS file content for calendar export
 */
export function generateICSFile(event: CalendarEvent): string {
  const startArray: [number, number, number, number, number] = [
    event.startTime.getFullYear(),
    event.startTime.getMonth() + 1,
    event.startTime.getDate(),
    event.startTime.getHours(),
    event.startTime.getMinutes(),
  ];

  const endArray: [number, number, number, number, number] = [
    event.endTime.getFullYear(),
    event.endTime.getMonth() + 1,
    event.endTime.getDate(),
    event.endTime.getHours(),
    event.endTime.getMinutes(),
  ];

  const eventAttributes: EventAttributes = {
    start: startArray,
    end: endArray,
    title: event.title,
    description: event.description,
    location: event.location,
    url: event.url,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: { name: 'Double C Ranch', email: 'support@doublecranchllc.com' },
  };

  const { error, value } = createEvents([eventAttributes]);

  if (error) {
    throw new Error(`Failed to create ICS file: ${error.message}`);
  }

  return value || '';
}

/**
 * Generate a Google Calendar URL for adding an event
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatDateTime = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDateTime(event.startTime)}/${formatDateTime(event.endTime)}`,
    details: event.description || '',
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate calendar export data for an event
 */
export function generateCalendarExport(event: CalendarEvent) {
  const icsContent = generateICSFile(event);
  const googleUrl = generateGoogleCalendarUrl(event);

  return {
    icsContent,
    googleUrl,
    // Apple Calendar and Outlook both use ICS files
    appleUrl: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`,
    outlookUrl: `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`,
  };
}
