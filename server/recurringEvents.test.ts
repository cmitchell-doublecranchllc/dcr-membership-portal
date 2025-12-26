import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Recurring Events", () => {
  it("should create a weekly recurring series and generate events", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start tomorrow
    startDate.setHours(0, 0, 0, 0);

    const result = await caller.recurringEvents.createSeries({
      title: "Weekly Riding Lessons",
      description: "Regular weekly lessons",
      eventType: "clinic",
      location: "Arena 1",
      capacity: 10,
      requiresRsvp: true,
      recurrencePattern: "weekly",
      daysOfWeek: "1,3,5", // Mon, Wed, Fri
      startTimeOfDay: "09:00:00",
      durationMinutes: 60,
      seriesStartDate: startDate.getTime(),
      maxOccurrences: 12, // 4 weeks worth
    });

    expect(result.success).toBe(true);
    expect(result.seriesId).toBeGreaterThan(0);
    expect(result.eventsGenerated).toBeGreaterThan(0);
  });

  it("should retrieve all recurring series", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const series = await caller.recurringEvents.getAllSeries();
    expect(Array.isArray(series)).toBe(true);
  });

  it("should create a monthly recurring series", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date();
    startDate.setDate(1); // First of the month
    startDate.setMonth(startDate.getMonth() + 1); // Next month
    startDate.setHours(0, 0, 0, 0);

    const result = await caller.recurringEvents.createSeries({
      title: "Monthly Clinic",
      description: "Monthly advanced clinic",
      eventType: "clinic",
      location: "Main Arena",
      capacity: 15,
      requiresRsvp: true,
      recurrencePattern: "monthly",
      startTimeOfDay: "10:00:00",
      durationMinutes: 120,
      seriesStartDate: startDate.getTime(),
      maxOccurrences: 6, // 6 months
    });

    expect(result.success).toBe(true);
    expect(result.seriesId).toBeGreaterThan(0);
    expect(result.eventsGenerated).toBeGreaterThan(0);
  });

  it("should get series by ID", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a series first
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    const created = await caller.recurringEvents.createSeries({
      title: "Test Series",
      eventType: "clinic",
      recurrencePattern: "weekly",
      daysOfWeek: "2",
      startTimeOfDay: "14:00:00",
      durationMinutes: 90,
      seriesStartDate: startDate.getTime(),
      maxOccurrences: 4,
    });

    const series = await caller.recurringEvents.getSeries({
      seriesId: created.seriesId,
    });

    expect(series).toBeDefined();
    expect(series?.title).toBe("Test Series");
    expect(series?.recurrencePattern).toBe("weekly");
  });

  it("should delete a recurring series", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create a series
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    const created = await caller.recurringEvents.createSeries({
      title: "Series to Delete",
      eventType: "clinic",
      recurrencePattern: "weekly",
      daysOfWeek: "4",
      startTimeOfDay: "11:00:00",
      durationMinutes: 60,
      seriesStartDate: startDate.getTime(),
      maxOccurrences: 3,
    });

    // Delete it
    const result = await caller.recurringEvents.deleteSeries({
      seriesId: created.seriesId,
    });

    expect(result.success).toBe(true);

    // Verify it's deactivated
    const series = await caller.recurringEvents.getSeries({
      seriesId: created.seriesId,
    });
    expect(series?.isActive).toBe(false);
  });

  it("should create daily recurring series", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    const result = await caller.recurringEvents.createSeries({
      title: "Daily Morning Session",
      eventType: "clinic",
      recurrencePattern: "daily",
      startTimeOfDay: "08:00:00",
      durationMinutes: 45,
      seriesStartDate: startDate.getTime(),
      maxOccurrences: 7, // One week
    });

    expect(result.success).toBe(true);
    expect(result.eventsGenerated).toBe(7);
  });

  it("should create biweekly recurring series", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    const result = await caller.recurringEvents.createSeries({
      title: "Biweekly Advanced Class",
      eventType: "clinic",
      recurrencePattern: "biweekly",
      daysOfWeek: "6", // Saturday
      startTimeOfDay: "13:00:00",
      durationMinutes: 90,
      seriesStartDate: startDate.getTime(),
      maxOccurrences: 8,
    });

    expect(result.success).toBe(true);
    expect(result.seriesId).toBeGreaterThan(0);
  });

  it("should handle series with end date", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30 days

    const result = await caller.recurringEvents.createSeries({
      title: "Limited Time Series",
      eventType: "clinic",
      recurrencePattern: "weekly",
      daysOfWeek: "3",
      startTimeOfDay: "15:00:00",
      durationMinutes: 60,
      seriesStartDate: startDate.getTime(),
      seriesEndDate: endDate.getTime(),
    });

    expect(result.success).toBe(true);
    expect(result.eventsGenerated).toBeGreaterThan(0);
    expect(result.eventsGenerated).toBeLessThanOrEqual(5); // Max 5 Wednesdays in 30 days
  });
});
