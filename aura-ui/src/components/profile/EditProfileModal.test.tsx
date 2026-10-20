import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/testUtilities";
import EditProfileModal from "./EditProfileModal";

const { mockGetCurrentUser, mockUpdateUser, mockUnwrap } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockUnwrap: vi.fn(),
}));

vi.mock("@/store/authApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/store/authApi")>();
  return {
    ...actual,
    useGetCurrentUserQuery: () => mockGetCurrentUser(),
    useUpdateUserMutation: () => [mockUpdateUser],
  };
});

vi.mock("@/store/referenceDataApi", () => ({
  useGetAuraColorsQuery: () => ({ data: [] }),
}));

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
    mockUpdateUser.mockReturnValue({ unwrap: mockUnwrap });
    mockUnwrap.mockResolvedValue({});
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

  it("saves a persisted profile with no avatar and a percentage intensity", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockGetCurrentUser.mockReturnValue({
      data: {
        ...baseUser,
        avatar: "",
        auraColor: "blue",
        auraIntensity: 50,
      },
      isFetching: false,
    });

    renderWithProviders(<EditProfileModal open onClose={onClose} />);

    await user.click(
      await screen.findByRole("button", { name: "Save Changes" })
    );

    await waitFor(() =>
      expect(mockUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          avatar: "",
          auraColor: "blue",
          auraIntensity: 50,
        })
      )
    );
    expect(mockUnwrap).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
