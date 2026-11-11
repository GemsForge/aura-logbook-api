import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EditProfileFormData } from "@/features/auth/models/EditProfileSchema";
import { mockGeolocation } from "@/test/geolocation";
import { renderWithProviders } from "@/test/testUtilities";
import { WeatherLocationField } from "./WeatherLocationField";

let latestMode = "";

/** Minimal form host that exposes the chosen mode for assertions. */
function Harness() {
  const form = useForm<EditProfileFormData>({ defaultValues: { weatherLocationMode: "Off", temperatureUnit: "F" } });
  latestMode = form.watch("weatherLocationMode");
  return <WeatherLocationField control={form.control} setValue={form.setValue} errors={form.formState.errors} />;
}

afterEach(() => vi.unstubAllGlobals());

/** #331: permission is requested only from this setting, and failures offer a typed city. */
describe("WeatherLocationField", () => {
  it("starts off and asks for no location until the user chooses device location", async () => {
    const getCurrentPosition = mockGeolocation({ coords: { latitude: 10.123, longitude: 20.456 } });
    renderWithProviders(<Harness />);
    expect(screen.getByRole("radio", { name: "Off" })).toBeChecked();
    expect(getCurrentPosition).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("radio", { name: "This device’s location" }));

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(latestMode).toBe("Device"));
    expect(screen.getByRole("status")).toHaveTextContent(/rounded to your area/i);
  });

  it.each([
    [1, /permission was turned off/i],
    [2, /couldn’t find its location/i],
    [3, /took too long/i],
  ] as const)("explains error %i, stays on the previous choice, and offers a typed city", async (code, copy) => {
    mockGeolocation({ errorCode: code });
    renderWithProviders(<Harness />);

    await userEvent.click(screen.getByRole("radio", { name: "This device’s location" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(copy);
    expect(latestMode).toBe("Off");
    await userEvent.click(screen.getByRole("button", { name: "Type a city instead" }));
    expect(latestMode).toBe("City");
    expect(screen.getByLabelText("City")).toBeInTheDocument();
  });

  it("shows city fields only for a typed city", async () => {
    mockGeolocation({ errorCode: 1 });
    renderWithProviders(<Harness />);
    expect(screen.queryByLabelText("City")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "A city I type" }));
    expect(screen.getByLabelText("City")).toBeInTheDocument();
  });
});
