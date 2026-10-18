import { describe, expect, it } from "vitest";
import { shouldClearAuthenticationState } from "./authErrorHandling";

describe("shouldClearAuthenticationState", () => {
  it.each(["/Auth/login", "/Auth/register"])(
    "keeps public auth failures on the form for %s",
    (requestUrl) => {
      expect(shouldClearAuthenticationState(401, requestUrl)).toBe(false);
    },
  );

  it("clears the session after an unauthorized protected request", () => {
    expect(shouldClearAuthenticationState(401, "/Auth/me")).toBe(true);
  });

  it("does not clear the session for unrelated server errors", () => {
    expect(shouldClearAuthenticationState(500, "/Auth/me")).toBe(false);
  });
});
