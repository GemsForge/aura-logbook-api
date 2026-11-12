import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/testUtilities";
import { MoodTag } from "./MoodTag";

describe("MoodTag", () => {
  it("renders the mood label with its database-backed illustration", async () => {
    const { container } = renderWithProviders(<MoodTag mood="Harmonious" />);

    expect(await screen.findByText(/Harmonious/)).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector('img[src="/mood-icons/harmonious.png"]')).toBeInTheDocument());
  });
});
