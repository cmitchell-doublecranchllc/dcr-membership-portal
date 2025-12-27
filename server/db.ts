import { eq, and, or, desc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  members, InsertMember,
  checkIns, InsertCheckIn,
  contracts, InsertContract,
  contractSignatures, InsertContractSignature,
  contractAssignments, InsertContractAssignment,
  announcements, InsertAnnouncement,
  messages, InsertMessage,
  appointments, InsertAppointment,
  events, InsertEvent,
  eventRsvps, InsertEventRsvp,
  recurringEventSeries, InsertRecurringEventSeries,
  lessonSlots, InsertLessonSlot,
  lessonBookings, InsertLessonBooking,
  progressNotes, InsertProgressNote,
  horses, InsertHorse
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Functions ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    // Set account status: owner is auto-approved, others start as pending
    if (user.openId === ENV.ownerOpenId) {
      values.accountStatus = 'approved';
      updateSet.accountStatus = 'approved';
    } else if (user.accountStatus === undefined) {
      // Only set pending on first insert, don't override on update
      values.accountStatus = 'pending';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: { email: string; name: string; accountStatus: string; role: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    email: user.email,
    name: user.name,
    accountStatus: user.accountStatus as any,
    role: user.role as any,
    openId: `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    loginMethod: "email",
  });
  const userId = result[0].insertId;
  const newUser = await getUserById(userId);
  if (!newUser) throw new Error("Failed to create user");
  return newUser;
}

// ============ Member Functions ============

export async function createMember(member: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(members).values(member);
  return result[0].insertId;
}

export async function getMemberByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateMember(id: number, updates: Partial<InsertMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(members).set(updates).where(eq(members.id, id));
}

export async function getChildrenByParentId(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(members).where(eq(members.parentId, parentId));
}

export async function getAllMembers() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: members.id,
      userId: members.userId,
      membershipTier: members.membershipTier,
      phone: members.phone,
      user: users,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .orderBy(desc(members.createdAt));
}

// ============ Check-in Functions ============

export async function createCheckIn(checkIn: InsertCheckIn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(checkIns).values(checkIn);
  return result;
}

export async function getRecentCheckIns(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(checkIns).orderBy(desc(checkIns.checkInTime)).limit(limit);
}

export async function getCheckInsByMemberId(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(checkIns).where(eq(checkIns.memberId, memberId)).orderBy(desc(checkIns.checkInTime));
}

export async function getTodayCheckIns() {
  const db = await getDb();
  if (!db) return [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  return await db.select().from(checkIns).where(gte(checkIns.checkInTime, todayStartMs)).orderBy(desc(checkIns.checkInTime));
}

// ============ Contract Functions ============

export async function createContract(contract: InsertContract) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contracts).values(contract);
  return result;
}

export async function getActiveContracts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contracts).where(eq(contracts.isActive, true)).orderBy(desc(contracts.createdAt));
}

export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateContract(id: number, updates: Partial<InsertContract>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contracts).set(updates).where(eq(contracts.id, id));
}

// ============ Contract Assignment Functions ============

export async function assignContract(assignment: InsertContractAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contractAssignments).values(assignment);
  return result;
}

export async function getAssignmentsByMemberId(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contractAssignments).where(eq(contractAssignments.memberId, memberId)).orderBy(desc(contractAssignments.createdAt));
}

export async function getUnsignedAssignmentsByMemberId(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contractAssignments)
    .where(and(
      eq(contractAssignments.memberId, memberId),
      eq(contractAssignments.isSigned, false)
    ))
    .orderBy(desc(contractAssignments.createdAt));
}

export async function updateAssignment(id: number, updates: Partial<InsertContractAssignment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contractAssignments).set(updates).where(eq(contractAssignments.id, id));
}

// ============ Contract Signature Functions ============

export async function createSignature(signature: InsertContractSignature) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contractSignatures).values(signature);
  return result;
}

export async function getSignaturesByMemberId(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contractSignatures).where(eq(contractSignatures.memberId, memberId)).orderBy(desc(contractSignatures.signedAt));
}

export async function getSignatureByContractAndMember(contractId: number, memberId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contractSignatures)
    .where(and(
      eq(contractSignatures.contractId, contractId),
      eq(contractSignatures.memberId, memberId)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Announcement Functions ============

export async function createAnnouncement(announcement: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(announcements).values(announcement);
  return result;
}

export async function getPublishedAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(announcements).where(eq(announcements.isPublished, true)).orderBy(desc(announcements.publishedAt));
}

export async function getAnnouncementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAnnouncement(id: number, updates: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(announcements).set(updates).where(eq(announcements.id, id));
}

// ============ Message Functions ============

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(message);
  return result;
}

export async function getMessagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messages)
    .where(eq(messages.recipientId, userId))
    .orderBy(desc(messages.sentAt));
}

export async function getConversation(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(messages)
    .where(
      and(
        eq(messages.senderId, userId1),
        eq(messages.recipientId, userId2)
      )
    )
    .orderBy(desc(messages.sentAt));
}

export async function markMessageAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
}

export async function getUnreadMessageCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(messages)
    .where(and(
      eq(messages.recipientId, userId),
      eq(messages.isRead, false)
    ));
  return result.length;
}

// ============ Appointment Functions ============

export async function createAppointment(appointment: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(appointment);
  return result;
}

export async function getAppointmentsByMemberId(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(appointments).where(eq(appointments.memberId, memberId)).orderBy(appointments.startTime);
}

export async function getUpcomingAppointments(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  return await db.select().from(appointments)
    .where(and(
      eq(appointments.memberId, memberId),
      gte(appointments.startTime, now)
    ))
    .orderBy(appointments.startTime);
}

export async function upsertAppointment(appointment: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(appointments).values(appointment).onDuplicateKeyUpdate({
    set: {
      appointmentType: appointment.appointmentType,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      notes: appointment.notes,
      syncedAt: new Date(),
    }
  });
}

// ============ Event Functions ============

export async function createEvent(event: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(events).values(event);
  return result;
}

export async function getPublishedEvents() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(events).where(eq(events.isPublished, true)).orderBy(events.startTime);
}

export async function getUpcomingEvents() {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  return await db.select().from(events)
    .where(and(
      eq(events.isPublished, true),
      gte(events.startTime, now)
    ))
    .orderBy(events.startTime);
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateEvent(id: number, updates: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(events).set(updates).where(eq(events.id, id));
}

export async function getAllEvents() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(events).orderBy(desc(events.startTime));
}

// ============ Event RSVP Functions ============

export async function createRsvp(rsvp: InsertEventRsvp) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(eventRsvps).values(rsvp);
  return result;
}

export async function getRsvpByEventAndMember(eventId: number, memberId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(eventRsvps)
    .where(and(
      eq(eventRsvps.eventId, eventId),
      eq(eventRsvps.memberId, memberId)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRsvpsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(eventRsvps).where(eq(eventRsvps.eventId, eventId));
}

export async function getRsvpsByMemberId(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(eventRsvps).where(eq(eventRsvps.memberId, memberId)).orderBy(desc(eventRsvps.rsvpedAt));
}

export async function updateRsvp(id: number, updates: Partial<InsertEventRsvp>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(eventRsvps).set(updates).where(eq(eventRsvps.id, id));
}

export async function deleteRsvp(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(eventRsvps).where(eq(eventRsvps.id, id));
}

export async function getEventAttendeeCount(eventId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(eventRsvps)
    .where(and(
      eq(eventRsvps.eventId, eventId),
      eq(eventRsvps.status, "attending")
    ));
  return result.reduce((sum, rsvp) => sum + 1 + (rsvp.guestCount || 0), 0);
}

// ============ Recurring Event Series Functions ============

export async function createRecurringSeries(series: InsertRecurringEventSeries) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(recurringEventSeries).values(series);
}

export async function getRecurringSeriesById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(recurringEventSeries).where(eq(recurringEventSeries.id, id)).limit(1);
  return result[0];
}

export async function getAllRecurringSeries() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(recurringEventSeries).where(eq(recurringEventSeries.isActive, true));
}

export async function updateRecurringSeries(id: number, updates: Partial<InsertRecurringEventSeries>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(recurringEventSeries).set(updates).where(eq(recurringEventSeries.id, id));
}

export async function getEventBySeriesAndTime(seriesId: number, startTime: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events)
    .where(and(
      eq(events.recurringSeriesId, seriesId),
      eq(events.startTime, startTime)
    ))
    .limit(1);
  return result[0];
}

export async function deleteFutureEventsBySeries(seriesId: number, fromTime: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.delete(events)
    .where(and(
      eq(events.recurringSeriesId, seriesId),
      gte(events.startTime, fromTime)
    ));
  return result[0].affectedRows || 0;
}

export async function deleteFutureNonExceptionEvents(seriesId: number, fromTime: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.delete(events)
    .where(and(
      eq(events.recurringSeriesId, seriesId),
      gte(events.startTime, fromTime),
      eq(events.recurrenceException, false)
    ));
  return result[0].affectedRows || 0;
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(events).where(eq(events.id, id));
}

export async function deleteEventsBySeries(seriesId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.delete(events).where(eq(events.recurringSeriesId, seriesId));
  return result[0].affectedRows || 0;
}

// ============ Lesson Slot Functions ============

export async function createLessonSlot(slot: InsertLessonSlot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(lessonSlots).values(slot);
  return result[0].insertId;
}

export async function getAllLessonSlots() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(lessonSlots).orderBy(lessonSlots.startTime);
}

export async function getAvailableLessonSlots(fromTime: number) {
  const db = await getDb();
  if (!db) return [];
  // Get slots that are in the future and have space available
  const slots = await db.select().from(lessonSlots)
    .where(gte(lessonSlots.startTime, fromTime))
    .orderBy(lessonSlots.startTime);
  
  // Filter to only slots with available space
  return slots.filter(slot => slot.currentStudents < slot.maxStudents);
}

export async function getLessonSlotById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lessonSlots).where(eq(lessonSlots.id, id)).limit(1);
  return result[0];
}

export async function updateLessonSlot(id: number, updates: Partial<InsertLessonSlot>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(lessonSlots).set(updates).where(eq(lessonSlots.id, id));
}

export async function incrementSlotStudentCount(slotId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const slot = await getLessonSlotById(slotId);
  if (!slot) throw new Error("Slot not found");
  
  return await db.update(lessonSlots)
    .set({ currentStudents: slot.currentStudents + 1 })
    .where(eq(lessonSlots.id, slotId));
}

export async function decrementSlotStudentCount(slotId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const slot = await getLessonSlotById(slotId);
  if (!slot) throw new Error("Slot not found");
  
  const newCount = Math.max(0, slot.currentStudents - 1);
  return await db.update(lessonSlots)
    .set({ currentStudents: newCount })
    .where(eq(lessonSlots.id, slotId));
}

export async function deleteLessonSlot(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(lessonSlots).where(eq(lessonSlots.id, id));
}

// ============ Lesson Booking Functions ============

export async function createLessonBooking(booking: InsertLessonBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(lessonBookings).values(booking);
  return result[0].insertId;
}

export async function getBookingsByMember(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(lessonBookings)
    .where(eq(lessonBookings.memberId, memberId))
    .orderBy(desc(lessonBookings.bookedAt));
}

export async function getActiveBookingsByMember(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(lessonBookings)
    .where(and(
      eq(lessonBookings.memberId, memberId),
      eq(lessonBookings.status, "confirmed")
    ))
    .orderBy(desc(lessonBookings.bookedAt));
}

export async function getBookingsBySlot(slotId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: lessonBookings.id,
      slotId: lessonBookings.slotId,
      memberId: lessonBookings.memberId,
      bookedBy: lessonBookings.bookedBy,
      status: lessonBookings.status,
      attendanceStatus: lessonBookings.attendanceStatus,
      attendanceMarkedBy: lessonBookings.attendanceMarkedBy,
      attendanceMarkedAt: lessonBookings.attendanceMarkedAt,
      attendanceNotes: lessonBookings.attendanceNotes,
      notes: lessonBookings.notes,
      bookedAt: lessonBookings.bookedAt,
      member: members,
      user: users,
    })
    .from(lessonBookings)
    .innerJoin(members, eq(lessonBookings.memberId, members.id))
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(lessonBookings.slotId, slotId));
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lessonBookings).where(eq(lessonBookings.id, id)).limit(1);
  return result[0];
}

export async function updateLessonBooking(id: number, updates: Partial<InsertLessonBooking>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(lessonBookings).set(updates).where(eq(lessonBookings.id, id));
}

export async function cancelLessonBooking(id: number, cancelledAt: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(lessonBookings)
    .set({ 
      status: "cancelled",
      cancelledAt: cancelledAt 
    })
    .where(eq(lessonBookings.id, id));
}

export async function deleteLessonBooking(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(lessonBookings).where(eq(lessonBookings.id, id));
}


// ============ Attendance Tracking Functions ============

export async function markLessonAttendance(
  bookingId: number,
  attendanceStatus: "present" | "absent" | "late",
  markedBy: number,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(lessonBookings)
    .set({
      attendanceStatus,
      attendanceMarkedBy: markedBy,
      attendanceMarkedAt: Date.now(),
      attendanceNotes: notes,
      status: attendanceStatus === "present" ? "completed" : "confirmed",
    })
    .where(eq(lessonBookings.id, bookingId));
}

export async function getStudentAttendanceHistory(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      booking: lessonBookings,
      slot: lessonSlots,
    })
    .from(lessonBookings)
    .innerJoin(lessonSlots, eq(lessonBookings.slotId, lessonSlots.id))
    .where(
      and(
        eq(lessonBookings.memberId, memberId),
        or(
          eq(lessonBookings.attendanceStatus, "present"),
          eq(lessonBookings.attendanceStatus, "absent"),
          eq(lessonBookings.attendanceStatus, "late")
        )
      )
    )
    .orderBy(desc(lessonSlots.startTime));
}

// ============ Progress Notes Functions ============

export async function createProgressNote(note: InsertProgressNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(progressNotes).values(note);
  return result[0].insertId;
}

export async function getStudentProgressNotes(memberId: number, visibleOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(progressNotes.memberId, memberId)];
  if (visibleOnly) {
    conditions.push(eq(progressNotes.isVisibleToParent, true));
  }
  
  return await db
    .select({
      note: progressNotes,
      instructor: users,
    })
    .from(progressNotes)
    .innerJoin(users, eq(progressNotes.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(progressNotes.noteDate));
}

export async function updateProgressNote(noteId: number, updates: Partial<InsertProgressNote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .update(progressNotes)
    .set(updates)
    .where(eq(progressNotes.id, noteId));
}

export async function deleteProgressNote(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(progressNotes).where(eq(progressNotes.id, noteId));
}

// ============ Horse Management Functions ============

export async function createHorse(horse: InsertHorse) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(horses).values(horse);
  return result[0].insertId;
}

export async function getHorsesByOwnerId(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(horses).where(eq(horses.ownerId, ownerId));
}

export async function getHorseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(horses).where(eq(horses.id, id));
  return result[0];
}

export async function updateHorse(id: number, updates: Partial<InsertHorse>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(horses).set(updates).where(eq(horses.id, id));
}

export async function deleteHorse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(horses).where(eq(horses.id, id));
}

// ============ Profile Update Functions ============

export async function updateUserProfilePhoto(userId: number, profilePhotoUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ profilePhotoUrl }).where(eq(users.id, userId));
}

export async function updateMemberRidingInfo(memberId: number, updates: {
  ridingExperienceLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  certifications?: string;
  ridingGoals?: string;
  medicalNotes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(members).set(updates).where(eq(members.id, memberId));
}

export async function getAllStudentsWithRidingInfo() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      memberId: members.id,
      userId: members.userId,
      membershipTier: members.membershipTier,
      phone: members.phone,
      emergencyContact: members.emergencyContact,
      ridingExperienceLevel: members.ridingExperienceLevel,
      certifications: members.certifications,
      ridingGoals: members.ridingGoals,
      medicalNotes: members.medicalNotes,
      dateOfBirth: members.dateOfBirth,
      createdAt: members.createdAt,
      userName: users.name,
      userEmail: users.email,
      profilePhotoUrl: users.profilePhotoUrl,
    })
    .from(members)
    .leftJoin(users, eq(members.userId, users.id))
    .where(eq(members.isChild, false))
    .orderBy(desc(members.createdAt));
  
  return result;
}

// Attendance Analytics
export async function getAttendanceStatsByStudent(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let whereConditions = [eq(lessonBookings.status, "completed")];
  
  if (startDate) {
    whereConditions.push(sql`${lessonSlots.startTime} >= ${startDate.getTime()}`);
  }
  if (endDate) {
    whereConditions.push(sql`${lessonSlots.startTime} <= ${endDate.getTime()}`);
  }
  
  const stats = await db
    .select({
      memberId: lessonBookings.memberId,
      userId: members.userId,
      totalLessons: sql<number>`COUNT(${lessonBookings.id})`,
      presentCount: sql<number>`SUM(CASE WHEN ${lessonBookings.attendanceStatus} = 'present' THEN 1 ELSE 0 END)`,
      lateCount: sql<number>`SUM(CASE WHEN ${lessonBookings.attendanceStatus} = 'late' THEN 1 ELSE 0 END)`,
      absentCount: sql<number>`SUM(CASE WHEN ${lessonBookings.attendanceStatus} = 'absent' THEN 1 ELSE 0 END)`,
      noShowRate: sql<number>`ROUND(SUM(CASE WHEN ${lessonBookings.attendanceStatus} = 'absent' THEN 1 ELSE 0 END) * 100.0 / COUNT(${lessonBookings.id}), 2)`,
    })
    .from(lessonBookings)
    .leftJoin(members, eq(lessonBookings.memberId, members.id))
    .leftJoin(lessonSlots, eq(lessonBookings.slotId, lessonSlots.id))
    .where(and(...whereConditions))
    .groupBy(lessonBookings.memberId, members.userId);


  
  // Get user names
  const statsWithNames = await Promise.all(
    stats.map(async (stat) => {
      const user = await getUserById(stat.userId);
      return {
        ...stat,
        memberName: user?.name || "Unknown",
        userEmail: user?.email || "",
      };
    })
  );
  
  return statsWithNames;
}

export async function getMonthlyAttendanceSummary(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  
  const startOfMonth = new Date(year, month - 1, 1).getTime();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59).getTime();
  
  const summary = await db
    .select({
      date: sql<string>`DATE(${lessonSlots.startTime} / 1000, 'unixepoch')`,
      totalLessons: sql<number>`COUNT(${lessonBookings.id})`,
      presentCount: sql<number>`SUM(CASE WHEN ${lessonBookings.attendanceStatus} = 'present' THEN 1 ELSE 0 END)`,
      lateCount: sql<number>`SUM(CASE WHEN ${lessonBookings.attendanceStatus} = 'late' THEN 1 ELSE 0 END)`,
      absentCount: sql<number>`SUM(CASE WHEN ${lessonBookings.attendanceStatus} = 'absent' THEN 1 ELSE 0 END)`,
    })
    .from(lessonBookings)
    .leftJoin(lessonSlots, eq(lessonBookings.slotId, lessonSlots.id))
    .where(
      and(
        eq(lessonBookings.status, "completed"),
        sql`${lessonSlots.startTime} >= ${startOfMonth}`,
        sql`${lessonSlots.startTime} <= ${endOfMonth}`
      )
    )
    .groupBy(sql`DATE(${lessonSlots.startTime} / 1000, 'unixepoch')`)
    .orderBy(sql`DATE(${lessonSlots.startTime} / 1000, 'unixepoch')`);
  
  return summary;
}

export async function getOverallAttendanceStats(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;
  
  let whereConditions = [eq(lessonBookings.status, "confirmed")];
  
  if (startDate) {
    whereConditions.push(sql`${lessonBookings.startTime} >= ${startDate.getTime()}`);
  }
  if (endDate) {
    whereConditions.push(sql`${lessonBookings.startTime} <= ${endDate.getTime()}`);
  }
  
  const result = await db
    .select({
      totalLessons: sql<number>`COUNT(${lessonBookings.id})`,
      totalStudents: sql<number>`COUNT(DISTINCT ${lessonBookings.memberId})`,
      presentCount: sql<number>`SUM(CASE WHEN ${lessonBookings.attendanceStatus} = 'present' THEN 1 ELSE 0 END)`,
      lateCount: sql<number>`SUM(CASE WHEN ${lessonBookings.attendanceStatus} = 'late' THEN 1 ELSE 0 END)`,
      absentCount: sql<number>`SUM(CASE WHEN ${lessonBookings.attendanceStatus} = 'absent' THEN 1 ELSE 0 END)`,
      attendanceRate: sql<number>`ROUND((SUM(CASE WHEN ${lessonBookings.attendanceStatus} IN ('present', 'late') THEN 1 ELSE 0 END) * 100.0) / COUNT(${lessonBookings.id}), 2)`,
      noShowRate: sql<number>`ROUND((SUM(CASE WHEN ${lessonBookings.attendanceStatus} = 'absent' THEN 1 ELSE 0 END) * 100.0) / COUNT(${lessonBookings.id}), 2)`,
    })
    .from(lessonBookings)
    .where(and(...whereConditions));
  
  return result[0] || null;
}

export async function getDetailedAttendanceRecords(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let whereConditions = [eq(lessonBookings.status, "confirmed")];
  
  if (startDate) {
    whereConditions.push(sql`${lessonBookings.startTime} >= ${startDate.getTime()}`);
  }
  if (endDate) {
    whereConditions.push(sql`${lessonBookings.startTime} <= ${endDate.getTime()}`);
  }
  
  const records = await db
    .select({
      bookingId: lessonBookings.id,
      memberId: lessonBookings.memberId,
      userId: members.userId,
      slotId: lessonBookings.slotId,
      startTime: lessonBookings.startTime,
      endTime: lessonBookings.endTime,
      attendanceStatus: lessonBookings.attendanceStatus,
      attendanceMarkedAt: lessonBookings.attendanceMarkedAt,
      attendanceNotes: lessonBookings.attendanceNotes,
    })
    .from(lessonBookings)
    .leftJoin(members, eq(lessonBookings.memberId, members.id))
    .where(and(...whereConditions))
    .orderBy(desc(lessonBookings.startTime));
  
  // Get user names and slot details
  const recordsWithDetails = await Promise.all(
    records.map(async (record) => {
      const user = await getUserById(record.userId);
      const slot = await getLessonSlotById(record.slotId);
      return {
        ...record,
        memberName: user?.name || "Unknown",
        userEmail: user?.email || "",
        slotTitle: slot?.title || "Lesson",
      };
    })
  );
  
  return recordsWithDetails;
}

// ============ Account Status Functions ============

export async function getPendingUsers() {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select()
    .from(users)
    .where(eq(users.accountStatus, 'pending'))
    .orderBy(users.createdAt);
  return result;
}

export async function updateUserAccountStatus(userId: number, status: 'approved' | 'rejected') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(users)
    .set({ accountStatus: status })
    .where(eq(users.id, userId));
}
