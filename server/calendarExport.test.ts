import { describe, expect, it } from "vitest";
import { generateICSFile, generateGoogleCalendarUrl, generateCalendarExport } from "./calendarExport";

describe("Calendar Export", () => {
  const testEvent = {
    title: "Weekly Riding Lesson",
    description: "Beginner riding lesson for new members",
    location: "Arena 1, Double C Ranch",
    startTime: new Date("2025-01-15T10:00:00Z"),
    endTime: new Date("2025-01-15T11:00:00Z"),
    url: "https://doublecranchllc.com/events/123",
  };

  describe("generateICSFile", () => {
    it("should generate valid ICS file content", () => {
      const icsContent = generateICSFile(testEvent);

      expect(icsContent).toContain("BEGIN:VCALENDAR");
      expect(icsContent).toContain("END:VCALENDAR");
      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(icsContent).toContain("END:VEVENT");
      expect(icsContent).toContain("SUMMARY:Weekly Riding Lesson");
      expect(icsContent).toContain("LOCATION:Arena 1\\, Double C Ranch");
      expect(icsContent).toContain("DESCRIPTION:Beginner riding lesson for new members");
    });

    it("should include organizer information", () => {
      const icsContent = generateICSFile(testEvent);

      expect(icsContent).toContain("ORGANIZER");
      expect(icsContent).toContain("Double C Ranch");
    });

    it("should set event status to CONFIRMED", () => {
      const icsContent = generateICSFile(testEvent);

      expect(icsContent).toContain("STATUS:CONFIRMED");
    });

    it("should handle events without optional fields", () => {
      const minimalEvent = {
        title: "Simple Event",
        startTime: new Date("2025-01-20T14:00:00Z"),
        endTime: new Date("2025-01-20T15:00:00Z"),
      };

      const icsContent = generateICSFile(minimalEvent);

      expect(icsContent).toContain("BEGIN:VCALENDAR");
      expect(icsContent).toContain("SUMMARY:Simple Event");
    });
  });

  describe("generateGoogleCalendarUrl", () => {
    it("should generate valid Google Calendar URL", () => {
      const googleUrl = generateGoogleCalendarUrl(testEvent);

      expect(googleUrl).toContain("https://calendar.google.com/calendar/render");
      expect(googleUrl).toContain("action=TEMPLATE");
      expect(googleUrl).toContain("text=Weekly+Riding+Lesson");
      expect(googleUrl).toContain("location=Arena+1");
    });

    it("should include dates in correct format", () => {
      const googleUrl = generateGoogleCalendarUrl(testEvent);

      // Google Calendar expects dates in format: YYYYMMDDTHHmmssZ
      expect(googleUrl).toContain("dates=");
      expect(googleUrl).toMatch(/dates=\d{8}T\d{6}Z/);
    });

    it("should URL encode special characters", () => {
      const eventWithSpecialChars = {
        ...testEvent,
        title: "Lesson & Training",
        location: "Arena #1",
      };

      const googleUrl = generateGoogleCalendarUrl(eventWithSpecialChars);

      // URL should be properly encoded - & is valid as query param separator
      expect(googleUrl).toContain("%26"); // & in title should be encoded
      expect(googleUrl).toContain("%23"); // # in location should be encoded
    });
  });

  describe("generateCalendarExport", () => {
    it("should generate all calendar export formats", () => {
      const exports = generateCalendarExport(testEvent);

      expect(exports).toHaveProperty("icsContent");
      expect(exports).toHaveProperty("googleUrl");
      expect(exports).toHaveProperty("appleUrl");
      expect(exports).toHaveProperty("outlookUrl");
    });

    it("should generate data URLs for Apple and Outlook", () => {
      const exports = generateCalendarExport(testEvent);

      expect(exports.appleUrl).toContain("data:text/calendar");
      expect(exports.outlookUrl).toContain("data:text/calendar");
    });

    it("should generate different URLs for Google vs Apple/Outlook", () => {
      const exports = generateCalendarExport(testEvent);

      expect(exports.googleUrl).toContain("calendar.google.com");
      expect(exports.appleUrl).toContain("data:text/calendar");
      expect(exports.outlookUrl).toContain("data:text/calendar");
    });

    it("should include all event details in exports", () => {
      const exports = generateCalendarExport(testEvent);

      // ICS content should have all details
      expect(exports.icsContent).toContain(testEvent.title);
      expect(exports.icsContent).toContain("Arena 1\\, Double C Ranch"); // Commas are escaped in ICS format
      expect(exports.icsContent).toContain(testEvent.description);

      // Google URL should have key details (uses + for spaces)
      expect(exports.googleUrl).toContain("Weekly+Riding+Lesson");
    });
  });

  describe("Date handling", () => {
    it("should correctly format dates for different timezones", () => {
      const eventInDifferentTZ = {
        title: "Test Event",
        startTime: new Date("2025-06-15T18:00:00-07:00"), // Pacific time
        endTime: new Date("2025-06-15T19:00:00-07:00"),
      };

      const icsContent = generateICSFile(eventInDifferentTZ);
      const googleUrl = generateGoogleCalendarUrl(eventInDifferentTZ);

      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(googleUrl).toContain("calendar.google.com");
    });

    it("should handle multi-day events", () => {
      const multiDayEvent = {
        title: "Weekend Clinic",
        startTime: new Date("2025-02-01T09:00:00Z"),
        endTime: new Date("2025-02-02T17:00:00Z"), // Next day
      };

      const icsContent = generateICSFile(multiDayEvent);

      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(icsContent).toContain("SUMMARY:Weekend Clinic");
    });
  });
});
