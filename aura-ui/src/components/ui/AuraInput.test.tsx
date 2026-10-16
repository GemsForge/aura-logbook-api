import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AuraInput } from "./AuraInput";

describe("AuraInput", () => {
  it("connects its label, helper text, validation state, and value", async () => {
    const user = userEvent.setup();
    render(
      <AuraInput
        label="Email address"
        helperText="Enter a valid email"
        error
        type="email"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Email address" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a valid email")).toBeVisible();
    await user.type(input, "gem@example.com");
    expect(input).toHaveValue("gem@example.com");
  });
});
