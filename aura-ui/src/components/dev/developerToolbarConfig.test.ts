import { describe, expect, it } from "vitest";
import { shouldShowDeveloperToolbar } from "./developerToolbarConfig";

describe("developer toolbar build gate", () => {
  it("requires an explicit flag for local development", () => {
    expect(shouldShowDeveloperToolbar({ dev: true, mode: "development", enabled: "true" })).toBe(true);
    expect(shouldShowDeveloperToolbar({ dev: true, mode: "development", enabled: undefined })).toBe(false);
  });

  it("allows the explicitly configured FIT build and excludes normal Production builds", () => {
    expect(shouldShowDeveloperToolbar({ dev: false, mode: "fit", enabled: "true" })).toBe(true);
    expect(shouldShowDeveloperToolbar({ dev: false, mode: "production", enabled: "true" })).toBe(false);
    expect(shouldShowDeveloperToolbar({ dev: false, mode: "fit", enabled: "false" })).toBe(false);
  });
});
