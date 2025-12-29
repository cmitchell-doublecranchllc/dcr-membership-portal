import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Instructor Student Dashboard", () => {
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let studentUserId: number;
  let studentMemberId: number;

  beforeAll(async () => {
    // Create admin user
    await db.upsertUser({
      openId: "test-admin-instructor",
      name: "Test Instructor",
      email: "instructor@test.com",
      role: "admin",
    });

    // Get the full user object
    const fullAdminUser = await db.getUserByOpenId("test-admin-instructor");
    if (!fullAdminUser) throw new Error("Admin user not found");

    adminCaller = appRouter.createCaller({
      user: fullAdminUser,
      req: {} as any,
      res: {} as any,
    });

    // Create a student user and member profile
    await db.upsertUser({
      openId: "test-student-001",
      name: "Test Student",
      email: "student@test.com",
      role: "user",
    });
    
    const studentUser = await db.getUserByOpenId("test-student-001");
    if (!studentUser) throw new Error("Student user not found");
    studentUserId = studentUser.id;

    const memberResult = await db.createMember({
      userId: studentUserId,
      membershipTier: "silver",
      phone: "555-1234",
      emergencyContact: "Parent: 555-5678",
      isChild: false,
    });
    studentMemberId = memberResult;
  });

  it("should fetch all students with riding info", async () => {
    const students = await adminCaller.members.getAllStudentsWithRidingInfo();
    
    expect(students).toBeDefined();
    expect(Array.isArray(students)).toBe(true);
    expect(students.length).toBeGreaterThan(0);
    
    const testStudent = students.find((s) => s.userId === studentUserId);
    expect(testStudent).toBeDefined();
    expect(testStudent?.userName).toBe("Test Student");
    expect(testStudent?.membershipTier).toBe("silver");
  });

  it("should update student riding experience (instructor only)", async () => {
    const result = await adminCaller.profile.updateStudentRidingInfo({
      memberId: studentMemberId,
      ridingExperienceLevel: "intermediate",
      certifications: "Basic Horsemanship Certificate",
      ridingGoals: "Learn jumping techniques",
      medicalNotes: "No medical concerns",
    });

    expect(result.success).toBe(true);

    // Verify the update
    const students = await adminCaller.members.getAllStudentsWithRidingInfo();
    const updatedStudent = students.find((s) => s.memberId === studentMemberId);
    
    expect(updatedStudent?.ridingExperienceLevel).toBe("intermediate");
    expect(updatedStudent?.certifications).toBe("Basic Horsemanship Certificate");
    expect(updatedStudent?.ridingGoals).toBe("Learn jumping techniques");
    expect(updatedStudent?.medicalNotes).toBe("No medical concerns");
  });

  it("should update only specific riding info fields", async () => {
    // Update only experience level
    await adminCaller.profile.updateStudentRidingInfo({
      memberId: studentMemberId,
      ridingExperienceLevel: "advanced",
    });

    const students = await adminCaller.members.getAllStudentsWithRidingInfo();
    const updatedStudent = students.find((s) => s.memberId === studentMemberId);
    
    expect(updatedStudent?.ridingExperienceLevel).toBe("advanced");
    // Previous values should remain
    expect(updatedStudent?.certifications).toBe("Basic Horsemanship Certificate");
    expect(updatedStudent?.ridingGoals).toBe("Learn jumping techniques");
  });

  it("should allow clearing riding info fields", async () => {
    await adminCaller.profile.updateStudentRidingInfo({
      memberId: studentMemberId,
      certifications: "",
      ridingGoals: "",
      medicalNotes: "",
    });

    const students = await adminCaller.members.getAllStudentsWithRidingInfo();
    const updatedStudent = students.find((s) => s.memberId === studentMemberId);
    
    expect(updatedStudent?.certifications).toBe("");
    expect(updatedStudent?.ridingGoals).toBe("");
    expect(updatedStudent?.medicalNotes).toBe("");
    // Experience level should remain
    expect(updatedStudent?.ridingExperienceLevel).toBe("advanced");
  });

  it("should include user profile photo URL in student list", async () => {
    // Update user with profile photo
    await db.updateUserProfilePhoto(studentUserId, "https://example.com/photo.jpg");

    const students = await adminCaller.members.getAllStudentsWithRidingInfo();
    const studentWithPhoto = students.find((s) => s.userId === studentUserId);
    
    expect(studentWithPhoto?.profilePhotoUrl).toBe("https://example.com/photo.jpg");
  });

  it("should only return non-child members", async () => {
    // Create a child member
    const childMemberId = await db.createMember({
      userId: studentUserId,
      parentId: studentMemberId,
      membershipTier: "bronze",
      isChild: true,
    });

    const students = await adminCaller.members.getAllStudentsWithRidingInfo();
    
    // Child should not appear in the list
    const childInList = students.find((s) => s.memberId === childMemberId);
    expect(childInList).toBeUndefined();
  });
});
