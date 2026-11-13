import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/testUtilities";
import EditProfileModal from "./EditProfileModal";

const { mockGetCurrentUser, mockUpdateUser, mockUnwrap, mockGetReferenceData } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockUnwrap: vi.fn(),
  mockGetReferenceData: vi.fn(),
}));

// The preset catalog is local; profile tests never send birth details to a location service.
vi.mock("countrycitystatejson/client", () => ({
  getCountries: () => [{ name: "United States", shortName: "US" }],
  getStatesByShort: () => ["Illinois"],
  getCities: async () => ["Chicago"],
}));

vi.mock("@/store/authApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/store/authApi")>();
  return {
    ...actual,
    useGetCurrentUserQuery: () => mockGetCurrentUser(),
    useUpdateUserMutation: () => [mockUpdateUser],
  };
});

vi.mock("@/store/referenceDataApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/store/referenceDataApi")>();
  return { ...actual, useGetReferenceDataQuery: () => mockGetReferenceData() };
});

import { testReferenceData } from "@/test/referenceDataFixtures";

const baseUser = {
  id: 1,
  email: "gem@example.com",
  displayName: "Gem",
  birthday: "1990-01-01",
  zodiacSign: "Capricorn",
  selectedPathway: "Mindfulness",
};

describe("EditProfileModal", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockReset();
    mockUpdateUser.mockReset();
    mockUnwrap.mockReset();
    mockGetReferenceData.mockReturnValue({ data: testReferenceData, isError: false });
    mockUpdateUser.mockReturnValue({ unwrap: mockUnwrap });
    mockUnwrap.mockResolvedValue({});
  });

  it("shows missing birth fields before sending and saves the completed details with consent", async () => {
    const user = userEvent.setup();
    mockGetCurrentUser.mockReturnValue({ data: { ...baseUser, selectedPathway: "energy" }, isFetching: false });
    renderWithProviders(<EditProfileModal open onClose={vi.fn()} />);

    await user.click(await screen.findByRole("tab", { name: "My Pathway" }));
    await user.click(screen.getByRole("checkbox", { name: "Save optional birth details" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByText("Enter your birth time")).toBeVisible();
    expect(screen.getByText("Enter your birthplace")).toBeVisible();
    expect(screen.getByLabelText("Birth time")).toHaveAttribute("aria-invalid", "true");
    expect(mockUpdateUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Birth time"), { target: { value: "08:30" } });
    await user.click(screen.getByRole("combobox", { name: "Birth country" }));
    await user.click(screen.getByRole("option", { name: "United States" }));
    await user.click(screen.getByRole("combobox", { name: "Birth state or region" }));
    await user.click(screen.getByRole("option", { name: "Illinois" }));
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Birth city" })).toBeEnabled());
    await user.click(screen.getByRole("combobox", { name: "Birth city" }));
    await user.click(screen.getByRole("option", { name: "Chicago" }));
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
      selectedPathway: "energy",
      pathwayPreferences: expect.objectContaining({ saveBirthDetails: true, birthTime: "08:30", birthPlace: "Chicago, Illinois, US" }),
    })));
  });

  it.each([
    { label: /Faith & Religion/, key: "faith", modules: ["faith-practice-check-in", "sacred-texts"] },
    { label: /Mindful Living/, key: "mindfulness", modules: ["mindfulness-guide", "practice-log"] },
  ])("keeps previously consented birth details in the profile body when switching to $key", async ({ label, key, modules }) => {
    mockGetCurrentUser.mockReturnValue({ data: { ...baseUser, selectedPathway: "energy", pathwayPreferences: { focus: ["daily-astrology"], breathingEnabled: true, saveBirthDetails: true, birthTime: "08:30", birthPlace: "Chicago, US" } }, isFetching: false });
    renderWithProviders(<EditProfileModal open onClose={vi.fn()} />);
    fireEvent.click(await screen.findByRole("tab", { name: "My Pathway" }));
    fireEvent.click(screen.getByRole("radio", { name: label }));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
      selectedPathway: key,
      pathwayPreferences: expect.objectContaining({ focus: modules, saveBirthDetails: true, birthTime: "08:30", birthPlace: "Chicago, US" }),
    })));
  });

  it("clears previously saved birth details only after the save choice is unchecked", async () => {
    mockGetCurrentUser.mockReturnValue({ data: { ...baseUser, selectedPathway: "energy", pathwayPreferences: { focus: ["daily-astrology"], breathingEnabled: true, saveBirthDetails: true, birthTime: "08:30", birthPlace: "Chicago, US" } }, isFetching: false });
    renderWithProviders(<EditProfileModal open onClose={vi.fn()} />);
    fireEvent.click(await screen.findByRole("tab", { name: "My Pathway" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Save optional birth details" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
      pathwayPreferences: expect.objectContaining({ saveBirthDetails: false, birthTime: null, birthPlace: null }),
    })));
  });

  it("lets a legacy mindful profile explicitly turn off both default modules", async () => {
    mockGetCurrentUser.mockReturnValue({ data: { ...baseUser, selectedPathway: "mindfulness", pathwayPreferences: { focus: ["calm", "rest"] } }, isFetching: false });
    renderWithProviders(<EditProfileModal open onClose={vi.fn()} />);
    fireEvent.click(await screen.findByRole("tab", { name: "My Pathway" }));
    fireEvent.click(screen.getByLabelText("Show Mindful Living"));
    fireEvent.click(screen.getByLabelText("Show Practice log"));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
      pathwayPreferences: expect.objectContaining({ focus: [] }),
    })));
  });

  it.each([
    { status: 400, data: "Provide both birth time and birthplace when choosing to save chart details." },
    { status: "PARSING_ERROR", originalStatus: 400, data: "Provide both birth time and birthplace when choosing to save chart details." },
    { status: 400, data: { errors: { BirthTime: ["Provide both birth time and birthplace when choosing to save chart details."] } } },
  ])("shows the API validation reason for a rejected profile save ($status)", async (error) => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockGetCurrentUser.mockReturnValue({ data: { ...baseUser, selectedPathway: "energy" }, isFetching: false });
    mockUnwrap.mockRejectedValueOnce(error);
    renderWithProviders(<EditProfileModal open onClose={onClose} />);

    await user.click(await screen.findByRole("button", { name: "Save Changes" }));

    expect(await screen.findByText("Provide both birth time and birthplace when choosing to save chart details.")).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([
    {
      description: "missing color",
      auraColor: undefined,
      auraIntensity: 500,
    },
    {
      description: "unknown color and intensity",
      auraColor: "teal",
      auraIntensity: 250,
    },
    {
      description: "supported color",
      auraColor: "green",
      auraIntensity: 700,
    },
  ])("renders safely for a profile with $description", async (aura) => {
    mockGetCurrentUser.mockReturnValue({
      data: {
        ...baseUser,
        auraColor: aura.auraColor,
        auraIntensity: aura.auraIntensity,
      },
      isFetching: false,
    });

    renderWithProviders(<EditProfileModal open onClose={vi.fn()} />);

    expect(
      await screen.findByRole("dialog", { name: "Edit Profile" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save Changes" })
    ).toBeInTheDocument();
  });

  it("previews a selected interface theme before saving it", async () => {
    const user = userEvent.setup();
    mockGetCurrentUser.mockReturnValue({
      data: {
        ...baseUser,
        avatar: "",
        auraColor: "blue",
        auraIntensity: 50,
        interfaceTheme: "Aurora",
      },
      isFetching: false,
    });

    const { store } = renderWithProviders(<EditProfileModal open onClose={vi.fn()} />);

    await user.click(await screen.findByRole("tab", { name: "Appearance" }));
    await user.click(await screen.findByRole("radio", { name: /Ocean/i }));

    expect(store.getState().ui.interfaceThemePreview).toBe("Ocean");
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("reveals the section holding the first validation error on save", async () => {
    const user = userEvent.setup();
    mockGetCurrentUser.mockReturnValue({
      data: { ...baseUser, avatar: "", auraColor: "blue", auraIntensity: 50, email: "not-an-email" },
      isFetching: false,
    });

    renderWithProviders(<EditProfileModal open onClose={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: "Save Changes" }));

    expect(await screen.findByRole("tab", { name: "Account and security" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText("Enter a valid email")).toBeVisible();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});
