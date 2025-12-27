import { describe, expect, it } from "vitest";
import { validateKlaviyoCredentials } from "./_core/klaviyo";

describe("Klaviyo Integration", () => {
  it("validates Klaviyo API credentials", async () => {
    const isValid = await validateKlaviyoCredentials();
    expect(isValid).toBe(true);
  }, 15000); // 15 second timeout for API call
});
