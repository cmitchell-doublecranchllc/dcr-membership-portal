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

describe("Members", () => {
  it("should return undefined for user without member profile", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const profile = await caller.members.getMyProfile();
    expect(profile).toBeUndefined();
  });

  it("should create a new member profile", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.members.upsertProfile({
      membershipTier: "bronze",
      phone: "555-1234",
      emergencyContact: "Jane Doe, Mother, 555-5678",
    });

    expect(result.success).toBe(true);
    expect(result.memberId).toBeGreaterThan(0);
  });

  it("should return empty array for members without children", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const children = await caller.members.getMyChildren();
    expect(Array.isArray(children)).toBe(true);
    expect(children.length).toBe(0);
  });
});

describe("Check-ins", () => {
  it("should allow member to check in", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a member profile
    await caller.members.upsertProfile({
      membershipTier: "silver",
      phone: "555-1234",
    });

    // Then check in
    const result = await caller.checkIns.checkIn({});
    
    expect(result.success).toBe(true);
    expect(result.checkInTime).toBeGreaterThan(0);
  });

  it("should return check-in history for member", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const checkIns = await caller.checkIns.getMyCheckIns();
    expect(Array.isArray(checkIns)).toBe(true);
  });

  it("should allow admin to view today's check-ins", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const todayCheckIns = await caller.checkIns.getTodayCheckIns();
    expect(Array.isArray(todayCheckIns)).toBe(true);
  });

  it("should deny non-admin access to today's check-ins", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.checkIns.getTodayCheckIns()).rejects.toThrow();
  });
});

describe("Contracts", () => {
  it("should return empty assignments for new member", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const assignments = await caller.contracts.getMyAssignments();
    expect(Array.isArray(assignments)).toBe(true);
    expect(assignments.length).toBe(0);
  });

  it("should allow admin to create contract", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contracts.createContract({
      title: "Test Liability Waiver",
      description: "This is a test contract for liability purposes.",
    });

    expect(result.success).toBe(true);
    expect(result.contractId).toBeGreaterThan(0);
  });

  it("should deny non-admin from creating contracts", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contracts.createContract({
        title: "Unauthorized Contract",
        description: "This should fail",
      })
    ).rejects.toThrow();
  });

  it("should return empty signatures for new member", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const signatures = await caller.contracts.getMySignatures();
    expect(Array.isArray(signatures)).toBe(true);
    expect(signatures.length).toBe(0);
  });
});

describe("Messages", () => {
  it("should return empty messages for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const messages = await caller.messages.getMyMessages();
    expect(Array.isArray(messages)).toBe(true);
  });

  it("should return zero unread count for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const count = await caller.messages.getUnreadCount();
    expect(count).toBe(0);
  });

  it("should send a message successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.messages.sendMessage({
      recipientId: 2,
      subject: "Test Message",
      content: "This is a test message",
    });

    expect(result.success).toBe(true);
  });
});

describe("Announcements", () => {
  it("should return published announcements", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const announcements = await caller.announcements.getAnnouncements();
    expect(Array.isArray(announcements)).toBe(true);
  });

  it("should allow admin to create announcement", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.announcements.createAnnouncement({
      title: "Test Announcement",
      content: "This is a test announcement",
      publish: false,
    });

    expect(result.success).toBe(true);
    expect(result.announcementId).toBeGreaterThan(0);
  });

  it("should deny non-admin from creating announcements", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.announcements.createAnnouncement({
        title: "Unauthorized",
        content: "This should fail",
        publish: false,
      })
    ).rejects.toThrow();
  });
});

describe("Appointments", () => {
  it("should return empty appointments for new member", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const appointments = await caller.appointments.getMyAppointments();
    expect(Array.isArray(appointments)).toBe(true);
    expect(appointments.length).toBe(0);
  });

  it("should allow admin to create appointment", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const now = Date.now();
    const result = await caller.appointments.createAppointment({
      memberId: 1,
      appointmentType: "Group Lesson",
      startTime: now + 86400000, // Tomorrow
      endTime: now + 86400000 + 3600000, // Tomorrow + 1 hour
      status: "scheduled",
    });

    expect(result.success).toBe(true);
  });

  it("should deny non-admin from creating appointments", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.appointments.createAppointment({
        memberId: 1,
        appointmentType: "Unauthorized",
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
      })
    ).rejects.toThrow();
  });
});
