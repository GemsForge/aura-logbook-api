import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuraModal } from "./AuraModal";

describe("AuraModal", () => {
  it("renders its title, content, and actions accessibly", () => {
    render(
      <AuraModal
        open
        onClose={vi.fn()}
        title="Edit details"
        actions={<button>Save</button>}>
        Modal content
      </AuraModal>,
    );

    expect(screen.getByRole("dialog", { name: "Edit details" })).toBeVisible();
    expect(screen.getByText("Modal content")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
  });

  it("forwards close requests from the backdrop and Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AuraModal open onClose={onClose} title="Close me">
        Content
      </AuraModal>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render while closed", () => {
    render(
      <AuraModal open={false} onClose={vi.fn()} title="Hidden">
        Content
      </AuraModal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
