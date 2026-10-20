import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/testUtilities";
import EditProfileModal from "./EditProfileModal";

const { mockGetCurrentUser } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
}));

vi.mock("@/store/authApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/store/authApi")>();
  return {
    ...actual,
    useGetCurrentUserQuery: () => mockGetCurrentUser(),
    useUpdateUserMutation: () => [vi.fn()],
  };
});

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
});
