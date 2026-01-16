import { pgTable, pgEnum, serial, integer, text, timestamp, varchar, boolean, bigint, index } from "drizzle-orm/pg-core";

// Define all enums first (PostgreSQL requirement)
export const roleEnum = pgEnum("role", ["user", "admin", "staff"]);
export const accountStatusEnum = pgEnum("accountStatus", ["pending", "approved", "rejected"]);
export const membershipTierEnum = pgEnum("membershipTier", ["bronze", "silver", "gold"]);
export const horseManagementLevelEnum = pgEnum("horseManagementLevel", ["d1", "d2", "d3", "c1", "c2", "c3", "hb", "ha"]);
export const checkInTypeEnum = pgEnum("checkInType", ["lesson", "event", "other"]);
export const sourceEnum = pgEnum("source", ["staff_scanner", "student_self", "manual_entry", "qr_self"]);
export const programEnum = pgEnum("program", ["lesson", "horse_management", "camp", "pony_club", "event", "other"]);
export const statusEnum = pgEnum("status", ["pending", "approved", "rejected", "confirmed", "cancelled", "rescheduled", "completed", "attending", "not_attending", "maybe", "waitlist", "active", "archived"]);
export const lessonTypeEnum = pgEnum("lessonType", ["private", "group", "horsemanship"]);
export const attendanceStatusEnum = pgEnum("attendanceStatus", ["pending", "present", "absent", "late"]);
export const categoryEnum = pgEnum("category", ["skill_progress", "behavior", "achievement", "goal", "concern", "general", "riding_skill", "horse_care", "competition", "certification", "other"]);
export const genderEnum = pgEnum("gender", ["mare", "gelding", "stallion"]);
export const eventTypeEnum = pgEnum("eventType", ["competition", "show", "clinic", "social", "riding_lesson", "horsemanship_lesson", "other"]);
export const recurrencePatternEnum = pgEnum("recurrencePattern", ["daily", "weekly", "biweekly", "monthly"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  accountStatus: accountStatusEnum("accountStatus").default("pending").notNull(),
  profilePhotoUrl: text("profilePhotoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Member profiles with membership tiers and parent-child relationships
 */
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  membershipTier: membershipTierEnum("membershipTier").default("bronze").notNull(),
  acuityClientId: varchar("acuityClientId", { length: 128 }),
  phone: varchar("phone", { length: 32 }),
  emergencyContactName: varchar("emergencyContactName", { length: 255 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 32 }),
  emergencyContactRelationship: varchar("emergencyContactRelationship", { length: 128 }),
  parentId: integer("parentId"), // Reference to parent member if this is a child
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
  horseManagementLevel: horseManagementLevelEnum("horseManagementLevel"),
  ridingCertifications: text("ridingCertifications"), // e.g., "D-2 Eventing, C-1 Dressage"
  otherCertifications: text("otherCertifications"), // Other non-Pony Club certifications
  ridingGoals: text("ridingGoals"),
  medicalNotes: text("medicalNotes"),
  qrCode: varchar("qrCode", { length: 128 }).unique(), // Unique QR code for check-in
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Check-in logs for lesson attendance
 */
export const checkIns = pgTable("checkIns", {
  id: serial("id").primaryKey(),
  memberId: integer("memberId").notNull(),
  checkedInBy: integer("checkedInBy").notNull(), // User ID who checked in
  checkInTime: bigint("checkInTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  checkInType: checkInTypeEnum("checkInType").default("lesson").notNull(),
  source: sourceEnum("source").default("staff_scanner").notNull(),
  program: programEnum("program").default("lesson").notNull(),
  status: statusEnum("status").default("pending").notNull(),
  verifiedBy: integer("verifiedBy"), // Staff user ID who approved/rejected
  verifiedAt: timestamp("verifiedAt"), // When the check-in was verified
  appointmentId: varchar("appointmentId", { length: 128 }), // For Acuity integration
  lessonDate: timestamp("lessonDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  memberTimeIdx: index("idx_checkins_member_time").on(table.memberId, table.checkInTime),
}));

/**
 * Contract templates and assignments
 */
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content"), // Full contract text content
  googleDocId: varchar("googleDocId", { length: 255 }), // Google Doc ID for template
  googleDocUrl: text("googleDocUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  requiresSignature: boolean("requiresSignature").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Contract signatures and signed documents
 */
export const contractSignatures = pgTable("contractSignatures", {
  id: serial("id").primaryKey(),
  contractId: integer("contractId").notNull(),
  memberId: integer("memberId").notNull(),
  signedBy: integer("signedBy").notNull(), // User ID who signed
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
export const contractAssignments = pgTable("contractAssignments", {
  id: serial("id").primaryKey(),
  contractId: integer("contractId").notNull(),
  memberId: integer("memberId").notNull(),
  assignedBy: integer("assignedBy").notNull(), // Admin/staff who assigned
  dueDate: timestamp("dueDate"),
  isSigned: boolean("isSigned").default(false).notNull(),
  reminderSent: boolean("reminderSent").default(false).notNull(),
  firstReminderSentAt: timestamp("firstReminderSentAt"), // 3-day reminder
  finalReminderSentAt: timestamp("finalReminderSentAt"), // 7-day reminder
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Member uploaded documents (medical forms, insurance, etc.)
 */
export const memberDocuments = pgTable("memberDocuments", {
  id: serial("id").primaryKey(),
  memberId: integer("memberId").notNull(),
  documentType: varchar("documentType", { length: 100 }).notNull(), // 'medical_form', 'insurance_certificate', 'photo_release', 'emergency_contact', 'other'
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(), // S3 URL
  fileSize: integer("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  uploadedBy: integer("uploadedBy").notNull(), // User who uploaded (member or admin)
  notes: text("notes"), // Optional notes about the document
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Announcements and news
 */
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: integer("authorId").notNull(),
  targetTiers: text("targetTiers"), // JSON array of tiers: ["bronze", "silver", "gold"]
  isPublished: boolean("isPublished").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Messages between parents and staff
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("senderId").notNull(),
  recipientId: integer("recipientId").notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  parentMessageId: integer("parentMessageId"), // For threading replies
  sentAt: bigint("sentAt", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Acuity appointments cache
 */
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  memberId: integer("memberId").notNull(),
  acuityAppointmentId: varchar("acuityAppointmentId", { length: 128 }).notNull(),
  appointmentType: varchar("appointmentType", { length: 255 }),
  startTime: bigint("startTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  endTime: bigint("endTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  status: varchar("status", { length: 64 }),
  notes: text("notes"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Lesson time slots available for booking
 */
export const lessonSlots = pgTable("lessonSlots", {
  id: serial("id").primaryKey(),
  startTime: bigint("startTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  endTime: bigint("endTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  lessonType: lessonTypeEnum("lessonType").notNull(),
  maxStudents: integer("maxStudents").default(1).notNull(), // 1 for private, 4 for group
  currentStudents: integer("currentStudents").default(0).notNull(), // Track how many booked
  instructorName: varchar("instructorName", { length: 255 }),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  isRecurring: boolean("isRecurring").default(false).notNull(), // For Sunday horsemanship
  recurringSeriesId: integer("recurringSeriesId"), // Link to recurring series if applicable
  googleCalendarEventId: varchar("googleCalendarEventId", { length: 255 }), // For future Google Calendar sync
  createdBy: integer("createdBy").notNull(), // Staff user who created the slot
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Student lesson bookings - links students to lesson slots
 */
export const lessonBookings = pgTable("lessonBookings", {
  id: serial("id").primaryKey(),
  slotId: integer("slotId").notNull(),
  memberId: integer("memberId").notNull(),
  status: statusEnum("status").default("confirmed").notNull(),
  attendanceStatus: attendanceStatusEnum("attendanceStatus").default("pending").notNull(),
  bookedAt: bigint("bookedAt", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  cancelledAt: bigint("cancelledAt", { mode: "number" }), // Unix timestamp in milliseconds
  cancellationReason: text("cancellationReason"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Progress notes from instructors about students
 */
export const progressNotes = pgTable("progressNotes", {
  id: serial("id").primaryKey(),
  memberId: integer("memberId").notNull(),
  authorId: integer("authorId").notNull(), // Staff/instructor who wrote the note
  category: categoryEnum("category").default("general").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isPrivate: boolean("isPrivate").default(false).notNull(), // If true, only visible to staff
  linkedLessonId: integer("linkedLessonId"), // Optional link to a specific lesson
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Horse profiles
 */
export const horses = pgTable("horses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  breed: varchar("breed", { length: 255 }),
  age: integer("age"),
  gender: genderEnum("gender"),
  color: varchar("color", { length: 100 }),
  height: varchar("height", { length: 50 }), // e.g., "15.2 hands"
  temperament: text("temperament"),
  specialNeeds: text("specialNeeds"),
  isAvailableForLessons: boolean("isAvailableForLessons").default(true).notNull(),
  photoUrl: text("photoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Horse assignments to lessons
 */
export const horseAssignments = pgTable("horseAssignments", {
  id: serial("id").primaryKey(),
  horseId: integer("horseId").notNull(),
  lessonId: integer("lessonId").notNull(),
  memberId: integer("memberId").notNull(),
  assignedBy: integer("assignedBy").notNull(), // Staff who made the assignment
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Events (competitions, shows, clinics, social events)
 */
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: eventTypeEnum("eventType").default("other").notNull(),
  startTime: bigint("startTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  endTime: bigint("endTime", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  location: varchar("location", { length: 500 }),
  maxParticipants: integer("maxParticipants"),
  currentParticipants: integer("currentParticipants").default(0).notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  recurrencePattern: recurrencePatternEnum("recurrencePattern"),
  recurrenceEndDate: bigint("recurrenceEndDate", { mode: "number" }), // Unix timestamp in milliseconds
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Event registrations
 */
export const eventRegistrations = pgTable("eventRegistrations", {
  id: serial("id").primaryKey(),
  eventId: integer("eventId").notNull(),
  memberId: integer("memberId").notNull(),
  status: statusEnum("status").default("attending").notNull(),
  registeredAt: bigint("registeredAt", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Student goals for Pony Club certifications and skills
 */
export const studentGoals = pgTable("studentGoals", {
  id: serial("id").primaryKey(),
  memberId: integer("memberId").notNull(),
  category: categoryEnum("category").default("riding_skill").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetDate: bigint("targetDate", { mode: "number" }), // Unix timestamp in milliseconds
  progress: integer("progress").default(0).notNull(), // 0-100 percentage
  status: statusEnum("status").default("active").notNull(),
  createdBy: integer("createdBy").notNull(), // Student or staff who created the goal
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  memberStatusIdx: index("idx_goals_member_status").on(table.memberId, table.status),
}));

/**
 * Goal progress updates and audit trail
 */
export const goalProgressUpdates = pgTable("goalProgressUpdates", {
  id: serial("id").primaryKey(),
  goalId: integer("goalId").notNull(),
  updatedBy: integer("updatedBy").notNull(), // Staff or student who updated
  previousProgress: integer("previousProgress").notNull(),
  newProgress: integer("newProgress").notNull(),
  progressChange: integer("progressChange").notNull(), // Calculated: newProgress - previousProgress
  notes: text("notes"),
  updateDate: bigint("updateDate", { mode: "number" }).notNull(), // Unix timestamp in milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  goalDateIdx: index("idx_progress_goal_date").on(table.goalId, table.updateDate),
}));
