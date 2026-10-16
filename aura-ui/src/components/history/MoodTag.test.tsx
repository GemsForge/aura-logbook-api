import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/testUtilities";
import { MoodTag } from "./MoodTag";

describe("MoodTag", () => {
  it("renders the mood label with its corresponding icon", () => {
    renderWithProviders(<MoodTag mood="Harmonious" />);

    expect(screen.getByText(/Harmonious/)).toBeInTheDocument();
    expect(screen.getByText(/🕊️/)).toBeInTheDocument();
  });
});
