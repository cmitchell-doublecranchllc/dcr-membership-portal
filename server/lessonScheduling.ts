import {
  createLessonBooking,
  getLessonSlotById,
  getBookingById,
  updateLessonBooking,
  incrementSlotStudentCount,
  decrementSlotStudentCount,
  getActiveBookingsByMember,
  cancelLessonBooking
} from "./db";

const HOURS_24_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Check if a lesson can be rescheduled (must be 24+ hours in advance)
 */
export function canRescheduleLesson(lessonStartTime: number): boolean {
  const now = Date.now();
  const timeUntilLesson = lessonStartTime - now;
  return timeUntilLesson >= HOURS_24_IN_MS;
}

/**
 * Book a student into a lesson slot
 */
export async function bookLessonSlot(
  slotId: number,
  memberId: number,
  bookedBy: number
): Promise<{ success: boolean; message: string; bookingId?: number }> {
  // Get the slot
  const slot = await getLessonSlotById(slotId);
  if (!slot) {
    return { success: false, message: "Lesson slot not found" };
  }

  // Check if slot is full
  if (slot.currentStudents >= slot.maxStudents) {
    return { success: false, message: "This lesson slot is full" };
  }

  // Check if slot is in the past
  if (slot.startTime < Date.now()) {
    return { success: false, message: "Cannot book a lesson in the past" };
  }

  // Create the booking
  try {
    const bookingId = await createLessonBooking({
      slotId,
      memberId,
      bookedBy,
      status: "confirmed",
      bookedAt: Date.now(),
      rescheduleCount: 0,
    });

    // Increment the slot's student count
    await incrementSlotStudentCount(slotId);

    return {
      success: true,
      message: "Lesson booked successfully",
      bookingId,
    };
  } catch (error) {
    console.error("[Lesson Scheduling] Error booking lesson:", error);
    return { success: false, message: "Failed to book lesson" };
  }
}

/**
 * Reschedule a lesson to a new slot (with 24-hour rule enforcement)
 */
export async function rescheduleLessonBooking(
  bookingId: number,
  newSlotId: number,
  userId: number
): Promise<{ success: boolean; message: string }> {
  // Get the current booking
  const booking = await getBookingById(bookingId);
  if (!booking) {
    return { success: false, message: "Booking not found" };
  }

  // Check if booking is already cancelled or completed
  if (booking.status !== "confirmed") {
    return { success: false, message: "Can only reschedule confirmed bookings" };
  }

  // Get the current slot
  const currentSlot = await getLessonSlotById(booking.slotId);
  if (!currentSlot) {
    return { success: false, message: "Current lesson slot not found" };
  }

  // Check 24-hour rule for current lesson
  if (!canRescheduleLesson(currentSlot.startTime)) {
    return {
      success: false,
      message: "Cannot reschedule lessons within 24 hours of the start time",
    };
  }

  // Get the new slot
  const newSlot = await getLessonSlotById(newSlotId);
  if (!newSlot) {
    return { success: false, message: "New lesson slot not found" };
  }

  // Check if new slot is full
  if (newSlot.currentStudents >= newSlot.maxStudents) {
    return { success: false, message: "The new lesson slot is full" };
  }

  // Check if new slot is in the past
  if (newSlot.startTime < Date.now()) {
    return { success: false, message: "Cannot reschedule to a lesson in the past" };
  }

  try {
    // Update the booking
    await updateLessonBooking(bookingId, {
      slotId: newSlotId,
      rescheduledFromSlotId: booking.slotId,
      rescheduledToSlotId: newSlotId,
      rescheduleCount: booking.rescheduleCount + 1,
      status: "confirmed",
    });

    // Decrement old slot count
    await decrementSlotStudentCount(booking.slotId);

    // Increment new slot count
    await incrementSlotStudentCount(newSlotId);

    return {
      success: true,
      message: "Lesson rescheduled successfully",
    };
  } catch (error) {
    console.error("[Lesson Scheduling] Error rescheduling lesson:", error);
    return { success: false, message: "Failed to reschedule lesson" };
  }
}

/**
 * Cancel a lesson booking (with 24-hour rule enforcement)
 */
export async function cancelLesson(
  bookingId: number
): Promise<{ success: boolean; message: string }> {
  // Get the booking
  const booking = await getBookingById(bookingId);
  if (!booking) {
    return { success: false, message: "Booking not found" };
  }

  // Check if booking is already cancelled
  if (booking.status === "cancelled") {
    return { success: false, message: "Booking is already cancelled" };
  }

  // Get the slot
  const slot = await getLessonSlotById(booking.slotId);
  if (!slot) {
    return { success: false, message: "Lesson slot not found" };
  }

  // Check 24-hour rule
  if (!canRescheduleLesson(slot.startTime)) {
    return {
      success: false,
      message: "Cannot cancel lessons within 24 hours of the start time",
    };
  }

  try {
    // Cancel the booking
    await cancelLessonBooking(bookingId, Date.now());

    // Decrement slot count
    await decrementSlotStudentCount(booking.slotId);

    return {
      success: true,
      message: "Lesson cancelled successfully",
    };
  } catch (error) {
    console.error("[Lesson Scheduling] Error cancelling lesson:", error);
    return { success: false, message: "Failed to cancel lesson" };
  }
}

/**
 * Get a student's upcoming lessons with slot details
 */
export async function getStudentUpcomingLessons(memberId: number) {
  const bookings = await getActiveBookingsByMember(memberId);
  const now = Date.now();

  // Get slot details for each booking
  const lessonsWithSlots = await Promise.all(
    bookings.map(async (booking) => {
      const slot = await getLessonSlotById(booking.slotId);
      return {
        booking,
        slot,
      };
    })
  );

  // Filter to only future lessons and sort by start time
  return lessonsWithSlots
    .filter((lesson) => lesson.slot && lesson.slot.startTime > now)
    .sort((a, b) => a.slot!.startTime - b.slot!.startTime);
}

/**
 * Check if a student can book a specific slot
 */
export async function canStudentBookSlot(
  memberId: number,
  slotId: number
): Promise<{ canBook: boolean; reason?: string }> {
  // Get the slot
  const slot = await getLessonSlotById(slotId);
  if (!slot) {
    return { canBook: false, reason: "Lesson slot not found" };
  }

  // Check if slot is full
  if (slot.currentStudents >= slot.maxStudents) {
    return { canBook: false, reason: "This lesson slot is full" };
  }

  // Check if slot is in the past
  if (slot.startTime < Date.now()) {
    return { canBook: false, reason: "Cannot book a lesson in the past" };
  }

  // Check if student already has a booking for this time
  const studentBookings = await getActiveBookingsByMember(memberId);
  const hasConflict = await Promise.all(
    studentBookings.map(async (booking) => {
      const bookedSlot = await getLessonSlotById(booking.slotId);
      if (!bookedSlot) return false;

      // Check if times overlap
      const slotsOverlap =
        (slot.startTime >= bookedSlot.startTime && slot.startTime < bookedSlot.endTime) ||
        (slot.endTime > bookedSlot.startTime && slot.endTime <= bookedSlot.endTime) ||
        (slot.startTime <= bookedSlot.startTime && slot.endTime >= bookedSlot.endTime);

      return slotsOverlap;
    })
  );

  if (hasConflict.some((conflict) => conflict)) {
    return { canBook: false, reason: "You already have a lesson at this time" };
  }

  return { canBook: true };
}
