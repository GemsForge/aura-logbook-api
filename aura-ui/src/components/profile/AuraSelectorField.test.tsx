import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/testUtilities";
import { AuraSelector } from "./AuraSelectorField";

/** Minimal form for the selector; the profile form no longer edits aura color. */
type AuraFormValues = { auraColor: string; auraIntensity: number };

function AuraSelectorHarness() {
  const { control, watch } = useForm<AuraFormValues>({
    defaultValues: { auraColor: "blue", auraIntensity: 50 },
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
    expect(screen.getAllByRole("option")).toHaveLength(2);
    await user.click(screen.getByRole("option", { name: /green/i }));

    expect(screen.getByTestId("selected-aura")).toHaveTextContent("green");
  });
});
