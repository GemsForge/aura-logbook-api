import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuraButton } from "./AuraButton";

describe("AuraButton", () => {
  it("preserves the shared click and disabled behavior", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <>
        <AuraButton variant="contained" onClick={onClick}>
          Save
        </AuraButton>
        <AuraButton disabled>Unavailable</AuraButton>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });
});
