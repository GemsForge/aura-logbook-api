import { fireEvent, screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/testUtilities";
import HomePage from "../Home";
import { testReferenceData } from "../../test/referenceDataFixtures";

vi.mock("@/store/referenceDataApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/store/referenceDataApi")>();
  return { ...actual, useGetReferenceDataQuery: () => ({ data: testReferenceData, isError: false }) };
});

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

describe("HomePage", () => {
  it("keeps the landing page focused on its headline and next step", () => {
    renderWithProviders(
      <>
        <HomePage />
        <CurrentPath />
      </>,
    );

    expect(screen.getByRole("heading", { name: "A quieter way to notice what matters." })).toBeInTheDocument();
    expect(screen.getByText("Pair your mood with a color. Watch the patterns appear.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start your logbook" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Choose a color" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Notice patterns" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reflect your way" })).toBeInTheDocument();
    expect(screen.getByText("Private by design. Your journal and mood history belong to you.")).toBeInTheDocument();
    expect(screen.queryByText(/your energy tells a story|tune into your truth|just about tracking mood/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start your logbook" }));
    expect(screen.getByLabelText("Current path")).toHaveTextContent("/register");
  });

  it("changes only the temporary hero color preview when a swatch is selected", () => {
    const { store } = renderWithProviders(<HomePage />);
    const greenSwatch = screen.getByRole("button", { name: "Preview Green mood color" });
    const hero = screen.getByRole("region", { name: "A quieter way to notice what matters." });

    fireEvent.click(greenSwatch);

    expect(greenSwatch).toHaveAttribute("aria-pressed", "true");
    expect(hero.style.getPropertyValue("--home-preview-color")).toBe(testReferenceData.auras[1].shades?.[300]);
    expect(store.getState().ui.interfaceThemePreview).toBeNull();
    expect(store.getState().auth.profile).toBeNull();
  });
});
