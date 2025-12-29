import { addDays, addWeeks, addMonths, setHours, setMinutes, setSeconds, setMilliseconds, getDay, startOfDay } from "date-fns";
import * as db from "./db";
import type { InsertRecurringEventSeries } from "../drizzle/schema";

/**
 * Generate individual event occurrences from a recurring series
 */
export async function generateRecurringEvents(seriesId: number): Promise<number> {
  const series = await db.getRecurringSeriesById(seriesId);
  if (!series || !series.isActive) {
    return 0;
  }

  // Parse start time
  const [hours, minutes, seconds] = series.startTimeOfDay.split(':').map(Number);
  
  const occurrences: Array<{ startTime: number; endTime: number }> = [];
  const startDate = new Date(series.seriesStartDate);
  const endDate = series.seriesEndDate ? new Date(series.seriesEndDate) : null;
  const maxOccurrences = series.maxOccurrences || 1000; // Safety limit

  let currentDate = startOfDay(startDate);
  let count = 0;

  while (count < maxOccurrences) {
    // Check if we've passed the end date
    if (endDate && currentDate > endDate) {
      break;
    }

    // Check if this date matches the recurrence pattern
    if (shouldGenerateOccurrence(currentDate, series)) {
      // Set the time of day
      const eventStart = setMilliseconds(
        setSeconds(
          setMinutes(
            setHours(currentDate, hours),
            minutes
          ),
          seconds || 0
        ),
        0
      );

      const eventEnd = new Date(eventStart.getTime() + series.durationMinutes * 60 * 1000);

      occurrences.push({
        startTime: eventStart.getTime(),
        endTime: eventEnd.getTime(),
      });

      count++;
    }

    // Move to next potential date based on pattern
    currentDate = getNextDate(currentDate, series.recurrencePattern);
  }

  // Create all event occurrences
  let created = 0;
  for (const occurrence of occurrences) {
    // Check if event already exists for this time
    const existing = await db.getEventBySeriesAndTime(seriesId, occurrence.startTime);
    if (!existing) {
      await db.createEvent({
        title: series.title,
        description: series.description || undefined,
        eventType: series.eventType,
        location: series.location || undefined,
        startTime: occurrence.startTime,
        endTime: occurrence.endTime,
        capacity: series.capacity || undefined,
        requiresRsvp: series.requiresRsvp,
        isPublished: true,
        createdBy: series.createdBy,
        recurringSeriesId: seriesId,
        recurrenceException: false,
      });
      created++;
    }
  }

  return created;
}

/**
 * Check if an occurrence should be generated for a given date
 */
function shouldGenerateOccurrence(date: Date, series: any): boolean {
  const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, etc.

  switch (series.recurrencePattern) {
    case 'daily':
      return true;

    case 'weekly':
    case 'biweekly':
      if (!series.daysOfWeek) return false;
      const allowedDays = series.daysOfWeek.split(',').map(Number);
      return allowedDays.includes(dayOfWeek);

    case 'monthly':
      // Generate on the same day of month as the start date
      const startDate = new Date(series.seriesStartDate);
      return date.getDate() === startDate.getDate();

    default:
      return false;
  }
}

/**
 * Get the next date to check based on recurrence pattern
 */
function getNextDate(currentDate: Date, pattern: string): Date {
  switch (pattern) {
    case 'daily':
      return addDays(currentDate, 1);
    
    case 'weekly':
      return addDays(currentDate, 1); // Check every day, filter by daysOfWeek
    
    case 'biweekly':
      return addDays(currentDate, 1); // Check every day, filter by daysOfWeek + week parity
    
    case 'monthly':
      return addDays(currentDate, 1); // Check every day, filter by day of month
    
    default:
      return addDays(currentDate, 1);
  }
}

/**
 * Delete all future occurrences of a recurring series
 */
export async function deleteFutureOccurrences(seriesId: number, fromDate?: number): Promise<number> {
  const cutoffTime = fromDate || Date.now();
  return await db.deleteFutureEventsBySeries(seriesId, cutoffTime);
}

/**
 * Update a single occurrence (marks it as an exception)
 */
export async function updateSingleOccurrence(eventId: number, updates: Partial<any>): Promise<void> {
  await db.updateEvent(eventId, {
    ...updates,
    recurrenceException: true,
  });
}

/**
 * Update entire series (regenerates all future occurrences)
 */
export async function updateEntireSeries(
  seriesId: number,
  updates: Partial<InsertRecurringEventSeries>
): Promise<number> {
  // Update the series definition
  await db.updateRecurringSeries(seriesId, updates);

  // Delete all future non-exception occurrences
  await db.deleteFutureNonExceptionEvents(seriesId, Date.now());

  // Regenerate occurrences
  return await generateRecurringEvents(seriesId);
}

/**
 * Delete a single occurrence
 */
export async function deleteSingleOccurrence(eventId: number): Promise<void> {
  await db.deleteEvent(eventId);
}

/**
 * Delete entire series
 */
export async function deleteEntireSeries(seriesId: number): Promise<void> {
  // Delete all events in the series
  await db.deleteEventsBySeries(seriesId);
  
  // Deactivate the series
  await db.updateRecurringSeries(seriesId, { isActive: false });
}
