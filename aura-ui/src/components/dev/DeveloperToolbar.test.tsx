import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeveloperToolbar } from "./DeveloperToolbar";
import { renderWithProviders } from "@/test/testUtilities";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("DeveloperToolbar", () => {
  it("announces API readiness and exposes fixed keyboard-operable lifecycle controls", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/test-clients")) return new Response(JSON.stringify({ clients: [] }), { status: 200 });
      if (url.endsWith("/action")) return new Response(JSON.stringify({ state: "running" }), { status: 200 });
      return new Response(JSON.stringify({ state: "ready", detail: "API and database are ready." }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithProviders(<DeveloperToolbar />);

    expect(screen.getByRole("complementary", { name: "Developer console" })).toBeInTheDocument();
    expect(await screen.findByText("API and database are ready.")).toHaveAttribute("role", "status");
    const restart = screen.getByRole("button", { name: "Restart" });
    restart.focus();
    await user.keyboard("{Enter}");

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/__aura_dev/action", expect.objectContaining({ method: "POST" })));
    expect(fetchMock).toHaveBeenCalledWith("/__aura_dev/action", expect.objectContaining({ body: JSON.stringify({ action: "restart" }) }));
  });

  it("shows a safe config error and disables client selection when no accounts are configured", async () => {
    vi.stubGlobal("fetch", vi.fn(async url => url.endsWith("/test-clients")
      ? new Response(JSON.stringify({ clients: [], error: "FIT test clients are not configured." }), { status: 503 })
      : new Response(JSON.stringify({ state: "ready", detail: "API and database are ready." }), { status: 200 })));
    renderWithProviders(<DeveloperToolbar />);

    expect(await screen.findByRole("alert")).toHaveTextContent("FIT test clients are not configured.");
    expect(screen.getByRole("combobox", { name: "Synthetic test client" })).toBeDisabled();
  });

  it("asks before replacing an active session and does nothing when cancelled", async () => {
    const fetchMock = vi.fn(async (url: string) => url.endsWith("/test-clients")
      ? new Response(JSON.stringify({ clients: [{ id: "synthetic-b", label: "Synthetic test B" }] }), { status: 200 })
      : new Response(JSON.stringify({ state: "ready", detail: "API and database are ready." }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithProviders(<DeveloperToolbar />, {
      preloadedState: { auth: { token: "current-token", isAuthenticated: true, profile: null } },
    } as Parameters<typeof renderWithProviders>[1]);

    await screen.findByText("API and database are ready.");
    await user.click(screen.getByRole("combobox", { name: "Synthetic test client" }));
    await user.click(await screen.findByRole("option", { name: "Synthetic test B" }));

    const dialog = await screen.findByRole("alertdialog", { name: "Switch test client?" });
    expect(dialog).toHaveTextContent("Unsaved changes on this page will be lost.");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalledWith("/__aura_dev/test-login", expect.anything());
  });
});
