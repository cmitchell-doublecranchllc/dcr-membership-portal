import { describe, expect, it } from "vitest";
import { verifyEmailConnection } from "./_core/email";

describe("Email Service", () => {
  it("should verify Gmail connection with provided credentials", async () => {
    const isConnected = await verifyEmailConnection();
    expect(isConnected).toBe(true);
  }, { timeout: 10000 }); // 10 second timeout for network operation
});
