import { describe, expect, it, vi } from "vitest";
import { resolveInterfaceMode, resolveEffectiveInterfaceMode, watchSystemInterfaceMode } from "./InterfaceTheme";

/** System is persisted as a preference; only its effective colors respond to device changes. */
describe("system appearance", () => {
 it("preserves all three preferences and resolves only system against device appearance", () => {
  expect(resolveInterfaceMode("system")).toBe("system");
  expect(resolveEffectiveInterfaceMode("system","dark")).toBe("dark");
  expect(resolveEffectiveInterfaceMode("system","light")).toBe("light");
  expect(resolveEffectiveInterfaceMode("light","dark")).toBe("light");
  expect(resolveEffectiveInterfaceMode("dark","light")).toBe("dark");
  expect(resolveEffectiveInterfaceMode("unknown","dark")).toBe("light");
 });
 it("subscribes to changes and removes exactly the same listener", () => {
  const addEventListener=vi.fn(), removeEventListener=vi.fn(), onChange=vi.fn();
  const media={ matches:false, addEventListener, removeEventListener };
  vi.stubGlobal("matchMedia",vi.fn(()=>media));
  const cleanup=watchSystemInterfaceMode(onChange);
  expect(onChange).toHaveBeenLastCalledWith("light");
  const listener=addEventListener.mock.calls[0][1];media.matches=true;listener();
  expect(onChange).toHaveBeenLastCalledWith("dark");
  cleanup();expect(removeEventListener).toHaveBeenCalledWith("change",listener);
  vi.unstubAllGlobals();
 });
 it("falls back to light when media queries are unavailable", () => {
  vi.stubGlobal("matchMedia",undefined);const update=vi.fn();
  const cleanup=watchSystemInterfaceMode(update);expect(update).toHaveBeenCalledWith("light");cleanup();vi.unstubAllGlobals();
 });
});
