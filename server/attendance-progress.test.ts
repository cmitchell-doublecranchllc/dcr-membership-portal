import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Attendance Tracking and Progress Notes", () => {
  let testUserId: number;
  let testMemberId: number;
  let testSlotId: number;
  let testBookingId: number;
  let testNoteId: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-attendance-user",
      name: "Test Student",
      email: "student@test.com",
      role: "user",
    });

    const user = await db.getUserByOpenId("test-attendance-user");
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // Create test member
    testMemberId = await db.createMember({
      userId: testUserId,
      membershipTier: "silver",
      phone: "+1234567890",
    });

    // Create test lesson slot
    const now = Date.now();
    const pastTime = now - 2 * 60 * 60 * 1000; // 2 hours ago
    testSlotId = await db.createLessonSlot({
      startTime: pastTime,
      endTime: pastTime + 60 * 60 * 1000,
      lessonType: "private",
      maxStudents: 1,
      currentStudents: 0,
      createdBy: testUserId,
    });

    // Create test booking
    testBookingId = await db.createLessonBooking({
      slotId: testSlotId,
      memberId: testMemberId,
      bookedBy: testUserId,
      status: "confirmed",
      bookedAt: pastTime - 24 * 60 * 60 * 1000,
    });
  });

  describe("Attendance Tracking", () => {
    it("should mark attendance as present", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.lessons.markAttendance({
        bookingId: testBookingId,
        attendanceStatus: "present",
        notes: "Great lesson today!",
      });

      expect(result.success).toBe(true);

      // Verify attendance was marked
      const booking = await db.getBookingById(testBookingId);
      expect(booking?.attendanceStatus).toBe("present");
      expect(booking?.attendanceNotes).toBe("Great lesson today!");
      expect(booking?.attendanceMarkedBy).toBe(testUserId);
      expect(booking?.attendanceMarkedAt).toBeDefined();
    });

    it("should mark attendance as absent", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "staff" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.lessons.markAttendance({
        bookingId: testBookingId,
        attendanceStatus: "absent",
      });

      expect(result.success).toBe(true);

      const booking = await db.getBookingById(testBookingId);
      expect(booking?.attendanceStatus).toBe("absent");
    });

    it("should mark attendance as late", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.lessons.markAttendance({
        bookingId: testBookingId,
        attendanceStatus: "late",
        notes: "Arrived 15 minutes late",
      });

      expect(result.success).toBe(true);

      const booking = await db.getBookingById(testBookingId);
      expect(booking?.attendanceStatus).toBe("late");
      expect(booking?.attendanceNotes).toBe("Arrived 15 minutes late");
    });

    it("should get student attendance history", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const history = await caller.lessons.getStudentAttendance({
        memberId: testMemberId,
      });

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].booking.attendanceStatus).toBeDefined();
    });

    it("should allow students to view their own attendance", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      const history = await caller.lessons.getMyAttendance();

      expect(Array.isArray(history)).toBe(true);
    });

    it("should not allow non-staff to mark attendance", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.lessons.markAttendance({
          bookingId: testBookingId,
          attendanceStatus: "present",
        })
      ).rejects.toThrow();
    });
  });

  describe("Progress Notes", () => {
    it("should create a progress note", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.lessons.addProgressNote({
        memberId: testMemberId,
        category: "skill_progress",
        title: "Improved posting trot",
        content: "Student showed significant improvement in posting trot today. Maintaining better rhythm and balance.",
        isVisibleToParent: true,
      });

      expect(result.success).toBe(true);
      expect(result.noteId).toBeDefined();
      testNoteId = result.noteId!;
    });

    it("should get student progress notes", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const notes = await caller.lessons.getStudentProgressNotes({
        memberId: testMemberId,
      });

      expect(Array.isArray(notes)).toBe(true);
      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0].note.title).toBe("Improved posting trot");
      expect(notes[0].note.category).toBe("skill_progress");
      expect(notes[0].instructor).toBeDefined();
    });

    it("should allow students to view their own progress notes", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      const notes = await caller.lessons.getMyProgressNotes();

      expect(Array.isArray(notes)).toBe(true);
      // Notes should only include those marked as visible to parent
      if (notes.length > 0) {
        expect(notes.every(n => n.note.isVisibleToParent)).toBe(true);
      }
    });

    it("should create notes with different categories", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "staff" },
        req: {} as any,
        res: {} as any,
      });

      const categories = ["behavior", "achievement", "goal", "concern", "general"] as const;

      for (const category of categories) {
        const result = await caller.lessons.addProgressNote({
          memberId: testMemberId,
          category,
          title: `Test ${category} note`,
          content: `This is a test note for ${category}`,
          isVisibleToParent: true,
        });

        expect(result.success).toBe(true);
      }

      const notes = await caller.lessons.getStudentProgressNotes({
        memberId: testMemberId,
      });

      expect(notes.length).toBeGreaterThanOrEqual(6); // Original + 5 new ones
    });

    it("should create private notes not visible to parents", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.lessons.addProgressNote({
        memberId: testMemberId,
        category: "concern",
        title: "Private instructor note",
        content: "This note is for staff only",
        isVisibleToParent: false,
      });

      expect(result.success).toBe(true);

      // Staff should see all notes
      const staffNotes = await caller.lessons.getStudentProgressNotes({
        memberId: testMemberId,
      });
      const privateNote = staffNotes.find(n => n.note.title === "Private instructor note");
      expect(privateNote).toBeDefined();

      // Student should not see private notes
      const studentCaller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      const studentNotes = await studentCaller.lessons.getMyProgressNotes();
      const privateNoteVisible = studentNotes.find(n => n.note.title === "Private instructor note");
      expect(privateNoteVisible).toBeUndefined();
    });

    it("should update a progress note", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.lessons.updateProgressNote({
        noteId: testNoteId,
        title: "Updated: Improved posting trot",
        content: "Updated content with more details",
      });

      expect(result.success).toBe(true);

      const notes = await caller.lessons.getStudentProgressNotes({
        memberId: testMemberId,
      });

      const updatedNote = notes.find(n => n.note.id === testNoteId);
      expect(updatedNote?.note.title).toBe("Updated: Improved posting trot");
      expect(updatedNote?.note.content).toBe("Updated content with more details");
    });

    it("should delete a progress note", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.lessons.deleteProgressNote({
        noteId: testNoteId,
      });

      expect(result.success).toBe(true);

      const notes = await caller.lessons.getStudentProgressNotes({
        memberId: testMemberId,
      });

      const deletedNote = notes.find(n => n.note.id === testNoteId);
      expect(deletedNote).toBeUndefined();
    });

    it("should not allow non-staff to create progress notes", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-attendance-user", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.lessons.addProgressNote({
          memberId: testMemberId,
          category: "general",
          title: "Unauthorized note",
          content: "This should fail",
          isVisibleToParent: true,
        })
      ).rejects.toThrow();
    });
  });
});
