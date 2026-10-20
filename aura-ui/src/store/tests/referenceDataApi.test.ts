import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuraColorDefinition } from "@/features/mood/models/aura";
import { referenceDataApi } from "../referenceDataApi";

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
    isActive: true,
  },
  {
    key: "green",
    displayName: "Green",
    baseHex: "#4caf50",
    chakraKey: "heart",
    description: "Balanced and compassionate.",
    isNeutral: false,
    isActive: true,
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
});
