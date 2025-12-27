import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Profile Management", () => {
  let testUserId: number;
  let testMemberId: number;

  beforeEach(async () => {
    // Create a test user
    const openId = `test-profile-${Date.now()}-${Math.random()}`;
    await db.upsertUser({
      openId,
      name: "Test Rider",
      email: "rider@test.com",
      role: "user",
    });
    
    const user = await db.getUserByOpenId(openId);
    testUserId = user!.id;

    // Create a member profile
    testMemberId = await db.createMember({
      userId: testUserId,
      membershipTier: "silver",
      phone: "555-0001",
    });
  });

  describe("Riding Experience", () => {
    it("should update riding experience level", async () => {
      const user = await db.getUserById(testUserId);
      const caller = appRouter.createCaller({
        user: user!,
        req: {} as any,
        res: {} as any,
      });

      await caller.profile.updateRidingInfo({
        ridingExperienceLevel: "intermediate",
        certifications: "Level 2 Certified",
        ridingGoals: "Compete in show jumping",
        medicalNotes: "No restrictions",
      });

      const member = await db.getMemberByUserId(testUserId);
      expect(member?.ridingExperienceLevel).toBe("intermediate");
      expect(member?.certifications).toBe("Level 2 Certified");
      expect(member?.ridingGoals).toBe("Compete in show jumping");
      expect(member?.medicalNotes).toBe("No restrictions");
    });

    it("should update partial riding info", async () => {
      const user = await db.getUserById(testUserId);
      const caller = appRouter.createCaller({
        user: user!,
        req: {} as any,
        res: {} as any,
      });

      // First update
      await caller.profile.updateRidingInfo({
        ridingExperienceLevel: "beginner",
        certifications: "None yet",
      });

      let member = await db.getMemberByUserId(testUserId);
      expect(member?.ridingExperienceLevel).toBe("beginner");
      expect(member?.certifications).toBe("None yet");

      // Second update - only change experience level
      await caller.profile.updateRidingInfo({
        ridingExperienceLevel: "intermediate",
      });

      member = await db.getMemberByUserId(testUserId);
      expect(member?.ridingExperienceLevel).toBe("intermediate");
      expect(member?.certifications).toBe("None yet"); // Should remain unchanged
    });

    it("should handle all experience levels", async () => {
      const user = await db.getUserById(testUserId);
      const caller = appRouter.createCaller({
        user: user!,
        req: {} as any,
        res: {} as any,
      });

      const levels: Array<"beginner" | "intermediate" | "advanced" | "expert"> = [
        "beginner",
        "intermediate",
        "advanced",
        "expert",
      ];

      for (const level of levels) {
        await caller.profile.updateRidingInfo({
          ridingExperienceLevel: level,
        });

        const member = await db.getMemberByUserId(testUserId);
        expect(member?.ridingExperienceLevel).toBe(level);
      }
    });

    it("should require authentication", async () => {
      const caller = appRouter.createCaller({
        user: undefined,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.profile.updateRidingInfo({
          ridingExperienceLevel: "beginner",
        })
      ).rejects.toThrow();
    });
  });

  describe("Profile Photo Upload", () => {
    it("should validate base64 photo data format", async () => {
      const user = await db.getUserById(testUserId);
      const caller = appRouter.createCaller({
        user: user!,
        req: {} as any,
        res: {} as any,
      });

      // Create a simple 1x1 transparent PNG in base64
      const validBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const result = await caller.profile.uploadProfilePhoto({
        photoData: validBase64,
        mimeType: "image/png",
      });

      expect(result.success).toBe(true);
      expect(result.photoUrl).toBeDefined();
      expect(typeof result.photoUrl).toBe("string");
      expect(result.photoUrl).toContain("profile-photos/");
    });

    it("should update user profile with photo URL", async () => {
      const user = await db.getUserById(testUserId);
      const caller = appRouter.createCaller({
        user: user!,
        req: {} as any,
        res: {} as any,
      });

      const validBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const result = await caller.profile.uploadProfilePhoto({
        photoData: validBase64,
        mimeType: "image/png",
      });

      // Verify the URL was stored in the database
      const updatedUser = await db.getUserById(testUserId);
      expect(updatedUser?.profilePhotoUrl).toBe(result.photoUrl);
    });

    it("should support different image formats", async () => {
      const user = await db.getUserById(testUserId);
      const caller = appRouter.createCaller({
        user: user!,
        req: {} as any,
        res: {} as any,
      });

      const validBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const formats = ["image/png", "image/jpeg", "image/gif"];

      for (const mimeType of formats) {
        const result = await caller.profile.uploadProfilePhoto({
          photoData: validBase64,
          mimeType,
        });

        expect(result.success).toBe(true);
        expect(result.photoUrl).toBeDefined();
      }
    });

    it("should require authentication for photo upload", async () => {
      const caller = appRouter.createCaller({
        user: undefined,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.profile.uploadProfilePhoto({
          photoData: "validbase64data",
          mimeType: "image/png",
        })
      ).rejects.toThrow();
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete profile setup", async () => {
      const user = await db.getUserById(testUserId);
      const caller = appRouter.createCaller({
        user: user!,
        req: {} as any,
        res: {} as any,
      });

      // Upload photo
      const validBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const photoResult = await caller.profile.uploadProfilePhoto({
        photoData: validBase64,
        mimeType: "image/png",
      });

      expect(photoResult.success).toBe(true);

      // Update riding info
      await caller.profile.updateRidingInfo({
        ridingExperienceLevel: "advanced",
        certifications: "BHS Stage 3, USDF Bronze Medal",
        ridingGoals: "Train for Grand Prix dressage",
        medicalNotes: "Previous knee injury - healed",
      });

      // Verify all data is stored
      const updatedUser = await db.getUserById(testUserId);
      const updatedMember = await db.getMemberByUserId(testUserId);

      expect(updatedUser?.profilePhotoUrl).toBe(photoResult.photoUrl);
      expect(updatedMember?.ridingExperienceLevel).toBe("advanced");
      expect(updatedMember?.certifications).toContain("BHS Stage 3");
      expect(updatedMember?.ridingGoals).toContain("Grand Prix");
      expect(updatedMember?.medicalNotes).toContain("knee injury");
    });
  });
});
