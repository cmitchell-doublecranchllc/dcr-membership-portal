import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("New Event Types", () => {
  let testUserId: number;
  let ridingLessonEventId: number;
  let horsemanshipLessonEventId: number;

  beforeAll(async () => {
    // Create test admin user
    await db.upsertUser({
      openId: "test-event-types-admin",
      name: "Test Admin",
      email: "admin@test.com",
      role: "admin",
    });

    const user = await db.getUserByOpenId("test-event-types-admin");
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;
  });

  describe("Riding Lesson Event Type", () => {
    it("should create a riding lesson event", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-event-types-admin", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const now = Date.now();
      const startTime = now + 24 * 60 * 60 * 1000; // Tomorrow
      const endTime = startTime + 60 * 60 * 1000; // 1 hour later

      const result = await caller.events.createEvent({
        title: "Beginner Riding Lesson",
        description: "Introduction to basic riding techniques",
        eventType: "riding_lesson",
        location: "Main Arena",
        startTime,
        endTime,
        capacity: 6,
        requiresRsvp: true,
        isPublished: true,
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      ridingLessonEventId = result.eventId!;
    });

    it("should retrieve the riding lesson event", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-event-types-admin", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const events = await caller.events.getEvents();
      const ridingLesson = events.find(e => e.id === ridingLessonEventId);

      expect(ridingLesson).toBeDefined();
      expect(ridingLesson?.eventType).toBe("riding_lesson");
      expect(ridingLesson?.title).toBe("Beginner Riding Lesson");
    });
  });

  describe("Horsemanship Lesson Event Type", () => {
    it("should create a horsemanship lesson event", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-event-types-admin", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const now = Date.now();
      const startTime = now + 48 * 60 * 60 * 1000; // Day after tomorrow
      const endTime = startTime + 90 * 60 * 1000; // 1.5 hours later

      const result = await caller.events.createEvent({
        title: "Horse Care and Grooming",
        description: "Learn proper horse care, grooming techniques, and stable management",
        eventType: "horsemanship_lesson",
        location: "Stable Area",
        startTime,
        endTime,
        capacity: 8,
        requiresRsvp: true,
        isPublished: true,
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      horsemanshipLessonEventId = result.eventId!;
    });

    it("should retrieve the horsemanship lesson event", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-event-types-admin", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const events = await caller.events.getEvents();
      const horsemanshipLesson = events.find(e => e.id === horsemanshipLessonEventId);

      expect(horsemanshipLesson).toBeDefined();
      expect(horsemanshipLesson?.eventType).toBe("horsemanship_lesson");
      expect(horsemanshipLesson?.title).toBe("Horse Care and Grooming");
    });
  });

  describe("Recurring Event Series with New Types", () => {
    it("should create a recurring riding lesson series", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-event-types-admin", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const now = Date.now();
      const firstOccurrence = now + 7 * 24 * 60 * 60 * 1000; // Next week

      const result = await caller.recurringEvents.createSeries({
        title: "Weekly Riding Lessons",
        description: "Regular weekly riding instruction",
        eventType: "riding_lesson",
        location: "Main Arena",
        capacity: 6,
        requiresRsvp: true,
        recurrencePattern: "weekly",
        startTimeOfDay: "10:00:00",
        durationMinutes: 60,
        seriesStartDate: firstOccurrence,
        maxOccurrences: 4,
      });

      expect(result.success).toBe(true);
      expect(result.seriesId).toBeDefined();
      expect(result.eventIds).toBeDefined();
      expect(result.eventIds!.length).toBe(4);
    });

    it("should create a recurring horsemanship lesson series", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-event-types-admin", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const now = Date.now();
      const firstOccurrence = now + 10 * 24 * 60 * 60 * 1000; // 10 days from now

      const result = await caller.recurringEvents.createSeries({
        title: "Biweekly Horsemanship Workshop",
        description: "Advanced horse care and management",
        eventType: "horsemanship_lesson",
        location: "Stable Area",
        capacity: 8,
        requiresRsvp: true,
        recurrencePattern: "biweekly",
        startTimeOfDay: "14:00:00",
        durationMinutes: 120,
        seriesStartDate: firstOccurrence,
        maxOccurrences: 3,
      });

      expect(result.success).toBe(true);
      expect(result.seriesId).toBeDefined();
      expect(result.eventIds).toBeDefined();
      expect(result.eventIds!.length).toBe(3);
    });
  });

  describe("Event Type Validation", () => {
    it("should accept all valid event types", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: "test-event-types-admin", role: "admin" },
        req: {} as any,
        res: {} as any,
      });

      const now = Date.now();
      const validTypes = [
        "competition",
        "show",
        "clinic",
        "social",
        "riding_lesson",
        "horsemanship_lesson",
        "other"
      ] as const;

      for (const eventType of validTypes) {
        const startTime = now + Math.random() * 30 * 24 * 60 * 60 * 1000; // Random time in next 30 days
        const result = await caller.events.createEvent({
          title: `Test ${eventType} Event`,
          eventType,
          startTime,
          endTime: startTime + 60 * 60 * 1000,
          requiresRsvp: false,
          isPublished: true,
        });

        expect(result.success).toBe(true);
      }
    });
  });
});
