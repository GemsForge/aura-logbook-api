import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import type { EditProfileFormData } from "@/features/auth/models/EditProfileSchema";
import { renderWithProviders } from "@/test/testUtilities";
import { AuraSelector } from "./AuraSelectorField";

function AuraSelectorHarness() {
  const { control, watch } = useForm<EditProfileFormData>({
    defaultValues: { auraColor: "blue", auraIntensity: 500 },
  });

  return (
    <>
      <AuraSelector
        control={control}
        colorField="auraColor"
        intensityField="auraIntensity"
      />
      <output data-testid="selected-aura">{watch("auraColor")}</output>
    </>
  );
}

describe("AuraSelector", () => {
  it("updates the React Hook Form value from the Joy Select", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuraSelectorHarness />);

    await user.click(screen.getByRole("combobox", { name: "Aura Color" }));
    await user.click(screen.getByRole("option", { name: /red/i }));

    expect(screen.getByTestId("selected-aura")).toHaveTextContent("red");
  });
});
