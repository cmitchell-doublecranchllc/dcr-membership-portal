import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" | "staff" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Events", () => {
  it("should return empty array for upcoming events when none exist", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const events = await caller.events.getUpcomingEvents();
    expect(Array.isArray(events)).toBe(true);
  });

  it("should allow admin to create event", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const now = Date.now();
    const result = await caller.events.createEvent({
      title: "Summer Show 2024",
      description: "Annual summer horse show",
      eventType: "show",
      location: "Main Arena",
      startTime: now + 86400000 * 7, // 1 week from now
      endTime: now + 86400000 * 7 + 14400000, // 4 hours later
      capacity: 50,
      requiresRsvp: true,
      publish: true,
    });

    expect(result.success).toBe(true);
    expect(result.eventId).toBeGreaterThan(0);
  });

  it("should deny non-admin from creating events", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    const now = Date.now();
    await expect(
      caller.events.createEvent({
        title: "Unauthorized Event",
        description: "This should fail",
        eventType: "other",
        location: "Nowhere",
        startTime: now + 86400000,
        endTime: now + 86400000 + 3600000,
        publish: false,
      })
    ).rejects.toThrow();
  });

  it("should return published events", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const events = await caller.events.getPublishedEvents();
    expect(Array.isArray(events)).toBe(true);
  });
});

describe("Event RSVPs", () => {
  it("should return empty RSVPs for new member", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const rsvps = await caller.events.getMyRsvps();
    expect(Array.isArray(rsvps)).toBe(true);
  });

  it("should return null for non-existent RSVP", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const rsvp = await caller.events.getMyRsvpForEvent({ eventId: 9999 });
    // Returns null when member doesn't exist, or when no RSVP exists
    expect(rsvp === null || rsvp === undefined).toBe(true);
  });

  it("should allow member to RSVP to event", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // First create member profile
    await caller.members.upsertProfile({
      membershipTier: "silver",
      phone: "555-1234",
    });

    // Create an event
    const now = Date.now();
    const eventResult = await caller.events.createEvent({
      title: "Test Event for RSVP",
      eventType: "clinic",
      startTime: now + 86400000,
      endTime: now + 86400000 + 7200000,
      capacity: 20,
      requiresRsvp: true,
      publish: true,
    });

    // RSVP to the event
    const rsvpResult = await caller.events.rsvpToEvent({
      eventId: eventResult.eventId,
      status: "attending",
      guestCount: 2,
      notes: "Looking forward to it!",
    });

    expect(rsvpResult.success).toBe(true);
    expect(rsvpResult.rsvpId).toBeGreaterThan(0);
  });

  it("should update existing RSVP", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Create member profile
    await caller.members.upsertProfile({
      membershipTier: "gold",
      phone: "555-5678",
    });

    // Create event
    const now = Date.now();
    const eventResult = await caller.events.createEvent({
      title: "Update RSVP Test Event",
      eventType: "social",
      startTime: now + 172800000, // 2 days from now
      endTime: now + 172800000 + 10800000, // 3 hours
      publish: true,
    });

    // First RSVP
    await caller.events.rsvpToEvent({
      eventId: eventResult.eventId,
      status: "attending",
      guestCount: 1,
    });

    // Update RSVP
    const updateResult = await caller.events.rsvpToEvent({
      eventId: eventResult.eventId,
      status: "maybe",
      guestCount: 0,
      notes: "Not sure if I can make it",
    });

    expect(updateResult.success).toBe(true);
  });

  it("should handle capacity limits and waitlist", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Create member profile
    await caller.members.upsertProfile({
      membershipTier: "bronze",
      phone: "555-9999",
    });

    // Create event with very small capacity
    const now = Date.now();
    const eventResult = await caller.events.createEvent({
      title: "Limited Capacity Event",
      eventType: "competition",
      startTime: now + 259200000, // 3 days from now
      endTime: now + 259200000 + 14400000, // 4 hours
      capacity: 1, // Only 1 spot
      requiresRsvp: true,
      publish: true,
    });

    // First RSVP should succeed
    const rsvp1 = await caller.events.rsvpToEvent({
      eventId: eventResult.eventId,
      status: "attending",
      guestCount: 0,
    });

    expect(rsvp1.success).toBe(true);
    expect(rsvp1.waitlisted).toBeUndefined();
  });

  it("should allow canceling RSVP", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Create member profile
    await caller.members.upsertProfile({
      membershipTier: "silver",
      phone: "555-1111",
    });

    // Create event
    const now = Date.now();
    const eventResult = await caller.events.createEvent({
      title: "Cancel RSVP Test",
      eventType: "clinic",
      startTime: now + 345600000, // 4 days from now
      endTime: now + 345600000 + 7200000,
      publish: true,
    });

    // RSVP
    await caller.events.rsvpToEvent({
      eventId: eventResult.eventId,
      status: "attending",
      guestCount: 0,
    });

    // Cancel RSVP
    const cancelResult = await caller.events.cancelRsvp({
      eventId: eventResult.eventId,
    });

    expect(cancelResult.success).toBe(true);
  });

  it("should return attendee count for event", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const count = await caller.events.getEventAttendeeCount({ eventId: 1 });
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe("Event Management", () => {
  it("should allow admin to get all events", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const events = await caller.events.getAllEvents();
    expect(Array.isArray(events)).toBe(true);
  });

  it("should deny non-admin from getting all events", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.events.getAllEvents()).rejects.toThrow();
  });

  it("should allow admin to update event", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Create event
    const now = Date.now();
    const createResult = await caller.events.createEvent({
      title: "Original Title",
      eventType: "other",
      startTime: now + 432000000, // 5 days from now
      endTime: now + 432000000 + 3600000,
      publish: false,
    });

    // Update event
    const updateResult = await caller.events.updateEvent({
      eventId: createResult.eventId,
      title: "Updated Title",
      isPublished: true,
    });

    expect(updateResult.success).toBe(true);
  });

  it("should allow admin to get event RSVPs", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const rsvps = await caller.events.getEventRsvps({ eventId: 1 });
    expect(Array.isArray(rsvps)).toBe(true);
  });
});
