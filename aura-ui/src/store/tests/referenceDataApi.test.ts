import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuraColorDefinition } from "@/features/mood/models/aura";
import { referenceDataApi } from "../referenceDataApi";
import { testReferenceData } from "../../test/referenceDataFixtures";

function createJsonResponse<T>(data: T) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function createTestStore() {
  return configureStore({
    reducer: {
      [referenceDataApi.reducerPath]: referenceDataApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(referenceDataApi.middleware),
  });
}

const auraColors: AuraColorDefinition[] = [
  {
    key: "blue",
    displayName: "Blue",
    baseHex: "#2196f3",
    chakraKey: "throat",
    description: "Clear and communicative.",
    isNeutral: false,
    sortOrder: 1,
    shades: { 50: "#e3f2fd", 100: "#bbdefb", 200: "#90caf9", 300: "#64b5f6", 400: "#42a5f5", 500: "#2196f3", 600: "#1e88e5", 700: "#1976d2", 800: "#1565c0", 900: "#0d47a1" },
  },
  {
    key: "green",
    displayName: "Green",
    baseHex: "#4caf50",
    chakraKey: "heart",
    description: "Balanced and compassionate.",
    isNeutral: false,
    sortOrder: 2,
    shades: { 50: "#e8f5e9", 100: "#c8e6c9", 200: "#a5d6a7", 300: "#81c784", 400: "#66bb6a", 500: "#4caf50", 600: "#43a047", 700: "#388e3c", 800: "#2e7d32", 900: "#1b5e20" },
  },
];

describe("referenceDataApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and caches aura color definitions", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(createJsonResponse(auraColors));
    const store = createTestStore();

    const firstResult = await store.dispatch(
      referenceDataApi.endpoints.getAuraColors.initiate()
    );
    const secondResult = await store.dispatch(
      referenceDataApi.endpoints.getAuraColors.initiate()
    );

    expect(firstResult.data).toEqual(auraColors);
    expect(secondResult.data).toEqual(auraColors);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.url).toMatch(/\/reference-data\/auras$/);
  });

  it("fetches the combined database-driven configuration", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(createJsonResponse(testReferenceData));
    const store = createTestStore();

    const result = await store.dispatch(referenceDataApi.endpoints.getReferenceData.initiate());

    expect(result.data).toEqual(testReferenceData);
    expect(result.data?.pathways.map((pathway) => pathway.key)).toEqual(["mindfulness", "energy", "faith"]);
    expect(result.data?.auras[0]?.shades?.[500]).toBe("#2196f3");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0]?.[0] as Request).url).toMatch(/\/reference-data$/);
  });
});
