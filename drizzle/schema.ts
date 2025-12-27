import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "staff"]).default("user").notNull(),
  accountStatus: mysqlEnum("accountStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  profilePhotoUrl: text("profilePhotoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Member profiles with membership tiers and parent-child relationships
 */
export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  membershipTier: mysqlEnum("membershipTier", ["bronze", "silver", "gold"]).default("bronze").notNull(),
  acuityClientId: varchar("acuityClientId", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  emergencyContactName: varchar("emergencyContactName", { length: 255 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 32 }),
  emergencyContactRelationship: varchar("emergencyContactRelationship", { length: 128 }),
  parentId: int("parentId"), // Reference to parent member if this is a child
  isChild: boolean("isChild").default(false).notNull(),
  dateOfBirth: timestamp("dateOfBirth"),
  allergies: text("allergies"),
  medications: text("medications"),
  // Consent and legal
  photoConsent: boolean("photoConsent").default(false).notNull(),
  smsConsent: boolean("smsConsent").default(false).notNull(),
  liabilityWaiverSigned: boolean("liabilityWaiverSigned").default(false).notNull(),
  liabilityWaiverSignedAt: timestamp("liabilityWaiverSignedAt"),
  liabilityWaiverSignatureData: text("liabilityWaiverSignatureData"),
  // Pony Club Certifications
  horseManagementLevel: mysqlEnum("horseManagementLevel", [
    "d1",
    "d2",
    "d3",
    "c1",
    "c2",
    "c3",
    "hb",
    "ha"
  ]),
  ridingCertifications: text("ridingCertifications"), // e.g., "D-2 Eventing, C-1 Dressage"
  otherCertifications: text("otherCertifications"), // Other non-Pony Club certifications
  ridingGoals: text("ridingGoals"),
  medicalNotes: text("medicalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Check-in logs for lesson attendance
 */
export const checkIns = mysqlTable("checkIns", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  checkedInBy: int("checkedInBy").notNull(), // User ID who checked in
  checkInTime: bigint("checkInTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  lessonDate: timestamp("lessonDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Contract templates and assignments
 */
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"), // Full contract text content
  googleDocId: varchar("googleDocId", { length: 255 }), // Google Doc ID for template
  googleDocUrl: text("googleDocUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  requiresSignature: boolean("requiresSignature").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Contract signatures and signed documents
 */
export const contractSignatures = mysqlTable("contractSignatures", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  memberId: int("memberId").notNull(),
  signedBy: int("signedBy").notNull(), // User ID who signed
  signatureData: text("signatureData"), // Base64 encoded signature image
  signedPdfUrl: text("signedPdfUrl"), // URL to signed PDF in Google Drive or S3
  signedPdfKey: varchar("signedPdfKey", { length: 512 }), // S3 key for signed PDF
  googleDriveFileId: varchar("googleDriveFileId", { length: 255 }),
  signedAt: bigint("signedAt", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Contract assignments to members
 */
export const contractAssignments = mysqlTable("contractAssignments", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  memberId: int("memberId").notNull(),
  assignedBy: int("assignedBy").notNull(), // Admin/staff who assigned
  dueDate: timestamp("dueDate"),
  isSigned: boolean("isSigned").default(false).notNull(),
  reminderSent: boolean("reminderSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Announcements and news
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: int("authorId").notNull(),
  targetTiers: text("targetTiers"), // JSON array of tiers: ["bronze", "silver", "gold"]
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Messages between parents and staff
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  parentMessageId: int("parentMessageId"), // For threading replies
  sentAt: bigint("sentAt", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Acuity appointments cache
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  acuityAppointmentId: varchar("acuityAppointmentId", { length: 128 }).notNull(),
  appointmentType: varchar("appointmentType", { length: 255 }),
  startTime: bigint("startTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  endTime: bigint("endTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  status: varchar("status", { length: 64 }),
  notes: text("notes"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Lesson time slots available for booking
 * Staff creates these slots manually, students book them
 */
export const lessonSlots = mysqlTable("lessonSlots", {
  id: int("id").autoincrement().primaryKey(),
  startTime: bigint("startTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  endTime: bigint("endTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  lessonType: mysqlEnum("lessonType", ["private", "group", "horsemanship"]).notNull(),
  maxStudents: int("maxStudents").default(1).notNull(), // 1 for private, 4 for group
  currentStudents: int("currentStudents").default(0).notNull(), // Track how many booked
  instructorName: varchar("instructorName", { length: 255 }),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  isRecurring: boolean("isRecurring").default(false).notNull(), // For Sunday horsemanship
  recurringSeriesId: int("recurringSeriesId"), // Link to recurring series if applicable
  googleCalendarEventId: varchar("googleCalendarEventId", { length: 255 }), // For future Google Calendar sync
  createdBy: int("createdBy").notNull(), // Staff user who created the slot
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Student lesson bookings - links students to lesson slots
 */
export const lessonBookings = mysqlTable("lessonBookings", {
  id: int("id").autoincrement().primaryKey(),
  slotId: int("slotId").notNull(), // Reference to lessonSlots
  memberId: int("memberId").notNull(), // Student who booked
  bookedBy: int("bookedBy").notNull(), // User ID who made the booking (parent or student)
  status: mysqlEnum("status", ["confirmed", "cancelled", "rescheduled", "completed"]).default("confirmed").notNull(),
  rescheduledFromSlotId: int("rescheduledFromSlotId"), // Original slot if this was rescheduled
  rescheduledToSlotId: int("rescheduledToSlotId"), // New slot if this was rescheduled
  rescheduleCount: int("rescheduleCount").default(0).notNull(), // Track how many times rescheduled
  notes: text("notes"),
  bookedAt: bigint("bookedAt", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  cancelledAt: bigint("cancelledAt", { mode: "number" }), // Unix timestamp if cancelled
  
  // Attendance tracking
  attendanceStatus: mysqlEnum("attendanceStatus", ["pending", "present", "absent", "late"]).default("pending").notNull(),
  attendanceMarkedBy: int("attendanceMarkedBy"), // Staff user who marked attendance
  attendanceMarkedAt: bigint("attendanceMarkedAt", { mode: "number" }), // Unix timestamp when marked
  attendanceNotes: text("attendanceNotes"), // Staff notes about attendance
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Student progress notes - instructor documentation of student achievements and skill progression
 */
export const progressNotes = mysqlTable("progressNotes", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(), // Student this note is about
  lessonBookingId: int("lessonBookingId"), // Optional link to specific lesson
  createdBy: int("createdBy").notNull(), // Instructor/staff who wrote the note
  noteDate: bigint("noteDate", { mode: "number" }).notNull(), // Unix timestamp of when note was written
  category: mysqlEnum("category", ["skill_progress", "behavior", "achievement", "goal", "concern", "general"]).default("general").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(), // The actual note content
  isVisibleToParent: boolean("isVisibleToParent").default(true).notNull(), // Control visibility to parents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Horse ownership tracking - members can register their horses
 */
export const horses = mysqlTable("horses", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // Member ID who owns the horse
  name: varchar("name", { length: 255 }).notNull(),
  breed: varchar("breed", { length: 255 }),
  age: int("age"),
  color: varchar("color", { length: 100 }),
  gender: mysqlEnum("gender", ["mare", "gelding", "stallion"]),
  height: varchar("height", { length: 50 }), // e.g., "15.2 hands"
  temperament: text("temperament"),
  specialNeeds: text("specialNeeds"),
  vetInfo: text("vetInfo"), // Vet contact and medical info
  photoUrl: text("photoUrl"),
  isBoarded: boolean("isBoarded").default(false).notNull(), // Boarded at the facility
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;

export type LessonSlot = typeof lessonSlots.$inferSelect;
export type InsertLessonSlot = typeof lessonSlots.$inferInsert;

export type LessonBooking = typeof lessonBookings.$inferSelect;
export type InsertLessonBooking = typeof lessonBookings.$inferInsert;

export type ProgressNote = typeof progressNotes.$inferSelect;
export type InsertProgressNote = typeof progressNotes.$inferInsert;

export type Horse = typeof horses.$inferSelect;
export type InsertHorse = typeof horses.$inferInsert;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

export type ContractSignature = typeof contractSignatures.$inferSelect;
export type InsertContractSignature = typeof contractSignatures.$inferInsert;

export type ContractAssignment = typeof contractAssignments.$inferSelect;
export type InsertContractAssignment = typeof contractAssignments.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Events and competitions
 */
/**
 * Recurring event series - defines the pattern for recurring events
 */
export const recurringEventSeries = mysqlTable("recurring_event_series", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: mysqlEnum("eventType", ["competition", "show", "clinic", "social", "riding_lesson", "horsemanship_lesson", "other"]).default("other").notNull(),
  location: varchar("location", { length: 255 }),
  capacity: int("capacity"),
  requiresRsvp: boolean("requiresRsvp").default(false).notNull(),
  
  // Recurrence pattern
  recurrencePattern: mysqlEnum("recurrencePattern", ["daily", "weekly", "biweekly", "monthly"]).notNull(),
  daysOfWeek: varchar("daysOfWeek", { length: 50 }), // Comma-separated: "1,3,5" for Mon,Wed,Fri
  
  // Time for each occurrence
  startTimeOfDay: varchar("startTimeOfDay", { length: 8 }).notNull(), // "09:00:00"
  durationMinutes: int("durationMinutes").notNull(), // Duration in minutes
  
  // Series bounds
  seriesStartDate: bigint("seriesStartDate", { mode: "number" }).notNull(), // First occurrence date
  seriesEndDate: bigint("seriesEndDate", { mode: "number" }), // Last occurrence date (null = ongoing)
  maxOccurrences: int("maxOccurrences"), // Alternative to end date
  
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(), // Can deactivate series
});

export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: mysqlEnum("eventType", ["competition", "show", "clinic", "social", "riding_lesson", "horsemanship_lesson", "other"]).default("other").notNull(),
  location: varchar("location", { length: 255 }),
  startTime: bigint("startTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  endTime: bigint("endTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  capacity: int("capacity"), // Max attendees, null = unlimited
  
  // Recurring event linkage
  recurringSeriesId: int("recurringSeriesId"), // Links to recurring_event_series if part of series
  recurrenceException: boolean("recurrenceException").default(false).notNull(), // true if this occurrence was modified
  requiresRsvp: boolean("requiresRsvp").default(true).notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  createdBy: int("createdBy").notNull(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Event RSVPs
 */
export const eventRsvps = mysqlTable("eventRsvps", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  memberId: int("memberId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["attending", "not_attending", "maybe", "waitlist"]).default("attending").notNull(),
  guestCount: int("guestCount").default(0).notNull(), // Number of additional guests
  notes: text("notes"),
  rsvpedAt: bigint("rsvpedAt", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecurringEventSeries = typeof recurringEventSeries.$inferSelect;
export type InsertRecurringEventSeries = typeof recurringEventSeries.$inferInsert;

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = typeof eventRsvps.$inferInsert;

/**
 * Onboarding checklist for new members
 */
export const onboardingChecklist = mysqlTable("onboardingChecklist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemKey: varchar("itemKey", { length: 128 }).notNull(), // e.g., "upload_profile_photo", "review_facility_rules"
  itemTitle: varchar("itemTitle", { length: 255 }).notNull(),
  itemDescription: text("itemDescription"),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OnboardingChecklistItem = typeof onboardingChecklist.$inferSelect;
export type InsertOnboardingChecklistItem = typeof onboardingChecklist.$inferInsert;
