import { format } from "date-fns";
import * as db from "../db";
import { sendEmail, getEventReminderEmail } from "./email";

/**
 * Send reminder emails for events happening in the next 24-30 hours
 * This function should be called once per day (e.g., at 9 AM)
 */
export async function sendEventReminders(): Promise<{ sent: number; failed: number }> {
  console.log('[Event Reminders] Starting daily reminder check...');
  
  const now = Date.now();
  const tomorrow = now + (24 * 60 * 60 * 1000); // 24 hours from now
  const dayAfter = now + (30 * 60 * 60 * 1000); // 30 hours from now (6 hour window)

  let sent = 0;
  let failed = 0;

  try {
    // Get all upcoming events in the next 24-30 hours
    const upcomingEvents = await db.getUpcomingEvents();
    
    for (const event of upcomingEvents) {
      const eventTime = new Date(event.startTime).getTime();
      
      // Check if event is in the 24-30 hour window
      if (eventTime >= tomorrow && eventTime <= dayAfter) {
        console.log(`[Event Reminders] Processing reminders for: ${event.title}`);
        
        // Get all confirmed RSVPs for this event
        const rsvps = await db.getRsvpsByEventId(event.id);
        const confirmedRsvps = rsvps.filter(rsvp => rsvp.status === 'attending');
        
        for (const rsvp of confirmedRsvps) {
          try {
            // Get user info
            const user = await db.getUserById(rsvp.userId);
            if (!user || !user.email) {
              console.log(`[Event Reminders] Skipping RSVP ${rsvp.id}: No email for user ${rsvp.userId}`);
              continue;
            }

            const eventDate = format(new Date(event.startTime), 'EEEE, MMMM d, yyyy');
            const eventTime = format(new Date(event.startTime), 'h:mm a');
            
            const emailData = getEventReminderEmail({
              memberName: user.name || 'Member',
              eventTitle: event.title,
              eventDate,
              eventTime,
              eventLocation: event.location || undefined,
              guestCount: rsvp.guestCount || 0,
            });

            const success = await sendEmail({
              to: user.email,
              subject: emailData.subject,
              html: emailData.html,
            });

            if (success) {
              sent++;
              console.log(`[Event Reminders] Sent reminder to ${user.email} for ${event.title}`);
            } else {
              failed++;
              console.error(`[Event Reminders] Failed to send reminder to ${user.email}`);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            failed++;
            console.error(`[Event Reminders] Error sending reminder for RSVP ${rsvp.id}:`, error);
          }
        }
      }
    }

    console.log(`[Event Reminders] Completed. Sent: ${sent}, Failed: ${failed}`);
    return { sent, failed };
  } catch (error) {
    console.error('[Event Reminders] Fatal error:', error);
    return { sent, failed };
  }
}

/**
 * Initialize the reminder scheduler
 * Runs every day at 9 AM
 */
export function initializeReminderScheduler() {
  // Calculate time until next 9 AM
  const now = new Date();
  const next9AM = new Date();
  next9AM.setHours(9, 0, 0, 0);
  
  // If it's already past 9 AM today, schedule for tomorrow
  if (now.getTime() > next9AM.getTime()) {
    next9AM.setDate(next9AM.getDate() + 1);
  }

  const timeUntilNext9AM = next9AM.getTime() - now.getTime();

  console.log(`[Event Reminders] Scheduler initialized. Next run at ${next9AM.toLocaleString()}`);

  // Schedule first run
  setTimeout(() => {
    sendEventReminders();
    
    // Then run every 24 hours
    setInterval(() => {
      sendEventReminders();
    }, 24 * 60 * 60 * 1000);
  }, timeUntilNext9AM);
}
