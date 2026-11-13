import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BirthplaceSelect } from "./BirthplaceSelect";

const { cities } = vi.hoisted(() => ({ cities: vi.fn() }));
// Small deterministic presets exercise cascades without loading real city chunks or using a network.
vi.mock("countrycitystatejson/client", () => ({
  getCountries: () => [{ name: "United States", shortName: "US" }, { name: "Canada", shortName: "CA" }, { name: "Empty", shortName: "XX" }],
  getStatesByShort: (country: string) => country === "US" ? ["Illinois", "Empty region"] : country === "CA" ? ["Ontario"] : [],
  getCities: cities,
}));

async function choose(label: string, option: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: label }));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("BirthplaceSelect", () => {
  beforeEach(() => { cities.mockReset(); cities.mockResolvedValue(["Chicago"]); });

  it("serializes listed city and full region then clears downstream selections", async () => {
    const onChange = vi.fn();
    render(<BirthplaceSelect value="" onChange={onChange} />);
    expect(screen.getByRole("combobox", { name: "Birth state or region" })).toBeDisabled();
    await choose("Birth country", "United States");
    await choose("Birth state or region", "Illinois");
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Birth city" })).toBeEnabled());
    await choose("Birth city", "Chicago");
    expect(onChange).toHaveBeenLastCalledWith("Chicago, Illinois, US");
    await choose("Birth country", "Canada");
    expect(onChange).toHaveBeenLastCalledWith("");
    expect(screen.getByRole("combobox", { name: "Birth state or region" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Birth city" })).toBeDisabled();
  });

  it("supports keyboard preset selection and rejects unlisted typing", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BirthplaceSelect value="" onChange={onChange} />);
    const country = screen.getByRole("combobox", { name: "Birth country" });
    await user.type(country, "United");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(country).toHaveValue("United States");
    await choose("Birth state or region", "Illinois");
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Birth city" })).toBeEnabled());
    await user.type(screen.getByRole("combobox", { name: "Birth city" }), "Unlisted place");
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears the committed birthplace when its city is explicitly cleared", async () => {
    const onChange = vi.fn();
    render(<BirthplaceSelect value="" onChange={onChange} />);
    await choose("Birth country", "United States");
    await choose("Birth state or region", "Illinois");
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Birth city" })).toBeEnabled());
    await choose("Birth city", "Chicago");
    // Each autocomplete has its own clear action; scope it to the city control.
    const cityControl = screen.getByRole("combobox", { name: "Birth city" }).closest(".MuiAutocomplete-root")!;
    await userEvent.click(cityControl.querySelector('button[title="Clear"]')!);
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  it("retains a saved legacy string while opening and beginning an incomplete replacement", async () => {
    const onChange = vi.fn();
    const { unmount } = render(<BirthplaceSelect value="Chicago, US" onChange={onChange} />);
    expect(screen.getByText("Saved birthplace: Chicago, US")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Change birthplace" }));
    await choose("Birth country", "United States");
    await choose("Birth state or region", "Illinois");
    unmount();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("explains missing state and city options without inventing a place", async () => {
    cities.mockResolvedValue([]);
    const onChange = vi.fn();
    render(<BirthplaceSelect value="" onChange={onChange} />);
    await choose("Birth country", "Empty");
    expect(screen.getByText("No states or regions are listed for this country.")).toBeVisible();
    await choose("Birth country", "United States");
    await choose("Birth state or region", "Empty region");
    expect(await screen.findByText(/No cities are listed/)).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("allows retry after a lazy city chunk fails", async () => {
    cities.mockRejectedValueOnce(new Error("chunk unavailable")).mockResolvedValueOnce(["Chicago"]);
    render(<BirthplaceSelect value="" onChange={vi.fn()} />);
    await choose("Birth country", "United States");
    await choose("Birth state or region", "Illinois");
    expect(await screen.findByRole("alert")).toHaveTextContent("Cities could not be loaded");
    await userEvent.click(screen.getByRole("button", { name: "Retry cities" }));
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Birth city" })).toBeEnabled());
    expect(cities).toHaveBeenCalledTimes(2);
  });

  it("ignores a stale city response after the country changes", async () => {
    let finish!: (value: string[]) => void;
    cities.mockReturnValueOnce(new Promise<string[]>((resolve) => { finish = resolve; })).mockResolvedValueOnce(["Toronto"]);
    render(<BirthplaceSelect value="" onChange={vi.fn()} />);
    await choose("Birth country", "United States");
    await choose("Birth state or region", "Illinois");
    await choose("Birth country", "Canada");
    await choose("Birth state or region", "Ontario");
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Birth city" })).toBeEnabled());
    await act(async () => finish(["Chicago"]));
    await userEvent.click(screen.getByRole("combobox", { name: "Birth city" }));
    expect(screen.getByRole("option", { name: "Toronto" })).toBeVisible();
    expect(screen.queryByRole("option", { name: "Chicago" })).not.toBeInTheDocument();
  });
});
