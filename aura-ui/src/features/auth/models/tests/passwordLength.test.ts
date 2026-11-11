import { describe, expect, it } from "vitest";
import { registerSchema } from "../RegisterSchema";

/**
 * Registration must match the API's PasswordRules (8–72) so the form never accepts a password
 * the server will reject (#327).
 */
describe("registerSchema password length", () => {
  const check = (password: string) => registerSchema.validateAt("password", { password });

  it("rejects 7 characters", async () => {
    await expect(check("a".repeat(7))).rejects.toThrow(/at least 8/);
  });

  it("accepts 8 and 72 characters", async () => {
    await expect(check("a".repeat(8))).resolves.toBeDefined();
    await expect(check("a".repeat(72))).resolves.toBeDefined();
  });

  it("rejects 73 characters", async () => {
    await expect(check("a".repeat(73))).rejects.toThrow(/72 characters or fewer/);
  });
});
