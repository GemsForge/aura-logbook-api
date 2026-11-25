import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppDispatch } from "@/store/store";
import { AuthApi } from "@/api/AuthApi";
import { hydrateUserSession } from "./hydrateUserSession";

vi.mock("@/api/AuthApi", () => ({ AuthApi: { getCurrentUser: vi.fn() } }));

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("hydrateUserSession", () => {
  it("does not log Axios errors that can contain bearer headers", async () => {
    const error = Object.assign(new Error("request failed"), { config: { headers: { Authorization: "Bearer private-token" } } });
    vi.mocked(AuthApi.getCurrentUser).mockRejectedValue(error);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const dispatch = vi.fn() as unknown as AppDispatch;

    await expect(hydrateUserSession("private-token", dispatch)).resolves.toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "auth/setToken" }));
  });
});
