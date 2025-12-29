/**
 * Generate ICS (iCalendar) format calendar files
 * These can be attached to emails and clicked to add events to any calendar app
 */

export interface ICSEventData {
  summary: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  organizerEmail?: string;
  organizerName?: string;
}

/**
 * Format date for ICS format: YYYYMMDDTHHmmssZ
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate a unique ID for the event
 */
function generateEventUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@doublecranchllc.com`;
}

/**
 * Escape special characters in ICS text fields
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate an ICS calendar file content
 */
export function generateICS(eventData: ICSEventData): string {
  const uid = generateEventUID();
  const now = formatICSDate(new Date());
  const start = formatICSDate(eventData.startTime);
  const end = formatICSDate(eventData.endTime);

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Double C Ranch LLC//Lesson Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICSText(eventData.summary)}`,
  ];

  if (eventData.description) {
    icsContent.push(`DESCRIPTION:${escapeICSText(eventData.description)}`);
  }

  if (eventData.location) {
    icsContent.push(`LOCATION:${escapeICSText(eventData.location)}`);
  }

  if (eventData.organizerEmail) {
    const organizerName = eventData.organizerName || eventData.organizerEmail;
    icsContent.push(`ORGANIZER;CN=${escapeICSText(organizerName)}:mailto:${eventData.organizerEmail}`);
  }

  if (eventData.attendees && eventData.attendees.length > 0) {
    eventData.attendees.forEach(email => {
      icsContent.push(`ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${email}`);
    });
  }

  // Add reminders
  icsContent.push('BEGIN:VALARM');
  icsContent.push('TRIGGER:-PT24H'); // 24 hours before
  icsContent.push('ACTION:DISPLAY');
  icsContent.push(`DESCRIPTION:Reminder: ${escapeICSText(eventData.summary)}`);
  icsContent.push('END:VALARM');

  icsContent.push('BEGIN:VALARM');
  icsContent.push('TRIGGER:-PT30M'); // 30 minutes before
  icsContent.push('ACTION:DISPLAY');
  icsContent.push(`DESCRIPTION:Reminder: ${escapeICSText(eventData.summary)}`);
  icsContent.push('END:VALARM');

  icsContent.push('STATUS:CONFIRMED');
  icsContent.push('SEQUENCE:0');
  icsContent.push('END:VEVENT');
  icsContent.push('END:VCALENDAR');

  return icsContent.join('\r\n');
}

/**
 * Generate ICS file for a lesson booking
 */
export function generateLessonICS(lesson: {
  lessonType: string;
  startTime: Date;
  endTime: Date;
  instructorName?: string | null;
  location?: string | null;
  studentEmail: string;
  studentName: string;
}): string {
  const summary = `${lesson.lessonType.charAt(0).toUpperCase() + lesson.lessonType.slice(1)} Riding Lesson`;
  
  let description = `Riding lesson at Double C Ranch LLC\n\n`;
  description += `Student: ${lesson.studentName}\n`;
  if (lesson.instructorName) {
    description += `Instructor: ${lesson.instructorName}\n`;
  }
  description += `\nFor questions or to reschedule, contact support@doublecranchllc.com`;

  return generateICS({
    summary,
    description,
    location: lesson.location || 'Double C Ranch LLC',
    startTime: lesson.startTime,
    endTime: lesson.endTime,
    attendees: [lesson.studentEmail],
    organizerEmail: 'support@doublecranchllc.com',
    organizerName: 'Double C Ranch LLC',
  });
}
