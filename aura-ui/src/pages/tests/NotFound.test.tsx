

import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "../NotFound";
import { renderWithProviders } from "../../test/testUtilities";

describe("NotFound", () => {
  /**
   * Verifies that the NotFound page renders the fallback message shown when
   * a user navigates to an unsupported route.
   */
  it("should render the not found page", () => {
    renderWithProviders(<NotFound />);

    expect(
      screen.getByRole("heading", { name: /not found/i })
    ).toBeInTheDocument();
  });
});