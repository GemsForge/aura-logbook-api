import "@testing-library/jest-dom";
import { vi } from "vitest";
import { testReferenceData } from "./referenceDataFixtures";

/** Return versioned test definitions to components that use the real RTK Query hook. */
vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
  const requestUrl = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
  const isReferenceDataRequest = requestUrl.endsWith("/reference-data");
  return new Response(JSON.stringify(isReferenceDataRequest ? testReferenceData : {}), {
    status: isReferenceDataRequest ? 200 : 404,
    headers: { "Content-Type": "application/json" },
  });
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

