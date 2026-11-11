import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/testUtilities";
import { setGuestInterfaceMode, setInterfaceThemePreview } from "@/store/slices/uiSlice";
import { ThemeBanner } from "./ThemeBanner";

/** Guards failure-only fallback and resets when the active preview changes. */
describe("ThemeBanner artwork", () => {
  it("falls back once and hides decoration when both assets fail", () => {
    const { container } = renderWithProviders(<ThemeBanner title="Your reflections" description="A quiet moment." />);
    const image = container.querySelector("img")!;
    expect(image).toHaveAttribute("src", "/theme-assets/backgrounds/banner-aurora-dark.png");
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", "/theme-assets/backgrounds/banner-aurora.png");
    fireEvent.error(image);
    expect(image).toHaveStyle({ visibility: "hidden" });
    expect(screen.getByRole("heading", { name: "Your reflections" })).toBeVisible();
  });
  it("resets a failed image when family or mode changes", () => {
    const { container, store } = renderWithProviders(<ThemeBanner title="Your reflections" description="A quiet moment." />);
    const failed = container.querySelector("img")!;
    fireEvent.error(failed); fireEvent.error(failed);
    act(() => { store.dispatch(setInterfaceThemePreview("Ocean")); store.dispatch(setGuestInterfaceMode("light")); });
    const image = container.querySelector("img")!;
    expect(image).not.toBe(failed);
    expect(image).toHaveAttribute("src", "/theme-assets/backgrounds/banner-ocean-light.png");
    expect(image.style.visibility).toBe("");
  });
});
