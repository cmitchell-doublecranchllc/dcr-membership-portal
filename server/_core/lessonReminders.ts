import { sendKlaviyoSMS } from "./klaviyo";
import { getDb } from "../db";
import { lessonBookings, lessonSlots, users, members } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Send SMS reminders for lessons starting in 30 minutes
 */
export async function sendLessonReminders(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Lesson Reminders] Database not available");
      return;
    }

    // Get current time and 30 minutes from now (as Unix timestamps)
    const now = Date.now();
    const thirtyMinutesFromNow = now + 30 * 60 * 1000;
    const fortyMinutesFromNow = now + 40 * 60 * 1000;

    // Find all bookings with lessons starting in 30-40 minutes
    const upcomingBookings = await db
      .select({
        booking: lessonBookings,
        slot: lessonSlots,
        user: users,
        member: members,
      })
      .from(lessonBookings)
      .innerJoin(lessonSlots, eq(lessonBookings.slotId, lessonSlots.id))
      .innerJoin(members, eq(lessonBookings.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(
        and(
          gte(lessonSlots.startTime, thirtyMinutesFromNow),
          lte(lessonSlots.startTime, fortyMinutesFromNow),
          eq(lessonBookings.status, "confirmed")
        )
      );

    console.log(`[Lesson Reminders] Found ${upcomingBookings.length} lessons starting in 30 minutes`);

    for (const { booking, slot, user, member } of upcomingBookings) {
      // Skip if member doesn't have phone number
      if (!member?.phone) {
        console.log(`[Lesson Reminders] Skipping user ${user.id} - no phone number`);
        continue;
      }

      // Format lesson time
      const lessonTime = new Date(slot.startTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      const message = `Reminder: Your ${slot.lessonType} lesson at Double C Ranch starts in 30 minutes (${lessonTime}). ${slot.location || "See you soon!"}`;

      const sent = await sendKlaviyoSMS({
        phoneNumber: member.phone,
        message,
      });

      if (sent) {
        console.log(`[Lesson Reminders] Sent reminder to ${user.name} for lesson at ${lessonTime}`);
      }
    }
  } catch (error) {
    console.error("[Lesson Reminders] Error sending reminders:", error);
  }
}

/**
 * Initialize lesson reminder scheduler (runs every 10 minutes)
 */
export function initializeLessonReminderScheduler(): void {
  console.log("[Lesson Reminders] Scheduler initialized");

  // Run immediately on startup
  sendLessonReminders();

  // Then run every 10 minutes
  setInterval(sendLessonReminders, 10 * 60 * 1000);
}
